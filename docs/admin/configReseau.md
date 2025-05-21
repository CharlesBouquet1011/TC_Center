# Configuration Réseau

# Réseau virtuel
Le cluster k3s tourne avec un reverse proxy traefik
Le DNS doit pointer sur le node master (ingress traefik) qui redistribue ensuite aux pods concernés.

Chaque application doit configurer un ingress qui va définir le nom de domaine utilisé et les ports du pod à contacter pour l'ingress.
Chaque pod doit configurer un service pour communiquer avec d'autres pods

traefik se charge automatiquement de gérer tous les ingress définis et fait le load balancer entre les replicas.

# Réseau physique:

mettre un schéma ici Mathis

routeur, LAN etc à mettre



## Routeur utilisé:
cisco 800 series.
### Réinitialiser le mot de passe:
 j'ai utilisé screen `sudo apt install screen` puis je me suis connecté au routeur `sudo screen /dev/ttyS0` puis relancer le routeur, au lancement dans screen faire CTRL A B (cela envoie un BREAK et permet d'arriver dans ROMMON) (read only memory). Ensuite il faut désactiver le chargement automatique de la config avec `confreg 0x2142` puis `reset` pour redémarrer.
Au prompt qui demande si on veut configurer automatiquement, mettre `no`.

### Reconfigurer le mot de passe:
Ici je suppose que vous avez des bases en réseau.
`enable`

`copy startup-config running-config` pour récupérer l'ancienne config

`conf t`

`line console 0`

`password {mot de passe}` mot de passe pour la console, vty, etc

`login `

`exit`

`enable secret {mot de passe}` mot de passe chiffré pour enable, pour un mot de passe en clair, enlever secret

`config-register 0x2102` pour réactiver le chargement de la config

`write memory`

`reload`

## Configuration du routeur

cf [Configuration routeur Cisco 8000.md](https://github.com/CharlesBouquet1011/TC_Center/blob/main/docs/Configuration routeur Cisco 8000.md)