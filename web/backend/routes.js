const express = require('express');
const router = express.Router();
const { deployRouter, undeployRouter } = require('./deployer');
const portInfoRouter = require('./portinfo');
const { execCommand } = require('./k3sExec');

// Route pour le déploiement
router.use('/deploy', deployRouter);

// Route pour la suppression
router.use('/undeploy', undeployRouter);

// Route pour les informations de port
router.use('/ports', portInfoRouter);

// Nouvelle route pour lister les releases Helm d'un namespace
router.get('/releases', async (req, res) => {
    const { namespace } = req.query;
    if (!namespace) {
        return res.status(400).json({ error: 'Namespace requis' });
    }
    try {
        const output = await execCommand(`helm list -n ${namespace} -o json`);
        const releases = JSON.parse(output);
        res.json(releases);
    } catch (err) {
        res.status(500).json({ error: 'Erreur lors de la récupération des releases', details: err.toString() });
    }
});

module.exports = router; 