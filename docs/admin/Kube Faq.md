# Debug un pod:
### Logs:
`kubectl get logs {pod} -n {namespace}`

Utile pour voir si un pod bug après son démarrage.
### Description
`kubectl describe pod {pod} -n {namespace}`

NB, vous pouvez égalementt describe tout type de ressources (pvc, ingress, service, network, ...)
Dans le cas des pods, c'est utile pour voir lorsqu'un pod n'arrive pas à démarrer.

### Execution de commandes:
`kubectl exec -it {pod} -c {conteneur} -n {namespace} -- {commande}`

NB: le tag -c n'est pas obligatoire si vous avez un seul conteneur dans le pod, si vous en avez plusieurs, il vous mettra dans un conteneur par défaut. Si vous ne mettez pas de namespace, vous finissez dans le namespace default.

exemple d'utilisation:
`kubectl exec -it frontend-kqdlqd66qsd2-45qd2 -c nginx -n test -- sh`

Cela vous ouvrira un shell dans le conteneur nginx du pofrontend-kqdlqd66qsd2-45qd2 du namespace test (après vous pouvez y faire les commandes que vous voulez dans un système linux).

# Commandes générales:
`kubectl get {ressource}  -n {namespace}` renverra toutes les ressoures correspondants à votre recherche (pod/node/pvc/ingress etc) dans le namespace spécifié.

`kubectl delete {ressource} {ressourceName} -n {namespace}`
supprimera la ressource correspondante dans le namespace indiqué.
Attention, si la ressource a été installée par helm, elle sera relancée automatiquement. (faire plutôt `helm uninstall {release} -n {namespace}`dans ce cas).

Pour mettre à jour des modifications d'un chart helm:
`helm upgrade {release} {path} -n {namespace}`
ou désinstaller et réinstaller.

Attention, `helm uninstall {release} -n {namespace}`supprime AUSSI les volumes si cela n'a pas été configuré explicitement dans les paramètres du pvc, il faut également configurer une reclaim policy pour que le pod successeur reprenne ce volume après avoir configuré que le volume n'est pas supprimé lorsque la release est supprimée.
(à utiliser avec parcimonie)

Si podman crash (podman info ne fonctionne pas), le stopper avec systemctl puis faire `rm -f /mnt/k3sVolume/podman/libpod/bolt_state.db` pour supprimer sa base de données et debugguer parfois.