const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execCommand } = require('./k3sExec');

// Route pour la suppression d'une application
router.delete('/', async (req, res) => {
    const { releaseName, namespace } = req.body;

    if (!releaseName || !namespace) {
        return res.status(400).json({
            error: 'Erreur lors de la suppression',
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

        // Supprimer les PVC associés à la release
        try {
            const pvcs = await execCommand(`kubectl get pvc -n ${namespace} -l app.kubernetes.io/instance=${releaseName} -o json`);
            const pvcsJson = JSON.parse(pvcs);
            
            if (pvcsJson.items && pvcsJson.items.length > 0) {
                for (const pvc of pvcsJson.items) {
                    await execCommand(`kubectl delete pvc ${pvc.metadata.name} -n ${namespace}`);
                    console.log(`PVC ${pvc.metadata.name} supprimé`);
                }
            } else {
                console.log(`Aucun PVC trouvé pour la release ${releaseName}`);
            }
        } catch (error) {
            // Si la commande retourne une erreur "not found", c'est normal
            if (error.message && error.message.includes('not found')) {
                console.log(`Aucun PVC trouvé pour la release ${releaseName}`);
            } else {
                console.error('Erreur lors de la suppression des PVC:', error);
            }
        }

        // Supprimer la release Helm
        const helmOutput = await execCommand(`helm uninstall ${releaseName} -n ${namespace}`);
        console.log(`Release ${releaseName} supprimée du namespace ${namespace}`);

        // Supprimer les ressources RBAC associées
        await execCommand(`kubectl delete serviceaccount sa-${namespace} -n ${namespace} --ignore-not-found`);
        await execCommand(`kubectl delete role role-${namespace} -n ${namespace} --ignore-not-found`);
        await execCommand(`kubectl delete rolebinding binding-${namespace} -n ${namespace} --ignore-not-found`);

        // Option : supprimer le namespace si plus aucune application n'y est déployée
        const deployments = await execCommand(`kubectl get deployments -n ${namespace} -o json`);
        const deploymentsJson = JSON.parse(deployments);
        
        if (deploymentsJson.items.length === 0) {
            await execCommand(`kubectl delete namespace ${namespace}`);
            console.log(`Namespace ${namespace} supprimé car vide`);
            
            res.json({ 
                message: 'Application et namespace supprimés avec succès',
                details: 'Toutes les ressources ont été nettoyées.',
                output: helmOutput 
            });
        } else {
            res.json({ 
                message: 'Application supprimée avec succès',
                details: 'Le namespace contient encore d\'autres applications.',
                output: helmOutput 
            });
        }
    } catch (err) {
        console.error('Erreur lors de la suppression:', err);
        res.status(500).json({ 
            error: 'Erreur lors de la suppression', 
            details: err.toString(),
            message: 'Une erreur est survenue lors de la suppression de l\'application'
        });
    }
});

module.exports = router; 