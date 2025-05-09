

# configuration Initiale
sudo ./configAfterBoot.sh
Si le disque n'a pas été formatté il y aura une erreur au montage du volume /mnt/k3sVolume, pas grave pour l'instant
on peut maintenant se connecter en ssh sur la machine:

# SSH
ssh user@IP tout simplement
ATTENTION la clé de la machine change à chaque Boot, si vous vous êtes connectés avant à cette machine, il y aura un problème et cela vous empêchera de vous connecter => il faut donc faire la commande:
ssh-keygen -R IP
qui va supprimer la machine problématique (par IP) dans la table des hôtes ssh, vous pourrez donc ensuite refaire ssh user@IP et dire yes

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

# Grafana
`helm repo add grafana https://grafana.github.io/helm-charts`
`helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts`
`helm repo update`
`helm upgrade --install k8s-monitoring grafana/k8s-monitoring --namespace monitoring --create-namespace -f ~/mnt/k3sVolume/values.yaml`
`helm install opentelemetry-operator open-telemetry/opentelemetry-operator --namespace monitoring --create-namespace --set manager.collectorImage.repository=ghcr.io/open-telemetry/opentelemetry-collector-contrib --set manager.collectorImage.tag=latest`
`kubectl apply -f /mnt/k3sVolume/otel-collector.yaml`