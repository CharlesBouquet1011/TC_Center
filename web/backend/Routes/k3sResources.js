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

// Route pour récupérer les statistiques simplifiées des ressources des pods
router.get('/resources', async (req, res) => {
  const { namespace } = req.query;
  
  if (!namespace) {
    return res.status(400).json({ error: 'Namespace requis' });
  }

  try {
    process.env.KUBECONFIG = '/etc/rancher/k3s/k3s.yaml';
    
    // Récupérer les pods dans le namespace
    const podsOutput = await execCommand(`kubectl get pods -n ${namespace} -o json`);
    const podsData = JSON.parse(podsOutput);
    
    // Récupérer les métriques d'utilisation
    let metricsOutput = '';
    let metrics = {};
    try {
      metricsOutput = await execCommand(`kubectl top pods -n ${namespace} --no-headers`);
      
      // Parser les métriques (format: "podname 10m 15Mi")
      if (metricsOutput) {
        metricsOutput.split('\n').filter(line => line.trim()).forEach(line => {
          const parts = line.split(/\s+/);
          if (parts.length >= 3) {
            metrics[parts[0]] = {
              name: parts[0],
              cpu: parts[1],
              memory: parts[2]
            };
          }
        });
      }
    } catch (err) {
      console.log('Metrics-server non disponible ou erreur:', err);
      // Continuer avec un objet metrics vide
    }
    
    // Récupérer l'utilisation du stockage
    const podsList = [];
    
    // Traiter tous les pods, même sans métriques
    for (const pod of podsData.items) {
      const podName = pod.metadata.name;
      let cpuValue = '0m';
      let memoryValue = '0Mi';
      
      // Utiliser les métriques si disponibles
      if (metrics[podName]) {
        cpuValue = metrics[podName].cpu;
        memoryValue = metrics[podName].memory;
      }
      
      // Obtenir la taille du stockage utilisé si possible (PVC)
      let storage = 'N/A';
      try {
        // Si le pod utilise un PVC, récupérer l'utilisation
        const pvcOutput = await execCommand(`kubectl get pvc -n ${namespace} -o json`);
        const pvcData = JSON.parse(pvcOutput);
        
        // Trouver les PVC liés à ce pod (simplification - prend le premier trouvé)
        for (const pvc of pvcData.items) {
          const claimName = pvc.metadata.name;
          const podVolumes = pod.spec?.volumes || [];
          
          // Vérifier si ce PVC est utilisé par ce pod
          const isUsedByPod = podVolumes.some(vol => 
            vol.persistentVolumeClaim && vol.persistentVolumeClaim.claimName === claimName
          );
          
          if (isUsedByPod) {
            storage = pvc.status?.capacity?.storage || 'N/A';
            break;
          }
        }
      } catch (err) {
        console.log('Erreur lors de la récupération du stockage:', err);
      }
      
      // Ajouter les informations simplifiées
      podsList.push({
        name: podName,
        status: pod.status?.phase || 'Unknown',
        cpu: cpuValue,
        memory: memoryValue,
        storage: storage,
        ready: `${pod.status?.containerStatuses?.filter(c => c.ready).length || 0}/${pod.spec?.containers?.length || 0}`,
        restarts: pod.status?.containerStatuses?.[0]?.restartCount || 0,
        node: pod.spec?.nodeName || 'N/A',
        startTime: pod.status?.startTime
      });
    }
    
    res.json(podsList);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des ressources', details: err.toString() });
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