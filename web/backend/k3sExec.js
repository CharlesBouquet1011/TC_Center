const { exec } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

const KUBECONFIG = path.join(os.homedir(), 'a.yaml');

// Lire et parser le fichier kubeconfig pour obtenir l'URL du serveur
function getK8sServer() {
    try {
        const config = fs.readFileSync(KUBECONFIG, 'utf8');
        const match = config.match(/server: (.+)/);
        return match ? match[1].trim() : null;
    } catch (error) {
        console.error('Erreur lors de la lecture du kubeconfig:', error);
        return null;
    }
}

function execCommand(command) {
    return new Promise((resolve, reject) => {
        const k8sServer = getK8sServer();
        // Si la commande commence par kubectl, ajouter le paramètre --server
        const modifiedCommand = command.startsWith('kubectl') && k8sServer
            ? `${command} --server=${k8sServer}`
            : command;
        const prefixedCommand = `KUBECONFIG=${KUBECONFIG} ${modifiedCommand}`;
        const env = { ...process.env, KUBECONFIG };
        exec(prefixedCommand, { env, maxBuffer: 1024 * 500 }, (error, stdout, stderr) => {
            if (error) {
                reject(stderr || stdout || error.message);
            } else {
                resolve(stdout);
            }
        });
    });
}

module.exports = { execCommand }; 