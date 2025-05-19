const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticate'); 
const { execCommand } = require('./k3sExec');

router.get('/', authenticateToken, async (req, res) => {
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

  module.exports = router;
