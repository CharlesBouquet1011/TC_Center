# Déployer une application sur TC Center

## 1. Préparer une application fonctionnelle et conteneurisée

Avant de déployer votre application sur **TC Center**, assurez-vous qu'elle fonctionne correctement en local, sans erreur ni bug.  
> ⚠️ TC Center ne prend pas en charge la résolution de problèmes liés à votre code.

Une fois votre application testée et stable, vous devez la **conteneuriser**.  
Pour cela, utilisez **Docker** ou un service équivalent. Le conteneur doit être autonome et prêt à être déployé.

## 2. Écrire un Helm Chart

Vous devez créer un **Helm chart** pour décrire comment votre application sera déployée sur Kubernetes.  
Cela inclut :
- Les ressources nécessaires (Deployments, Services, Ingress, etc.)
- Les configurations (valeurs par défaut, variables personnalisables)
- La structure standard d’un chart Helm (`Chart.yaml`, `values.yaml`, `templates/`, etc.)

> 📚 Consultez la [documentation officielle de Helm](https://helm.sh/docs/chart_template_guide/) pour plus de détails.
> ℹ️ Si vous avez besoin de plus d'aide ou d'un exemple concret, référez-vous au guide **Guid_helm**.

## 3. Accéder à la plateforme TC Center

Rendez-vous sur [tc.insa-lyon.fr](https://tc.insa-lyon.fr).

- Si vous êtes nouveau, créez un compte.
- Sinon, connectez-vous avec vos identifiants.

Une fois connecté, vous pourrez :
- Déposer votre Helm chart
- Déployer vos applications dans un **namespace** associé à votre compte
- Suivre vos déploiements à l’aide de leur **release name** (nom unique pour chaque application)

## 4. Surveiller le comportement de vos applications

TC Center fournit une interface de monitoring qui vous permet de :
- Suivre le comportement de vos applications en temps réel
- Détecter rapidement les erreurs ou dysfonctionnements
- Surveiller les ressources consommées et le **coût d’hébergement**

> 🔍 Pensez à consulter régulièrement cette interface pour assurer la stabilité de vos services.

## 5. Supprimer une application

Si vous souhaitez arrêter d’héberger une application :
1. Accédez à l’onglet de suppression.
2. Renseignez le **release name** de l’application cible.
3. Validez la suppression.

L’application sera alors supprimée de votre namespace et ne consommera plus de ressources.

---
