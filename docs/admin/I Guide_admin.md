# Mettre en place un datacenter

Ce guide fournit une vue d’ensemble sur les étapes et composants nécessaires pour construire un datacentre basé sur des machines physiques, une configuration réseau personnalisée, et une supervision complète.

---

## Ordre des actions pour la configuration
- construire l'os bootable avec les fichiers requis, (cf. [[I.1 Construction de l'OS]])
- faire une clé bootable pour chaque PC et l'insérer dans chaque nœud (cf. [[I.2 Démarrage d'un nœud]])
- boot le PC master (prendre node01 par convention) et lui donner les infos dont il a besoin, cf partie boot
- boot les PC agents et les connecter sur l'IP du master, cf partie boot

**A ce niveau, le cluster fonctionne**, il faut maintenant lancer le serveur web pour que les utilisateurs puissent déployer leurs applications, cf [deployement_web.md](https://github.com/CharlesBouquet1011/TC_Center/blob/main/docs/admin/deployement_web.md)

---
## Le matériel

Présentation du matériel utilisé pour le déploiement du datacenter, incluant :

- Des **PC classiques** configurés comme nœuds du cluster :  
  [📄 Voir la fiche matériel des PC](https://github.com/CharlesBouquet1011/TC_Center/blob/main/docs/admin/PC.md) [[A- PC]]

- Des **lames serveur** centralisant certaines fonctions critiques :  
  [📄 Voir la fiche matériel des lame](https://github.com/CharlesBouquet1011/TC_Center/blob/main/docs/admin/Lame.md)[[B- Lame]]

Chaque machine est décrite en détail : capacité disque, réseau, usage prévu, et spécificités d’installation.

(Nous avons build actuellement les images sur le node01 (aussi le master) afin de pouvoir les récupérer facilement en scp)

## Monitoring 

Une fois les machines déployées, il est crucial de pouvoir **surveiller leur état et leur comportement**. Deux outils sont utilisés :

- **Headlamp** : interface graphique simple pour visualiser l’état du cluster Kubernetes
- **Grafana + OpenTelemetry** : stack complète pour collecter, visualiser et analyser les métriques et logs

Cette partie fournit un guide pour installer et configurer ces outils via Helm.

[📄 Accéder à la documentation Monitoring](https://github.com/CharlesBouquet1011/TC_Center/blob/main/docs/admin/monitoring.md)[[I.4 monitoring]]
## Solution de stockage distribué
**Longhorn** permet :

- La persistance des volumes même en cas de redémarrage ou déplacement de pods
- La réplication des données sur plusieurs nœuds
- La gestion via une interface web ou des CRD Kubernetes
- la gestion des volumes sur les noeuds

[📄 Voir la configuration Longhorn](https://github.com/CharlesBouquet1011/TC_Center/blob/main/docs/admin/longhorn.md)[[I.5 Longhorn]]

---

