const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes');
const { execSync } = require('child_process');

const app = express();
const port = 3000;
const REGISTRY_PORT = 5001; // port rootless

// Lancer le registre Podman rootless local si besoin
function ensureLocalRegistry() {
    try {
        // Vérifier si un conteneur nommé 'registry' existe
        let exists = false;
        try {
            execSync('podman container exists registry');
            exists = true;
        } catch (e) {
            exists = false;
        }
        if (exists) {
            // Le conteneur existe, vérifier s'il est en cours d'exécution
            const running = execSync('podman ps --filter "name=registry" --format "{{.ID}}"').toString().trim();
            if (!running) {
                console.log('Le conteneur registry existe mais n\'est pas lancé, démarrage...');
                execSync('podman start registry');
            } else {
                console.log('Le registre Podman rootless est déjà lancé.');
            }
        } else {
            // Le conteneur n'existe pas, on le crée
            console.log(`Lancement du registre Podman rootless sur le port ${REGISTRY_PORT}...`);
            execSync(`podman run -d -p ${REGISTRY_PORT}:5000 --name registry registry:2`);
        }
    } catch (err) {
        console.error('Erreur lors du lancement du registre Podman rootless :', err.message);
    }
}

ensureLocalRegistry();

// Middleware pour parser le JSON
app.use(bodyParser.json());

// Servir les fichiers statiques
app.use(express.static('public'));

// Utiliser les routes
app.use('/', routes);

// Démarrer le serveur
app.listen(port, () => {
    console.log(`Serveur en écoute sur le port ${port}`);
});
