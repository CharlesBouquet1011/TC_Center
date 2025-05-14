const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const { deployRouter, undeployRouter } = require('./Routes/deployer');
const portInfoRouter = require('./Routes/portinfo');
const { execCommand } = require('./Routes/k3sExec');
const bcrypt = require('bcrypt');
const authenticateToken = require('./middleware/authenticate');
const authRoutes = require('./Routes/auth');
const sessionRoutes = require('./Routes/session');
const releasesRoutes = require('./Routes/releases');


// Route pour le déploiement
router.use('/deploy', deployRouter);

// Route pour la suppression
router.use('/undeploy', undeployRouter);

// Route pour les informations de port
router.use('/ports', portInfoRouter);

router.use('/auth', authRoutes);
router.use('/sessions', authenticateToken, sessionRoutes);
router.use('/releases', authenticateToken, releasesRoutes);


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

module.exports = router;
