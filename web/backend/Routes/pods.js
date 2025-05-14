const express = require('express');
const router = express.Router();
const { execCommand } = require('./k3sExec');

// Route pour récupérer les logs d'un pod principal d'une release
router.get('/logs', async (req, res) => {
  const { namespace, release } = req.query;
  if (!namespace || !release) {
    return res.status(400).send('Namespace ou release manquant');
  }
  try {
    process.env.KUBECONFIG = '/etc/rancher/k3s/k3s.yaml';
    // Récupérer le nom du pod principal
    const getPodCmd = `kubectl get pods -n ${namespace} -l app=${release} -o jsonpath='{.items[0].metadata.name}'`;
    let podName = await execCommand(getPodCmd);
    podName = podName.replace(/'/g, '').trim();
    if (!podName) {
      return res.status(404).send('Aucun pod trouvé pour cette release');
    }
    // Récupérer les logs
    const logs = await execCommand(`kubectl logs -n ${namespace} ${podName}`);
    res.type('text/plain').send(logs);
  } catch (err) {
    res.status(500).send('Erreur lors de la récupération des logs : ' + err);
  }
});

// Route pour récupérer les statistiques d'un pod
router.get('/stats', async (req, res) => {
  const { namespace, podName } = req.query;
  if (!namespace || !podName) {
    return res.status(400).json({ error: 'Namespace et nom de pod requis' });
  }
  
  try {
    process.env.KUBECONFIG = '/etc/rancher/k3s/k3s.yaml';
    
    // Récupérer les informations de base du pod
    const podInfoCmd = `kubectl get pod ${podName} -n ${namespace} -o json`;
    const podInfoOutput = await execCommand(podInfoCmd);
    const podInfo = JSON.parse(podInfoOutput);
    
    // Récupérer les métriques du pod (CPU et mémoire)
    let metrics = { cpu: 'N/A', memory: 'N/A' };
    try {
      // Vérifier si metrics-server est disponible
      const topPodCmd = `kubectl top pod ${podName} -n ${namespace} --no-headers`;
      const topOutput = await execCommand(topPodCmd);
      
      // Parser la sortie pour extraire CPU et mémoire
      // Format typique: "podname 10m 15Mi"
      const parts = topOutput.split(/\s+/);
      if (parts.length >= 3) {
        metrics = {
          cpu: parts[1],
          memory: parts[2]
        };
      }
    } catch (metricErr) {
      console.log('Metrics-server non disponible ou autre erreur:', metricErr);
      // Continuer avec des métriques N/A
    }
    
    // Collecter les informations importantes
    const status = podInfo.status?.phase || 'Unknown';
    const restarts = podInfo.status?.containerStatuses?.[0]?.restartCount || 0;
    const startTime = podInfo.status?.startTime || 'Unknown';
    const containers = podInfo.spec?.containers?.length || 0;
    const readyContainers = podInfo.status?.containerStatuses?.filter(c => c.ready).length || 0;
    const ready = `${readyContainers}/${containers}`;
    const hostIP = podInfo.status?.hostIP || 'Unknown';
    const podIP = podInfo.status?.podIP || 'Unknown';
    
    res.json({
      name: podName,
      namespace,
      status,
      ready,
      restarts,
      age: startTime,
      cpu: metrics.cpu,
      memory: metrics.memory,
      hostIP,
      podIP
    });
    
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques du pod', details: err.toString() });
  }
});

// Route pour récupérer les informations IP détaillées d'un pod
router.get('/ip-info', async (req, res) => {
  const { namespace, podName } = req.query;
  if (!namespace || !podName) {
    return res.status(400).json({ error: 'Namespace et nom de pod requis' });
  }
  
  try {
    process.env.KUBECONFIG = '/etc/rancher/k3s/k3s.yaml';
    
    // Récupérer les informations détaillées du pod
    const podInfoCmd = `kubectl get pod ${podName} -n ${namespace} -o json`;
    const podInfoOutput = await execCommand(podInfoCmd);
    const podInfo = JSON.parse(podInfoOutput);
    
    // Récupérer l'adresse IP du serveur pour compléter les informations
    const serverIpCmd = `hostname -I | awk '{print $1}'`;
    const serverIp = (await execCommand(serverIpCmd)).trim();
    
    // Récupérer les informations de service liées au pod s'il en existe
    let serviceInfo = [];
    try {
      const serviceCmd = `kubectl get svc -n ${namespace} -o json`;
      const serviceOutput = await execCommand(serviceCmd);
      const services = JSON.parse(serviceOutput);
      
      // Rechercher les services qui pourraient cibler ce pod
      if (services && services.items) {
        serviceInfo = services.items
          .filter(svc => {
            // Un service cible un pod s'il a un sélecteur qui correspond aux labels du pod
            if (!svc.spec || !svc.spec.selector) return false;
            
            // Vérifier si les labels du pod correspondent aux sélecteurs du service
            const podLabels = podInfo.metadata?.labels || {};
            const svcSelectors = svc.spec.selector;
            
            return Object.entries(svcSelectors).every(([key, value]) => 
              podLabels[key] === value
            );
          })
          .map(svc => ({
            name: svc.metadata.name,
            type: svc.spec.type,
            clusterIP: svc.spec.clusterIP,
            ports: svc.spec.ports.map(port => ({
              name: port.name,
              port: port.port,
              targetPort: port.targetPort,
              nodePort: port.nodePort,
              protocol: port.protocol,
              // Ajouter l'URL d'accès si c'est un NodePort ou LoadBalancer
              url: port.nodePort ? 
                `http://${serverIp}:${port.nodePort}` : 
                undefined
            }))
          }));
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des services:', err);
    }
    
    // Construire l'objet de réponse avec les informations complètes
    const ipInfo = {
      pod: {
        name: podName,
        namespace: namespace,
        podIP: podInfo.status?.podIP || 'Non disponible',
        hostIP: podInfo.status?.hostIP || 'Non disponible'
      },
      node: {
        name: podInfo.spec?.nodeName || 'Non disponible',
        internalIP: serverIp || 'Non disponible'
      },
      services: serviceInfo,
      network: {
        dnsPolicy: podInfo.spec?.dnsPolicy || 'Non disponible',
        hostNetwork: podInfo.spec?.hostNetwork || false
      },
      timestamp: new Date().toISOString()
    };
    
    res.json(ipInfo);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des informations IP', details: err.toString() });
  }
});

module.exports = router; 