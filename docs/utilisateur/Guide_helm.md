# Écrire un helm chart

## Créer la structure du chart
Deux possibilités:
 - Recommandé : exécuter la commande: ```helm create nom_de_votre_chart```
 - Alternative : créer tous les dossiers (`/templates` et si nécessaire `/charts`) et fichiers (Chart.yaml, values.yaml a la racine du dossier, ainsi que tous les fichiers a mettre dans template) manuellement
 

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
Le dossier `/templates` contient **les fichiers YAML modèles (templates)** qui décrivent les ressources Kubernetes à déployer (Pods, Services, Ingress, etc.). Ces fichiers sont écrits en YAML avec des expressions Go templating (`{{ }}`) permettant d’utiliser les variables définies dans `values.yaml`.

#### Fichiers a mettre dans  `/templates`

#### + **deployment.yaml**

Décrit un `Deployment`, c’est-à-dire le déploiement de pods contrôlés par un ReplicaSet.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}-app
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
          ports:
            - containerPort: 80
```

Il faut un fichier deployment par pod.

#### + **service.yaml**
Expose l’application avec un Service, souvent de type ClusterIP, NodePort, ou LoadBalancer.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ .Release.Name }}-svc
spec:
  type: {{ .Values.service.type }}
  selector:
    app: {{ .Release.Name }}
  ports:
    - port: {{ .Values.service.port }}
      targetPort: 80
```


### /charts
A utiliser seulement si votre chart a des dépendances a d'autres charts helm. Dossier nécessaire uniquement pour les helm charts complexes.

> 📚 Consultez la [documentation officielle de Helm](https://helm.sh/docs/chart_template_guide/) pour plus de détails.

### debug

Faire `helm lint {path}`pour que helm cherche des erreurs dans le template.
Attention, s'il n'indique pas d'erreur, ça ne veut pas dire qu'il n'y en a pas, l'application s'installera correctement avec un helm install mais helm pourrait s'être trompé de champ. (à vérifier au runtime)