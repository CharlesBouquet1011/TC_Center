const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const authenticateToken = require('../middleware/authenticate');

// Route pour supprimer une image
router.post('/delete-image', authenticateToken, async (req, res) => {
    try {
        const { imageName, namespace } = req.body;
        
        if (!imageName || !namespace) {
            return res.status(400).json({ error: 'Nom de l\'image et namespace requis' });
        }

        // Vérifier que l'utilisateur a accès au namespace
        if (req.user.username.toLowerCase() !== namespace.toLowerCase()) {
            return res.status(403).json({ error: 'Accès non autorisé à ce namespace' });
        }

        // Supprimer toutes les versions de l'image du registry local
        try {
            // Supprimer l'image avec le tag latest
            await execPromise(`podman rmi localhost:5000/${imageName}:latest`);
            // Supprimer l'image avec le tag spécifique (si elle existe)
            await execPromise(`podman rmi localhost:5000/${imageName}`);
            // Supprimer l'image sans tag
            await execPromise(`podman rmi localhost:5000/${imageName}`);
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'image du registry:', error);
        }

        // Supprimer toutes les versions de l'image de la mémoire
        try {
            // Supprimer l'image avec le tag latest
            await execPromise(`podman rmi ${imageName}:latest`);
            // Supprimer l'image avec le tag spécifique (si elle existe)
            await execPromise(`podman rmi ${imageName}`);
            // Supprimer l'image sans tag
            await execPromise(`podman rmi ${imageName}`);
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'image de la mémoire:', error);
        }

        res.json({ message: 'Images supprimées avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression des images:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression des images' });
    }
});

module.exports = router; 