# Kubernetes / helm:
!!! Il faut un registry local OBLIGATOIREMENT
Il faut aussi savoir indenter des fichiers yaml 
commandes utiles (sur le node master):
`export KUBECONFIG=/etc/rancher/k3s/k3s.yaml`
`docker build -t name --target target`
`helm install name path --namespace namespace `
`kubectl get pods -A`

# Uploader une image sur le depot
`docker build -t nom_image ./ --target container-a-build`
`sudo docker tag nom_image username/nom_du_depot:latest`
`sudo docker login -u username`
mot_de_passe
ou `echo 'TON_MDP_OU_TOKEN' | docker login docker.io --username monuser --password-stdin`
`sudo docker push username/nom_du_depot:latest`
(NB avec podman ça devrait être pareil en remplaçant docker par podman)

# debug un pod:
### logs:
`kubectl get logs {pod} -n {namespace}`
utile pour voir si un pod bug après son démarrage
### description
`kubectl describe pod {pod} -n {namespace}`
NB, vous pouvez égalementt describe tout type de ressources (pvc, ingress, service, network, ...)
Dans le cas des pods, c'est utile pour voir lorsqu'un pod n'arrive pas à démarrer

### execution de commandes:
`kubectl exec -it {pod} -c {conteneur} -n {namespace} -- {commande}`
NB: le tag -c n'est pas obligatoire si vous avez un seul conteneur dans le pod, si vous en avez plusieurs, il vous mettra dans un conteneur par défaut. Si vous ne mettez pas de namespace, vous finissez dans le namespace default

exemple d'utilisation:
`kubectl exec -it frontend-kqdlqd66qsd2-45qd2 -c nginx -n test -- sh`
Cela vous ouvrira un shell dans le conteneur nginx du pofrontend-kqdlqd66qsd2-45qd2 du namespace test (après vous pouvez y faire les commandes que vous voulez dans un système linux)

# commandes générales:
`kubectl get {ressource}  -n {namespace}` renverra toutes les ressoures correspondants à votre recherche (pod/node/pvc/ingress etc)

`kubectl delete {ressource} {ressourceName} -n {namespace}`
supprimera la ressource correspondante dans le namespace indiqué.
Attention, si la ressource a été installée par helm, elle sera relancée automatiquement. (faire plutôt `helm uninstall {release} -n {namespace}`dans ce cas)

