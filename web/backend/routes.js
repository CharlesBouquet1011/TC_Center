const express = require('express');
const router = express.Router();
const { deployRouter, undeployRouter } = require('./Routes/deployer');
const portInfoRouter = require('./Routes/portinfo');
const authenticateToken = require('./middleware/authenticate');
const authRoutes = require('./Routes/auth');
const sessionRoutes = require('./Routes/session');
const releasesRoutes = require('./Routes/releases');
const podsRouter = require('./Routes/pods');
const k3sResourcesRouter = require('./Routes/k3sResources');

// Route pour le déploiement
router.use('/deploy', deployRouter);

// Route pour la suppression
router.use('/undeploy', undeployRouter);

// Route pour les informations de port
router.use('/ports', portInfoRouter);

// Routes d'authentification
router.use('/auth', authRoutes);

// Routes de session
router.use('/sessions', authenticateToken, sessionRoutes);

// Routes pour les releases
router.use('/releases', authenticateToken, releasesRoutes);

// Routes pour les pods
router.use('/pods', podsRouter);

// Routes pour les ressources k3s
router.use('/k3s', k3sResourcesRouter);

// Route de compatibilité pour pod-stats (redirige vers /pods/stats)
router.get('/pod-stats', (req, res) => {
  const { namespace, podName } = req.query;
  res.redirect(`/pods/stats?namespace=${namespace}&podName=${podName}`);
});

// Route de compatibilité pour logs (redirige vers /pods/logs)
router.get('/logs', (req, res) => {
  const { namespace, release } = req.query;
  res.redirect(`/pods/logs?namespace=${namespace}&release=${release}`);
});

module.exports = router;
