const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const undeployRouter = require('./undeployer');

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
        
        exec(command, { maxBuffer: 1024 * 500, env }, (error, stdout, stderr) => {
            if (error) {
                reject(stderr || stdout || error.message);
            } else {
                resolve(stdout);
            }
        });
    });
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
        return true;
    } catch (error) {
        throw new Error(`Vérification des prérequis échouée: ${error.message}`);
    }
}

// Route pour le déploiement
router.post('/', async (req, res) => {
    const { helmChartUrl, releaseName, namespace } = req.body;

    if (!helmChartUrl || !releaseName || !namespace) {
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

        // Créer un ServiceAccount
        const saYaml = `apiVersion: v1
kind: ServiceAccount
metadata:
  name: sa-${namespace}
  namespace: ${namespace}`;
        
        await execCommand(`echo '${saYaml}' | kubectl apply -f -`);

        // Créer un Role
        const roleYaml = `apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: role-${namespace}
  namespace: ${namespace}
rules:
  - apiGroups: ["", "apps", "extensions"]
    resources: ["pods", "services", "deployments"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
  - apiGroups: ["batch"]
    resources: ["jobs", "cronjobs"]
    verbs: ["*"]`;
        
        await execCommand(`echo '${roleYaml}' | kubectl apply -f -`);

        // Créer un RoleBinding
        const bindingYaml = `apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: binding-${namespace}
  namespace: ${namespace}
subjects:
  - kind: ServiceAccount
    name: sa-${namespace}
    namespace: ${namespace}
roleRef:
  kind: Role
  name: role-${namespace}
  apiGroup: rbac.authorization.k8s.io`;
        
        await execCommand(`echo '${bindingYaml}' | kubectl apply -f -`);

        // Déployer le chart Helm
        const helmOutput = await execCommand(
            `helm upgrade --install ${releaseName} ${helmChartUrl} --namespace ${namespace} --create-namespace`
        );

        res.json({ message: 'Déploiement lancé avec succès', output: helmOutput });
    } catch (err) {
        console.error('Erreur de déploiement:', err);
        res.status(500).json({ 
            error: 'Erreur lors du déploiement', 
            details: err.toString(),
            message: 'Vérifiez que vous avez les permissions nécessaires pour accéder à Kubernetes et Helm'
        });
    }
});

module.exports = {
    deployRouter: router,
    undeployRouter: undeployRouter
};
