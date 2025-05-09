const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Fonction pour exécuter des commandes shell
function execCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, { maxBuffer: 1024 * 500 }, (error, stdout, stderr) => {
            if (error) {
                reject(stderr || stdout || error.message);
            } else {
                resolve(stdout);
            }
        });
    });
}

// Route pour obtenir les informations de port d'une application
router.get('/', async (req, res) => {
    const { releaseName, namespace } = req.query;

    if (!releaseName || !namespace) {
        return res.status(400).json({
            error: 'Paramètres manquants',
            details: 'Le nom de la release et le namespace sont requis.',
        });
    }

    try {
        // Vérifier si le namespace existe
        try {
            await execCommand(`kubectl get namespace ${namespace}`);
        } catch (error) {
            return res.status(404).json({
                error: 'Namespace non trouvé',
                details: `Le namespace ${namespace} n'existe pas.`
            });
        }

        // Vérifier si la release existe
        try {
            await execCommand(`helm status ${releaseName} -n ${namespace}`);
        } catch (error) {
            return res.status(404).json({
                error: 'Release non trouvée',
                details: `La release ${releaseName} n'existe pas dans le namespace ${namespace}.`
            });
        }

        // Obtenir les informations du service
        const serviceInfo = await execCommand(`kubectl get svc ${releaseName} -n ${namespace} -o json`);
        const serviceJson = JSON.parse(serviceInfo);

        // Obtenir l'adresse IP du nœud
        const nodeIP = '10.56.115.76'; // IP de votre machine

        // Construire la réponse avec les informations de port
        const ports = serviceJson.spec.ports.map(port => ({
            name: port.name || 'unnamed',
            protocol: port.protocol,
            port: port.port,
            targetPort: port.targetPort,
            nodePort: port.nodePort,
            url: `http://${nodeIP}:${port.nodePort}`
        }));

        res.json({
            application: releaseName,
            namespace: namespace,
            serviceType: serviceJson.spec.type,
            ports: ports,
            internalDNS: `${releaseName}.${namespace}.svc.cluster.local`,
            accessUrls: ports.map(p => p.url)
        });

    } catch (err) {
        console.error('Erreur lors de la récupération des ports:', err);
        res.status(500).json({ 
            error: 'Erreur lors de la récupération des ports', 
            details: err.toString(),
            message: 'Une erreur est survenue lors de la récupération des informations de port'
        });
    }
});

module.exports = router; 