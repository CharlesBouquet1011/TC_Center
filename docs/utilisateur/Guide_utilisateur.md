# Déployer une application sur TC Center

## 1. Préparer une application fonctionnelle et conteneurisée

Avant de déployer votre application sur **TC Center**, assurez-vous qu'elle fonctionne correctement en local, sans erreur ni bug.  
> ⚠️ TC Center ne prend pas en charge la résolution de problèmes liés à votre code.

Pour pouvoir accéder a votre code il faut qu'il soit déposé sur github ou sur gitlab (dans un dépôt public ou privé selon votre préférence).

Une fois votre application testée et stable, vous devez la **conteneuriser**.  
Pour cela, utilisez **Docker** et assurer d'avoir un **dockerfile** a la racine de votre projet. Le conteneur doit être autonome et prêt à être déployé.

## 2. Créer un Helm Chart

Vous devez créer un **Helm chart** pour décrire comment votre application sera déployée sur Kubernetes.  
Cela inclut :
- Les ressources nécessaires (Deployments, Services, Ingress, etc.)
- Les configurations (valeurs par défaut, variables personnalisables)
- La structure standard d’un chart Helm (`Chart.yaml`, `values.yaml`, `templates/`, etc.)


> ℹ️ Si vous avez besoin de plus d'aide ou d'un exemple concret, référez-vous au guide [Guide_helm](https://github.com/CharlesBouquet1011/TC_Center/blob/main/docs/utilisateur/Guide_helm.md).

## 3. Accéder à la plateforme TC Center

Rendez-vous sur [tc.insa-lyon.fr](https://tc.insa-lyon.fr).

- Si vous êtes nouveau, créez un compte.
- Sinon, connectez-vous avec vos identifiants.

Une fois connecté, vous pourrez :
- Déployer vos applications dans un **namespace** associé à votre compte
- Suivre vos déploiements à l’aide de leur **release name** (nom unique pour chaque application, défini dans le helm chart)
- Supprimer une application à partir de sa release name.

## 4. Déployer une application

Pour déployer une application depuis un dépôt Git vers votre datacenter, suivez les étapes ci-dessous.

---

### Étape 1 — Générer un token d'accès

Vous devez créer un **token d'accès personnel** afin d’autoriser l'accès sécurisé au code source du projet.

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

## 5. Ouvrir un terminal dans votre pod? 
un truc du genre

- Suivre le comportement de vos applications en temps réel
- Détecter rapidement les erreurs ou dysfonctionnements

> 🔍 Pensez à consulter régulièrement cette interface pour assurer la stabilité de vos services.

## 6. Supprimer une application

Si vous souhaitez arrêter d’héberger une application :
1. Accédez à l’onglet de suppression.
2. Renseignez le **release name** de l’application cible.
3. Validez la suppression.

L’application sera alors supprimée de votre namespace et ne consommera plus de ressources.

---
