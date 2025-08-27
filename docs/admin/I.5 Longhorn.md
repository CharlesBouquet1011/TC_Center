Longhorn sert à avoir une solution de stockage distribuée:
installation avec:
`kubectl apply -f https://raw.githubusercontent.com/longhorn/longhorn/master/deploy/longhorn.yaml  `

## Utilisation de Longhorn lors d'un un déploiement 
Pour rappel un PersistentVolumeClaim: PVC est un type de volumes utilisés pour stocker les informations qui doivent rester entre plusieurs images ou plusieurs redémarrages de l'application (exemple une base de données). Le fichier ci-dessous indique entre autres la taille du stockage et qu'il faut utiliser la classe de stockage de longhorn plutôt que la classe de stockage par défaut de k3s (qui n'est pas longhorn). Dans tous les cas vous serez obligés de déclarer un Volume dans un fichier Helm pour faire fonctionner l'application, il ne faut juste pas oublier de préciser la classe de stockage.

Pour utiliser Longhorn, voici un exemple de fichier Helm de PersistentVolumeClaim à mettre dans le projet que vous voulez déployer. Il faudra évidemment ensuite que vos fichiers déployant les différentes images utilisent ce PersistentVolumeClaim lors du déploiement.

```yaml 
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: {{ include "tonchart.fullname" . }}-data
  annotations:
    "helm.sh/resource-policy": keep
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: longhorn
```
## Interface d'administration
Pour accéder a l'interface d'administration en local sur le master il faut récupérer IP et port avec `kubectl get svc -n longhorn-system`. Il faut ensuite aller dans le navigateur et mettre http://IP:Port avec l'IP et le port du longhorn frontend.

Il y a ensuite moyen d'attacher des volumes à des noeuds, de faire des backups, de gérer les volumes longhorn, etc...

C'est une interface utile pour débuguer des volumes qui ne fonctionnent pas (il y a également un monitoring du stockage utilisé).

S'il y a un problème avec un disque unschedulable, il faut aller sur l'interface d'administration dans le navigateur, dans les noeuds, cliquer tout à droite sur les 3 barres puis edit node and disks puis supprimer le disque fautif et remettre un disque longhorn sur /mnt/k3sVolume/longhorn.

---

## Ajouter Longhorn a l'ingress Traefik

Si vous souhaitez pouvoir accéder a l'interface d'administration a distance il faut l'ajouter a l'ingress (configurée ici avec Traefik).

### Fichier d'authentification
```bash
echo "${USER}:$(openssl passwd -stdin -apr1 <<< ${PASSWORD})" > auth

kubectl create secret generic longhorn-auth \
>   --from-file=users=auth \
>   -n longhorn-system

```
Ensuite il faut créer un fichier middleware-auth.yaml avec un éditeur comme nano:

```yaml
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: longhorn-auth
  namespace: longhorn-system
spec:
  basicAuth:
    secret: longhorn-auth
```
```bash
kubectl apply -f middleware-auth.yaml
```


### Ingress manifest
Créer le fichier longhorn-ingressroute.yaml en remplacant votre_nom_de_domaine par une adresse dns pointant vers l'IP du master :

```yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: longhorn-ui
  namespace: longhorn-system
  annotations:
    traefik.ingress.kubernetes.io/router.middlewares: longhorn-system-svc-longhorn-headers@kubernetescrd
spec:
  entryPoints:
    - web
  routes:
    - match: Host(`votre_nom_de_domaine`)
      kind: Rule
      services:
        - name: longhorn-frontend
          port: 80
      middlewares:
        - name: longhorn-auth
```
Puis pour appliquer cette route au cube :
```bash
kubectl apply -f longhorn-ingressroute.yaml
```
