# Déployer une application sur TC Center

TC Center est une plateforme de déploiement automatisé qui vous permet de déployer facilement vos applications sur un cluster Kubernetes. Cette plateforme supporte le déploiement depuis GitHub et GitLab avec génération automatique de Helm Charts.

## 1. Types de déploiement supportés

TC Center offre deux modes de déploiement :

### Déploiement automatique (recommandé)
- **GitHub** : Dépôts publics (pas de token requis)
- **GitLab INSA** : Dépôts privés (token requis)
- **Génération automatique** : Helm Chart créé automatiquement
- **Dockerfile** : Utilise le Dockerfile du projet ou permet un Dockerfile personnalisé

### Déploiement avec Helm Chart existant
- Pour les utilisateurs avancés ayant déjà un Helm Chart
- Nécessite un Chart.yaml et values.yaml dans le dépôt

## 2. Exemple d'application

Pour illustrer le déploiement, nous utilisons une application exemple disponible sur [GitHub](https://github.com/sfrenot/wot).

**Test local de l'application :**
```bash
git clone https://github.com/sfrenot/wot.git
cd wot
npm install
node ./index.js
```

**Test de l'application :**
```bash
curl localhost:3030/crawl
```

L'application affiche une analyse d'API publique d'un jeu en ligne et met environ 10s à répondre.
## 3. Préparation de votre application

### Option A : Déploiement automatique (recommandé)

Pour le déploiement automatique, vous avez deux options :

#### 1. Dockerfile dans le projet
Ajoutez un `Dockerfile` à la racine de votre projet :
```Dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
COPY emptyfiles.sh ./ 
RUN chmod +x emptyfiles.sh
RUN npm install
COPY . .
EXPOSE 3030
CMD ["node", "index.js"] 
```

#### 2. Dockerfile personnalisé
Vous pouvez également fournir un Dockerfile personnalisé directement via l'interface TC Center.

### Option B : Déploiement avec Helm Chart existant

Si vous avez déjà un Helm Chart, ajoutez à la racine de votre projet :

**Chart.yaml :**
```yaml
apiVersion: v2
name: wot-app
description: Application World of Tanks
type: application
version: 0.1.0
appVersion: "1.0.0"
```

**values.yaml :**
```yaml
replicaCount: 1
image:
  repository: wot-app
  tag: latest
  pullPolicy: IfNotPresent
service:
  type: LoadBalancer
  ports:
    - port: 3030
      targetPort: 3030
      protocol: TCP
```

> ℹ️ Pour plus d'aide sur les Helm Charts, consultez le [Guide Helm](Guide_helm.md).

## 4. Génération d'un token d'accès (GitLab uniquement)

Pour les dépôts GitLab INSA privés, vous devez créer un token d'accès :

1. Rendez-vous sur [GitLab INSA - Tokens](https://gitlab.insa-lyon.fr/-/profile/personal_access_tokens)
2. Créez un nouveau token avec les scopes :
   - `api`
   - `read_repository`
3. Donnez-lui un nom explicite (ex: `deploy-token-tc-center`)
4. **Copiez le token** : vous ne pourrez plus le voir après validation

> ℹ️ **GitHub** : Aucun token requis pour les dépôts publics.

## 5. Accéder à la plateforme TC Center

Rendez-vous sur http://134.214.202.221:3000/.

- Si vous êtes nouveau, créez un compte avec votre email et nom d'utilisateur.
- Sinon, connectez-vous avec vos identifiants.

## 6. Déployer une application

### Étape 1 — Configuration du déploiement

Une fois connecté, vous accédez au tableau de bord de déploiement :

1. **Type de déploiement** : Sélectionnez "Déploiement automatique" (recommandé)
2. **Source du code** : Choisissez entre :
   - **GitHub (Public)** : Pour les dépôts GitHub publics
   - **GitLab INSA** : Pour les dépôts GitLab INSA privés

### Étape 2 — Renseigner les informations

**URL du projet :**
- GitHub : `https://github.com/username/project.git`
- GitLab : `https://gitlab.insa-lyon.fr/username/project.git`

**Token GitLab** (uniquement pour GitLab INSA) :
- Collez le token généré à l'étape 4

**Branche :**
- Par défaut : `main` (ou `master` selon votre projet)

**Source du Dockerfile :**
- **Dockerfile fourni dans le dépôt** : Utilise le Dockerfile du projet
- **Dockerfile personnalisé** : Permet de saisir un Dockerfile personnalisé

### Étape 3 — Lancement du déploiement

Cliquez sur "Déployer" pour lancer le processus :

1. **Clonage** du dépôt Git
2. **Construction** de l'image Docker avec Podman
3. **Génération automatique** du Helm Chart
4. **Déploiement** sur le cluster Kubernetes
5. **Création** du namespace utilisateur avec quotas

### Étape 4 — Résultat

Une fois le déploiement terminé :

- ✅ **Succès** : Message de confirmation avec détails du déploiement
- ❌ **Erreur** : Message d'erreur avec détails pour diagnostic

En cas d'erreur, vérifiez :
- L'URL du dépôt
- La présence d'un Dockerfile (ou fournissez un Dockerfile personnalisé)
- La validité du token GitLab (si applicable)


## 7. Ouvrir un terminal dans votre pod

TC Center vous permet d'accéder directement à vos pods via un terminal web intégré. Pour cela :

1. Sélectionnez votre pod dans le menu déroulant de la section "Gestion des Pods"
2. Cliquez sur le bouton "Ouvrir Terminal"
3. Un terminal interactif s'ouvrira, vous permettant d'exécuter des commandes directement dans votre pod

Le terminal vous donne un accès complet à votre conteneur, vous permettant de :
- Déboguer votre application en temps réel
- Exécuter des commandes shell
- Vérifier les fichiers et les logs
- Tester des configurations

## 8. Surveiller vos applications

TC Center offre plusieurs outils pour surveiller l'état de vos applications :

### Statistiques des Pods
Pour chaque pod, vous pouvez visualiser :
- Le statut actuel
- L'état de préparation (Ready)
- Le nombre de redémarrages
- Le nœud d'hébergement
- L'âge du pod

### Métriques de ressources
Un tableau de bord affiche en temps réel :
- L'utilisation CPU
- La consommation de mémoire
- L'utilisation du stockage

Ces métriques sont actualisables à la demande via le bouton "Rafraîchir les métriques".

### Outils de diagnostic
Plusieurs options sont disponibles pour diagnostiquer vos applications :
- Téléchargement des logs du pod
- Téléchargement des informations détaillées (describe)
- Téléchargement des informations IP
- Terminal web intégré


## 9. Supprimer une application

Si vous souhaitez arrêter d’héberger une application :

1. Accédez à l’onglet de suppression.
2. Validez la suppression.

L’application sera alors supprimée de votre namespace et ne consommera plus de ressources. L'image de votre application sera aussi suprimée.

---
