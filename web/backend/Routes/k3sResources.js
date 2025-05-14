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

// Route pour récupérer les ressources d'un type spécifique
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
    
    if (resources && resources.items) {
      const resourcesList = resources.items.map(item => ({
        name: item.metadata.name,
        namespace: item.metadata.namespace
      }));
      res.json(resourcesList);
    } else {
      res.json([]);
    }
  } catch (err) {
    res.status(404).json({ error: 'Ressources non trouvées', details: err.toString() });
  }
});

module.exports = router; 