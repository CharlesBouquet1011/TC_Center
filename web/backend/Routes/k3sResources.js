const express = require('express');
const router = express.Router();
const { execCommand } = require('./k3sExec');

// Route pour lister les releases Helm d'un namespace
router.get('/releases', async (req, res) => {
  const { namespace } = req.query;
  if (!namespace) {
    return res.status(400).json({ error: 'Namespace requis' });
  }

  try {
    process.env.KUBECONFIG = '/etc/rancher/k3s/k3s.yaml';
    const output = await execCommand(`helm list -n ${namespace} -o json`);
    const releases = JSON.parse(output);
    res.json(releases);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des releases', details: err.toString() });
  }
});

// Route pour describe k3s
router.get('/describe', async (req, res) => {
  const { resourceType, resourceName, namespace } = req.query;
  
  if (!resourceType || !resourceName) {
    return res.status(400).json({ error: 'Type de ressource et nom de ressource requis' });
  }

  try {
    process.env.KUBECONFIG = '/etc/rancher/k3s/k3s.yaml';
    let command = `kubectl describe ${resourceType} ${resourceName}`;
    
    if (namespace) {
      command += ` -n ${namespace}`;
    }
    
    const output = await execCommand(command);
    res.type('text/plain').send(output);
  } catch (err) {
    res.status(500).send('Erreur lors de la récupération des informations : ' + err);
  }
});

// Route pour récupérer les ressources d'un type spécifique avec informations détaillées
router.get('/resources', async (req, res) => {
  const { resourceType, namespace } = req.query;
  
  if (!resourceType || !namespace) {
    return res.status(400).json({ error: 'Type de ressource et namespace requis' });
  }

  try {
    process.env.KUBECONFIG = '/etc/rancher/k3s/k3s.yaml';
    
    // Récupérer tous les objets de ce type dans le namespace
    const command = `kubectl get ${resourceType} -n ${namespace} -o json`;
    const output = await execCommand(command);
    const resources = JSON.parse(output);
    
    if (resources && resources.items && resourceType === 'pod') {
      // Récupérer les métriques pour tous les pods
      let metricsOutput = '';
      try {
        metricsOutput = await execCommand(`kubectl top pods -n ${namespace} --no-headers`);
      } catch (err) {
        console.log('Metrics-server non disponible:', err);
      }
      
      // Parser les métriques (format: "podname 10m 15Mi")
      const metricsMap = {};
      if (metricsOutput) {
        metricsOutput.split('\n').filter(line => line.trim()).forEach(line => {
          const parts = line.split(/\s+/);
          if (parts.length >= 3) {
            metricsMap[parts[0]] = {
              cpu: parts[1],
              memory: parts[2]
            };
          }
        });
      }
      
      // Enrichir les informations des pods avec les métriques et les limites
      const enrichedPods = resources.items.map(pod => {
        const podName = pod.metadata.name;
        const metrics = metricsMap[podName] || { cpu: 'N/A', memory: 'N/A' };
        
        // Obtenir les limites et demandes de ressources
        let cpuLimit = 'Non défini';
        let memoryLimit = 'Non défini';
        let cpuRequest = 'Non défini';
        let memoryRequest = 'Non défini';
        
        // Traiter les containers et leurs ressources
        if (pod.spec && pod.spec.containers && pod.spec.containers.length > 0) {
          // Boucle sur tous les containers pour sommer les ressources
          pod.spec.containers.forEach(container => {
            if (container.resources) {
              // Limites de ressources
              if (container.resources.limits) {
                if (container.resources.limits.cpu) {
                  cpuLimit = container.resources.limits.cpu;
                }
                if (container.resources.limits.memory) {
                  memoryLimit = container.resources.limits.memory;
                }
              }
              
              // Demandes de ressources
              if (container.resources.requests) {
                if (container.resources.requests.cpu) {
                  cpuRequest = container.resources.requests.cpu;
                }
                if (container.resources.requests.memory) {
                  memoryRequest = container.resources.requests.memory;
                }
              }
            }
          });
        }
        
        // Calculer les pourcentages d'utilisation si possible
        let cpuPercentage = 'N/A';
        let memoryPercentage = 'N/A';
        
        // Parse CPU limit (Ex: "100m" = 0.1 cores)
        if (cpuLimit !== 'Non défini' && metrics.cpu !== 'N/A') {
          const usedCpu = parseCpu(metrics.cpu);
          const limitCpu = parseCpu(cpuLimit);
          if (limitCpu > 0) {
            cpuPercentage = Math.round((usedCpu / limitCpu) * 100) + '%';
          }
        }
        
        // Parse Memory limit (Ex: "128Mi")
        if (memoryLimit !== 'Non défini' && metrics.memory !== 'N/A') {
          const usedMem = parseMemory(metrics.memory);
          const limitMem = parseMemory(memoryLimit);
          if (limitMem > 0) {
            memoryPercentage = Math.round((usedMem / limitMem) * 100) + '%';
          }
        }
        
        return {
          name: podName,
          namespace: pod.metadata.namespace,
          status: pod.status?.phase || 'Unknown',
          resources: {
            cpu: {
              used: metrics.cpu,
              limit: cpuLimit,
              request: cpuRequest,
              percentage: cpuPercentage
            },
            memory: {
              used: metrics.memory,
              limit: memoryLimit,
              request: memoryRequest,
              percentage: memoryPercentage
            }
          },
          startTime: pod.status?.startTime,
          containers: pod.spec?.containers?.length || 0,
          ready: `${pod.status?.containerStatuses?.filter(c => c.ready).length || 0}/${pod.spec?.containers?.length || 0}`,
          restarts: pod.status?.containerStatuses?.[0]?.restartCount || 0,
          node: pod.spec?.nodeName || 'Unknown',
          ip: pod.status?.podIP || 'Unknown'
        };
      });
      
      res.json(enrichedPods);
    } else {
      // Pour les autres types de ressources, retourner seulement les noms
      const resourcesList = resources.items.map(item => ({
        name: item.metadata.name,
        namespace: item.metadata.namespace
      }));
      res.json(resourcesList);
    }
  } catch (err) {
    res.status(404).json({ error: 'Ressources non trouvées', details: err.toString() });
  }
});

// Fonctions utilitaires pour parser les valeurs de CPU et mémoire

// Convertir CPU en millicores (ex: "100m" -> 100, "0.1" -> 100)
function parseCpu(cpuStr) {
  if (cpuStr.endsWith('m')) {
    return parseInt(cpuStr.slice(0, -1)) || 0;
  } else {
    return parseFloat(cpuStr) * 1000 || 0;
  }
}

// Convertir mémoire en Mo (ex: "128Mi" -> 128, "1Gi" -> 1024)
function parseMemory(memStr) {
  const units = {
    'Ki': 1/1024,
    'Mi': 1,
    'Gi': 1024,
    'Ti': 1024*1024
  };
  
  for (const [unit, factor] of Object.entries(units)) {
    if (memStr.endsWith(unit)) {
      return parseFloat(memStr.slice(0, -unit.length)) * factor || 0;
    }
  }
  
  return parseInt(memStr) || 0; // Si pas d'unité, considérer comme bytes
}

module.exports = router; 