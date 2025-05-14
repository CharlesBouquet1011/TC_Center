const express = require('express');
const router = express.Router();
const { deployRouter, undeployRouter } = require('./Routes/deployer');
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

module.exports = router;
