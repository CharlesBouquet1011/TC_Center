# Écrire un helm chart

## Créer la structure du chart
Deux possibilités:
 - Recommandé : exécuter la commande: ```helm create nom_de_votre_chart```
 - Alternative : créer tous les dossiers (/templates et si nécessaire /charts) et fichiers (Chart.yaml, values.yaml a la racine du dossier, ainsi que tous les fichiers a mettre dans template) manuellement
 

---

## Modifier les fichiers nécessaires

### Chart.yaml
Chart.yaml contient les informations globales sur notre helm chart, c'est une sorte de manifeste. C'est dans ce fichier qu'on trouve a la ligne name le nom de la release permettant d'identifier l'application une fois déposée sur notre site web.

On y trouve aussi la version du chart qu'il peut etre intéressant d'incrémenter au fur et a mesure de vos updates.

### Values.yaml
Le fichier values.yaml dans un Helm chart est le fichier central de configuration. Il sert à définir les valeurs par défaut que Helm utilisera lors du déploiement de votre application Kubernetes avec ce chart.

```yaml
services: 
    <container_name>
```
Les valeurs définies dans ce fichier peuvent etre utilisées ensuite dans le fichiers de /templates sous la forme de: ```{{.Values.<variable>}}```.

### /templates
Dans ce dossier il faut mettre plusieurs fichiers décrivant votre application et comment vous souhaitez la déployer.

Il faut un fichier deployment par pod.

### /charts
A utiliser seulement si votre chart a des dépendances a d'autres charts helm. Dossier nécessaire uniquement pour les helm charts complexes.

> 📚 Consultez la [documentation officielle de Helm](https://helm.sh/docs/chart_template_guide/) pour plus de détails.
