# Pistes d'améliorations
Ce fichier représente la liste des choses que l'on aurait aimé mettre mais que l'on a pas pu faire pour une raison ou une autre (principalement par manque de temps, 4 semaine c'est court)

## Boot:
- Automatiser le boot en fonction de la configuration souhaitée dès le départ, notre système flexible demande une intéraction utilisateur ce qui empêche de redémarrer un pc à distance lors du boot
- Utilisation d'un wake up LAN.

## Registry docker:
- suppression automatique des images non utilisées

## Domaine et certificat:
- Avoir un domaine wildcard et générer des noms de domaine automatiquement pour chaque projet
- Avoir un certificat SSL wildcard pour pas s'ennuyer et avoir un renouvellement auto
(Mathis avait fait mais il manque le domaine)

## Helm
- Génération automatique des helms à partir de quelques informations données par l'utilisateur (pas si dur en utilisant judicieusement les values.yaml et les templates)
- Génération automatique du template des ingress à partir de quelques infos et du sous domaine qu'on génère dessus (à partir du domaine wildcard)

## Site utilisateur:
- Mise en place de graphes pour voir les ressources utiliser
- Faire une page pour voir tous les pods actif pour pouvoir une vue globale
- Mettre en place un lamdba

## Monitoring et paiement:
- Faire un FaaS
- Utiliser une plateforme de paiement
