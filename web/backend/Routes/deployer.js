const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const undeployRouter = require('./undeployer');
const yaml = require('yaml');
const { execCommand } = require('./k3sExec');
const crypto = require('crypto');

const REGISTRY_PORT = 5000;

// Fonction pour récupérer les fichiers depuis GitLab ou GitHub
async function fetchFromGitLab(repoUrl, token, branch, isGenerated = false, hasCustomDockerfile = false) {
    try {
        // Créer un répertoire temporaire pour le clone
        const tempDir = path.join(os.tmpdir(), 'gitlab-deploy-' + Date.now());
        fs.mkdirSync(tempDir, { recursive: true });

        // Nettoyer l'URL
        let cleanUrl = repoUrl.trim();
        if (cleanUrl.endsWith('.git')) {
            cleanUrl = cleanUrl.slice(0, -4);
        }

        let cloneUrl;
        if (cleanUrl.includes('github.com')) {
            // GitHub public - pas besoin de token
            cloneUrl = cleanUrl;
            console.log('Clonage depuis GitHub:', cloneUrl);
            // Forcer le clonage de la dernière version
            await execCommand(`git clone --depth 1 -b ${branch} ${cloneUrl} ${tempDir}`);
            // Mettre à jour les sous-modules si présents
            await execCommand(`cd ${tempDir} && git submodule update --init --recursive`);
        } else {
            // GitLab - utiliser le token
            if (!token) {
                throw new Error('Token GitLab requis pour les dépôts GitLab');
            }
            cloneUrl = `https://oauth2:${token}@${cleanUrl.replace('https://', '')}`;
            console.log('Clonage depuis GitLab:', cloneUrl);
            await execCommand(`git clone -b ${branch} ${cloneUrl} ${tempDir}`);
        }

        // Vérifier que les fichiers nécessaires existent
        const requiredFiles = isGenerated 
            ? (hasCustomDockerfile ? [] : ['Dockerfile'])
            : ['Chart.yaml', 'values.yaml', hasCustomDockerfile ? '' : 'Dockerfile'].filter(Boolean);

        for (const file of requiredFiles) {
            const filePath = path.join(tempDir, file);
            if (!fs.existsSync(filePath)) {
                throw new Error(`Le fichier ${file} est manquant dans le dépôt`);
            }
        }

        return tempDir;
    } catch (error) {
        throw new Error(`Erreur lors de la récupération des fichiers: ${error}`);
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
        await execCommand('kubectl cluster-info');
        await execCommand('helm version');
        await execCommand('podman --version');
        return true;
    } catch (error) {
        throw new Error(`Vérification des prérequis échouée: ${error}`);
    }
}

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

// Fonction pour extraire les ports exposés du Dockerfile
async function extractExposedPorts(dockerfilePath) {
    try {
        const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
        const exposedPorts = [];
        const lines = dockerfileContent.split('\n');
        
        for (const line of lines) {
            if (line.trim().startsWith('EXPOSE')) {
                const ports = line.trim().split(' ').slice(1);
                exposedPorts.push(...ports);
            }
        }
        
        return exposedPorts;
    } catch (error) {
        console.error('Erreur lors de la lecture du Dockerfile:', error);
        return ['80']; // Port par défaut si aucun port n'est trouvé
    }
}

