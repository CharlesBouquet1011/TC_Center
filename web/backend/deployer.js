const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const undeployRouter = require('./undeployer');
const yaml = require('yaml');

// Fonction pour exécuter des commandes shell
function execCommand(command) {
    return new Promise((resolve, reject) => {
        // Copier le fichier de configuration k3s dans le répertoire de l'utilisateur
        const k3sConfig = fs.readFileSync('/etc/rancher/k3s/k3s.yaml', 'utf8');
        const kubeConfigPath = path.join(os.homedir(), '.kube', 'config');
        
        // Assurer que le répertoire .kube existe
        if (!fs.existsSync(path.dirname(kubeConfigPath))) {
            fs.mkdirSync(path.dirname(kubeConfigPath), { recursive: true });
        }
        
        // Écrire la configuration
        fs.writeFileSync(kubeConfigPath, k3sConfig);
        
        // Définir KUBECONFIG pour la commande
        const env = { ...process.env, KUBECONFIG: kubeConfigPath };
        
        // Ajouter sudo aux commandes kubectl et helm
        const finalCommand = command.replace(/^(kubectl|helm)/, 'sudo $1');
        
        exec(finalCommand, { maxBuffer: 1024 * 500, env }, (error, stdout, stderr) => {
            if (error) {
                reject(stderr || stdout || error.message);
            } else {
                resolve(stdout);
            }
        });
    });
}

// Fonction pour récupérer les fichiers depuis GitLab
async function fetchFromGitLab(gitlabUrl, token, branch) {
    try {
        // Créer un répertoire temporaire pour le clone
        const tempDir = path.join(os.tmpdir(), 'gitlab-deploy-' + Date.now());
        fs.mkdirSync(tempDir, { recursive: true });

        // Nettoyer l'URL GitLab
        let cleanUrl = gitlabUrl.trim();
        if (cleanUrl.endsWith('.git')) {
            cleanUrl = cleanUrl.slice(0, -4);
        }

        // Construire l'URL de clone avec l'authentification
        const cloneUrl = `https://oauth2:${token}@${cleanUrl.replace('https://', '')}`;

        console.log('Clonage du dépôt avec l\'URL:', cloneUrl);

        // Cloner le dépôt
        try {
            await execCommand(`git clone -b ${branch} ${cloneUrl} ${tempDir}`);
        } catch (error) {
            throw new Error(`Erreur lors du clonage du dépôt: ${error.message}`);
        }

        // Vérifier que les fichiers nécessaires existent
        const requiredFiles = ['Dockerfile', 'Chart.yaml', 'values.yaml'];
        for (const file of requiredFiles) {
            const filePath = path.join(tempDir, file);
            if (!fs.existsSync(filePath)) {
                throw new Error(`Le fichier ${file} est manquant dans le dépôt`);
            }
        }

        return tempDir;
    } catch (error) {
        throw new Error(`Erreur lors de la récupération des fichiers depuis GitLab: ${error.message}`);
    }
}

// Fonction pour créer les quotas par défaut
async function createDefaultQuotas(namespace) {
    // Créer le ResourceQuota
    const quotaYaml = `apiVersion: v1
kind: ResourceQuota
metadata:
  name: ${namespace}-quota
  namespace: ${namespace}
spec:
  hard:
    requests.cpu: "2"
    requests.memory: 2Gi
    limits.cpu: "4"
    limits.memory: 4Gi
    pods: "10"
    services: "5"
    persistentvolumeclaims: "5"
    secrets: "10"
    configmaps: "10"`;

    // Créer le LimitRange
    const limitRangeYaml = `apiVersion: v1
kind: LimitRange
metadata:
  name: ${namespace}-limits
  namespace: ${namespace}
spec:
  limits:
  - default:
      cpu: "1"
      memory: 512Mi
    defaultRequest:
      cpu: "0.5"
      memory: 256Mi
    type: Container`;

    try {
        await execCommand(`echo '${quotaYaml}' | kubectl apply -f -`);
        await execCommand(`echo '${limitRangeYaml}' | kubectl apply -f -`);
        console.log(`Quotas créés pour le namespace ${namespace}`);
    } catch (error) {
        console.error(`Erreur lors de la création des quotas pour ${namespace}:`, error);
        throw error;
    }
}

// Vérification des prérequis
async function checkPrerequisites() {
    try {
        // Vérifier l'accès à Kubernetes
        await execCommand('kubectl cluster-info');
        // Vérifier l'accès à Helm
        await execCommand('helm version');
        // Vérifier l'accès à Git
        await execCommand('git --version');
        return true;
    } catch (error) {
        throw new Error(`Vérification des prérequis échouée: ${error.message}`);
    }
}

// Route pour le déploiement
router.post('/', async (req, res) => {
    const { gitlabUrl, gitlabToken, branch, namespace } = req.body;

    if (!gitlabUrl || !gitlabToken || !branch || !namespace) {
        return res.status(400).json({
            error: 'Erreur lors du déploiement',
            details: 'Des paramètres sont manquants.',
        });
    }

    try {
        // Vérifier les prérequis
        await checkPrerequisites();

        // Créer un namespace
        await execCommand(`kubectl create namespace ${namespace} --dry-run=client -o yaml | kubectl apply -f -`);

        // Créer les quotas par défaut
        await createDefaultQuotas(namespace);

        // Récupérer les fichiers depuis GitLab
        const tempDir = await fetchFromGitLab(gitlabUrl, gitlabToken, branch);

        // Trouver le nom de la release
        let releaseName = null;
        const chartPath = path.join(tempDir, 'Chart.yaml');
        if (fs.existsSync(chartPath)) {
            const chartContent = fs.readFileSync(chartPath, 'utf8');
            try {
                const chartObj = yaml.parse(chartContent);
                if (chartObj && chartObj.name) {
                    releaseName = chartObj.name;
                }
            } catch (e) {
                // ignore parse error, fallback below
            }
        }
        if (!releaseName) {
            // Utiliser le nom du dossier du dépôt
            releaseName = path.basename(gitlabUrl, '.git');
        }

        // Construire l'image Docker
        const imageName = `${releaseName}:latest`;
        await execCommand(`docker build -t ${imageName} ${tempDir}`);

        // Taguer et pousser l'image sur le registre local
        const localRegistryImage = `localhost:5000/${releaseName}:latest`;
        await execCommand(`docker tag ${imageName} ${localRegistryImage}`);
        await execCommand(`docker push ${localRegistryImage}`);

        // Déployer le chart Helm depuis le répertoire local avec l'image du registre local
        const helmOutput = await execCommand(
            `helm upgrade --install ${releaseName} ${tempDir} --namespace ${namespace} --create-namespace --set image.repository=localhost:5000/${releaseName} --set image.tag=latest`
        );

        // Nettoyer le répertoire temporaire
        fs.rmSync(tempDir, { recursive: true, force: true });

        res.json({ message: 'Déploiement lancé avec succès', output: helmOutput });
    } catch (err) {
        console.error('Erreur de déploiement:', err);
        res.status(500).json({ 
            error: 'Erreur lors du déploiement', 
            details: err.toString(),
            message: 'Vérifiez que vous avez les permissions nécessaires pour accéder à Kubernetes, Helm, Docker et GitLab Registry'
        });
    }
});

module.exports = {
    deployRouter: router,
    undeployRouter: undeployRouter
};
