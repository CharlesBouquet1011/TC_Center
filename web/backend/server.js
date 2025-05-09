const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes');
const { execSync } = require('child_process');

const app = express();
const port = 3000;

// Lancer le registre Docker privé local si besoin
function ensureLocalRegistry() {
    try {
        // Vérifier si le conteneur existe déjà
        const result = execSync('docker ps --filter "name=registry" --filter "ancestor=registry:2" --format "{{.ID}}"').toString().trim();
        if (!result) {
            console.log('Lancement du registre Docker privé local sur le port 5000...');
            execSync('docker run -d -p 5000:5000 --restart=always --name registry registry:2');
        } else {
            console.log('Le registre Docker privé local est déjà lancé.');
        }
    } catch (err) {
        console.error('Erreur lors du lancement du registre Docker privé local :', err.message);
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