// Fonction pour générer un Helm Chart basique
async function generateHelmChart(tempDir, imageName, exposedPorts) {
    const chartDir = path.join(tempDir, 'helm-chart');
    fs.mkdirSync(chartDir, { recursive: true });
    
    // Créer Chart.yaml
    const chartYaml = `apiVersion: v2
name: ${path.basename(imageName)}
description: Helm Chart généré automatiquement
type: application
version: 0.1.0
appVersion: "1.0.0"`;
    
    fs.writeFileSync(path.join(chartDir, 'Chart.yaml'), chartYaml);
    
    // Créer values.yaml
    const valuesYaml = `replicaCount: 1
image:
  repository: ${imageName}
  tag: latest
  pullPolicy: IfNotPresent
service:
  type: LoadBalancer
  ports:
${exposedPorts.map(port => `    - port: ${port}
      targetPort: ${port}
      protocol: TCP`).join('\n')}
resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 250m
    memory: 256Mi`;
    
    fs.writeFileSync(path.join(chartDir, 'values.yaml'), valuesYaml);
    
    // Créer templates/deployment.yaml
    const deploymentYaml = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}
  labels:
    app: {{ .Release.Name }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      app: {{ .Release.Name }}
  template:
    metadata:
      labels:
        app: {{ .Release.Name }}
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
${exposedPorts.map(port => `            - containerPort: ${port}`).join('\n')}
          resources:
            {{- toYaml .Values.resources | nindent 12 }}`;
    
    fs.mkdirSync(path.join(chartDir, 'templates'), { recursive: true });
    fs.writeFileSync(path.join(chartDir, 'templates', 'deployment.yaml'), deploymentYaml);
    
    // Créer templates/service.yaml
    const serviceYaml = `apiVersion: v1
kind: Service
metadata:
  name: {{ .Release.Name }}
  labels:
    app: {{ .Release.Name }}
spec:
  type: {{ .Values.service.type }}
  ports:
{{- range .Values.service.ports }}
    - port: {{ .port }}
      targetPort: {{ .targetPort }}
      protocol: {{ .protocol }}
{{- end }}
  selector:
    app: {{ .Release.Name }}`;
    
    fs.writeFileSync(path.join(chartDir, 'templates', 'service.yaml'), serviceYaml);
    
    return chartDir;
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

        // Construire l'image Podman
        const imageName = `${releaseName}:latest`;
        await execCommand(`podman build -t ${imageName} ${tempDir}`);

        // Utiliser l'IP réseau du serveur pour le registre
        const registryIp = getLocalIp();
        const registryImage = `${registryIp}:${REGISTRY_PORT}/${releaseName}:latest`;
        await execCommand(`podman tag ${imageName} ${registryImage}`);
        await execCommand(`podman push ${registryImage}`);

        // Déployer le chart Helm depuis le répertoire local avec l'image du registre réseau
        const helmOutput = await execCommand(
            `helm upgrade --install ${releaseName} ${tempDir} --namespace ${namespace} --create-namespace --set image.repository=${registryIp}:${REGISTRY_PORT}/${releaseName} --set image.tag=latest`
        );

        // Nettoyer le répertoire temporaire
        fs.rmSync(tempDir, { recursive: true, force: true });

        res.json({ message: 'Déploiement lancé avec succès', output: helmOutput });
    } catch (err) {
        console.error('Erreur de déploiement:', err);
        res.status(500).json({ 
            error: 'Erreur lors du déploiement', 
            details: err.toString(),
            message: 'Vérifiez que vous avez les permissions nécessaires pour accéder à Kubernetes, Helm, Docker et le registre privé'
        });
    }
});

// Route pour le déploiement avec Helm Chart généré
router.post('/generated', async (req, res) => {
    const { repoUrl, gitlabToken, branch, namespace, sourceType, dockerfileSource, customDockerfile } = req.body;

    if (!repoUrl || !branch || !namespace) {
        return res.status(400).json({
            error: 'Erreur lors du déploiement',
            details: 'Des paramètres sont manquants.',
        });
    }

    if (sourceType === 'gitlab' && !gitlabToken) {
        return res.status(400).json({
            error: 'Erreur lors du déploiement',
            details: 'Token GitLab requis pour les dépôts GitLab.',
        });
    }

    if (dockerfileSource === 'custom' && !customDockerfile) {
        return res.status(400).json({
            error: 'Erreur lors du déploiement',
            details: 'Dockerfile personnalisé requis.',
        });
    }

    let tempDir;
    try {
        // Vérifier les prérequis
        await checkPrerequisites();

        // Créer un namespace
        await execCommand(`kubectl create namespace ${namespace} --dry-run=client -o yaml | kubectl apply -f -`);

        // Créer les quotas par défaut
        await createDefaultQuotas(namespace);

        // Récupérer les fichiers depuis le dépôt
        tempDir = await fetchFromGitLab(repoUrl, gitlabToken, branch, true, dockerfileSource === 'custom');

        // Si Dockerfile personnalisé, l'écrire dans le répertoire temporaire
        if (dockerfileSource === 'custom') {
            console.log('Écriture du Dockerfile personnalisé...');
            fs.writeFileSync(path.join(tempDir, 'Dockerfile'), customDockerfile);
            console.log('Contenu du Dockerfile personnalisé:', customDockerfile);
        }

        // Extraire le nom de l'image du projet Git et le hash du dernier commit
        const repoName = path.basename(repoUrl, '.git');
        let commitHash;
        try {
            commitHash = await execCommand(`cd ${tempDir} && git rev-parse --short HEAD`);
            commitHash = commitHash.trim();
        } catch (error) {
            console.error('Erreur lors de la récupération du hash du commit:', error);
            commitHash = Date.now().toString(36); // Fallback si erreur
        }
        let dockerfileHashSuffix = '';
        if (dockerfileSource === 'custom' && typeof customDockerfile === 'string') {
            try {
                const fullHash = crypto.createHash('sha256').update(customDockerfile).digest('hex');
                dockerfileHashSuffix = `-${fullHash.slice(0, 8)}`; // suffixe court
            } catch (e) {
                console.warn('Impossible de calculer le hash du Dockerfile personnalisé:', e.message);
            }
        }
        const imageName = `${repoName}-${commitHash}${dockerfileHashSuffix}`;

        // Extraire les ports exposés du Dockerfile
        const exposedPorts = await extractExposedPorts(path.join(tempDir, 'Dockerfile'));

        // Générer le Helm Chart
        const chartDir = await generateHelmChart(tempDir, imageName, exposedPorts);

        // Construire l'image Podman avec plus de logs
        const localImageName = `${imageName}:latest`;
        console.log('Début de la construction de l\'image...');
        console.log('Contenu du répertoire temporaire:', fs.readdirSync(tempDir));
        if (fs.existsSync(path.join(tempDir, 'package.json'))) {
            console.log('Contenu du package.json:', fs.readFileSync(path.join(tempDir, 'package.json'), 'utf8'));
        }

        // Vérifier les permissions du répertoire
        try {
            const stats = fs.statSync(tempDir);
            console.log('Permissions du répertoire temporaire:', {
                mode: stats.mode,
                uid: stats.uid,
                gid: stats.gid
            });
        } catch (error) {
            console.error('Erreur lors de la vérification des permissions:', error);
        }

        // Construire l'image avec plus de verbosité et en forçant la reconstruction
        const buildOutput = await execCommand(`podman build --no-cache --progress=plain -t ${localImageName} ${tempDir}`);
        console.log('Sortie de la construction:', buildOutput);

        // Vérifier si l'image a été créée
        try {
            const imageCheck = await execCommand(`podman image inspect ${localImageName}`);
            console.log('Image créée avec succès:', imageCheck);
        } catch (error) {
            console.error('Erreur lors de la vérification de l\'image:', error);
        }

        // Utiliser l'IP réseau du serveur pour le registre
        const registryIp = getLocalIp();
        const registryImage = `${registryIp}:${REGISTRY_PORT}/${imageName}:latest`;
        await execCommand(`podman tag ${localImageName} ${registryImage}`);
        await execCommand(`podman push ${registryImage}`);

        // Déployer le chart Helm généré
        const helmOutput = await execCommand(
            `helm upgrade --install ${imageName} ${chartDir} --namespace ${namespace} --create-namespace --set image.repository=${registryIp}:${REGISTRY_PORT}/${imageName} --set image.tag=latest`
        );

        // Nettoyer le répertoire temporaire après le déploiement
        fs.rmSync(tempDir, { recursive: true, force: true });
        tempDir = null;

        res.json({ message: 'Déploiement lancé avec succès', output: helmOutput });
    } catch (err) {
        console.error('Erreur de déploiement:', err);
        res.status(500).json({ 
            error: 'Erreur lors du déploiement', 
            details: err.toString(),
            message: err.toString()
        });
    } finally {
        // Nettoyage en cas d'erreur
        if (tempDir) {
            try {
                fs.rmSync(tempDir, { recursive: true, force: true });
            } catch (cleanupError) {
                console.error('Erreur lors du nettoyage des fichiers temporaires:', cleanupError);
            }
        }
    }
});

module.exports = {
    deployRouter: router,
    undeployRouter: undeployRouter
};
