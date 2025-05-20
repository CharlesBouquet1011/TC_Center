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

        // Supprimer l'image du registry local
        try {
            await execPromise(`podman rmi localhost:5000/${namespace}/${imageName}:latest`);
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'image du registry:', error);
        }

        // Supprimer l'image de la mémoire
        try {
            await execPromise(`podman rmi ${namespace}/${imageName}:latest`);
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'image de la mémoire:', error);
        }

        res.json({ message: 'Image supprimée avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'image:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression de l\'image' });
    }
});

module.exports = router; 