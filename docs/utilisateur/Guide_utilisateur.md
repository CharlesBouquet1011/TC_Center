# Déployer une application sur TC Center
Afin d'illustrer le **TC Center** nous nous basons sur une application développé par un utilisateur qui s'apparente à un HelloWorld pour Kubernetes. Nous détaillons dans ce document les étapes nécessaires à sa mise à disposition sur le cluster. 

## 1. Spécification HelloWorld
Nous partons d'une application disponible publiquement [ici](https://github.com/sfrenot/wot).   
Clonez cette application et testez son fonctionnement.

Dans une première fenêtre, déployez l'application
```bash
git clone git@github.com:sfrenot/wot.git`
cd wot
npm install
node ./index.js
```

Dans une seconde fenêtre, testez son fonctionnement  
```bash
curl localhost:3030/crawl
```
L'application met environ 10s à répondre. Pour un résulat plus esthétique, vous pouvez charger la page dans votre [navigateur](http://localhost:3030/crawl). L'application n'a pas de sécurité, elle affiche un résultat d'analyse d'une API publique d'un jeu en ligne. 

Nous décrivons comment porter cette application dans le  **TC_Center**. C'est à dire :
- Dockerisation de l'application
- Helmetisation de l'application
- Kubernetisation de l'application
- Validation de l'application

A l'issue du tutoriel, l'application sera accessible sur une infrastructure Kubernetes.
<!-- [Exemple d'application préte à être déployée après être clonée](https://gitlab.insa-lyon.fr/gvantourou/bob) -->
## 2. Dockerisation de l'application.
Le packaging se fait selon la spécification docker. Nous utilisons l'outil `podman` dont la syntaxe est entièrement compatible avec Docker. 

Pour **Dockeriser** votre application nous suggerons les étapes suivantes : 
 - Rédaction d'un fichier Dockerfile
 - Tester et valider l'image
 - Déposer le projet dans un répertoire gitlab

Le fichier Dockerfile est le suivant : 
```Dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3030
CMD ["node", "index.js"] 
```

Construire l'image avec : `podman build -f ./Dockerfile`
Vous pouvez lancer un conteneur en *mappant* le port 3030 `podman run -d -p 3030:3030 <imageId>`
Vous pouvez connecter la sortie standard avec la commande `podman logs -f <conteneurId>`
Vous pouvez enfin tester le conteneur avec la commande `curl localhost:3030/crawl`

La sortie standard des *logs* devrait afficher des lignes, au bout de quelques seconde la page web est rendue. 
## 3. Déposer votre projet sur le gitlab INSA - Générer un token d'accès

Vous devez créer un **token d'accès personnel de type Developer** afin d’autoriser l'accès au code du projet.

- Rendez-vous sur la page de gestion des tokens de votre plateforme Git (par exemple, GitLab : `https://gitlab.com/-/profile/personal_access_tokens`)
- Sélectionner le rôle **developer**
- Créez un nouveau token avec **les scopes suivants** :
  - `api`
  - `read_repository`
- Donnez-lui un nom explicite (par exemple : `deploy-token-datacenter`)
- Copiez le token : vous ne pourrez plus le voir après validation
## 3. Créer un Helm Chart
A la racine du projet, ajouter une description Helm dans le fichier. Chart.yaml
```yaml
apiVersion: v2
name: wot-app
description: Application World of Tanks
type: application
version: 0.1.0
appVersion: "1.0.0"
```


%% Vous devez créer un **Helm chart** pour décrire comment votre application sera déployée sur Kubernetes.
Le Helm Chart doit se trouver à la racine du projet
Cela inclut :
- Les ressources nécessaires (Deployments, Services, Ingress, etc.)
- Les configurations (valeurs par défaut, variables personnalisables)
- La structure standard d’un chart Helm (`Chart.yaml`, `values.yaml`, `templates/`, etc.)


> ℹ️ Si vous avez besoin %% de plus d'aide ou d'un exemple concret, référez-vous au guide [Guide_helm](https://github.com/CharlesBouquet1011/TC_Center/blob/main/docs/utilisateur/Guide_helm.md).

## 4. Accéder à la plateforme TC Center

Rendez-vous sur http://134.214.202.221:3000/.

- Si vous êtes nouveau, créez un compte.
- Sinon, connectez-vous avec vos identifiants.

## 5. Déployer une application

Pour déployer une application depuis un dépôt Git vers votre datacenter, suivez les étapes ci-dessous.

---

### Étape 1 — Générer un token d'accès

Vous devez créer un **token d'accès personnel de type Developer pas Guest** afin d’autoriser l'accès sécurisé au code source du projet.

- Rendez-vous sur la page de gestion des tokens de votre plateforme Git (par exemple, GitLab : `https://gitlab.com/-/profile/personal_access_tokens`)
- Créez un nouveau token avec **les scopes suivants** :
  - `api`
  - `read_repository`
- Donnez-lui un nom explicite (par exemple : `deploy-token-datacenter`)
- Copiez le token : vous ne pourrez plus le voir après validation

---

### Étape 2 — Renseigner l’URL et le token sur notre plateforme

Une fois connecte a votre compte vous aurez acces a une page de dépot ou vous pourrez :

- Collez l’**URL du dépôt Git** à cloner (utilisez le lien en HTTPS) :
  ```text
  https://gitlab.com/votre-projet/mon-app.git
  ```
- Collez votre token d'acces au dépôt

---

### Étape 3 — Validez la soumission de votre application

Une fois le déploiement fini vous verrez un message s'afficher en bas de page:

- Un message d'erreur si le déploiement a echoué. Dans ce cas il faudra de votre côté corriger le probleme avant de retenter un déploiement.
- Un message de confirmation signifiant que le déploiement s'est déroulé sans erreurs.


## 5. Ouvrir un terminal dans votre pod

TC Center vous permet d'accéder directement à vos pods via un terminal web intégré. Pour cela :

1. Sélectionnez votre pod dans le menu déroulant de la section "Gestion des Pods"
2. Cliquez sur le bouton "Ouvrir Terminal"
3. Un terminal interactif s'ouvrira, vous permettant d'exécuter des commandes directement dans votre pod

Le terminal vous donne un accès complet à votre conteneur, vous permettant de :
- Déboguer votre application en temps réel
- Exécuter des commandes shell
- Vérifier les fichiers et les logs
- Tester des configurations

## 6. Surveiller vos applications

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


## 7. Supprimer une application

Si vous souhaitez arrêter d’héberger une application :

1. Accédez à l’onglet de suppression.
2. Validez la suppression.

L’application sera alors supprimée de votre namespace et ne consommera plus de ressources. L'image de votre application sera aussi suprimée.

---
