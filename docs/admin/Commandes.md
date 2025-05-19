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

