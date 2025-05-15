# Configuration Réseau

# réseau virtuel
Le cluster k3s tourne avec un reverse proxy traefik
Le DNS doit pointer sur le node master (ingress traefik) qui redistribue ensuite aux pods concernés.

Chaque application doit configurer un ingress qui va définir le nom de domaine utilisé et les ports du pod à contacter pour l'ingress.
Chaque pod doit configurer un service pour communiquer avec d'autres pods

traefik se charge automatiquement de gérer tous les ingress définis et fait le load balancer entre les replicas.

# réseau physique:

mettre un schéma ici Mathis

routeur, LAN etc à mettre
