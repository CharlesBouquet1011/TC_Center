const express = require('express');
const router = express.Router();
const { deployRouter, undeployRouter } = require('./deployer');
const portInfoRouter = require('./portinfo');

// Route pour le déploiement
router.use('/deploy', deployRouter);

// Route pour la suppression
router.use('/undeploy', undeployRouter);

// Route pour les informations de port
router.use('/ports', portInfoRouter);

module.exports = router; 