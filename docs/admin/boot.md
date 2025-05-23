# Configuration au boot:

Lors du boot, le système va demander d'indiquer si le node est master ou agent, il faut choisir le bon rôle.
Il faut ensuite indiquer votre nom de nom (nodeXX) choisi précédemment.
Si vous avez choisi master, vous avez fini, sinon vous devez indiquer l'adresse IP du master pour que l'agent s'y connecte.
Il y a une dernière intéraction demandée au boot, écrivez "y" puis entrée et ça sera bon.


## ATTENTION:


**Si vous relancez un node agent**: Supprimez le node correspondant dans le node master avec `kubectl delete node nodeXX`. Si vous ne le faites pas, le pc agent **ne bootera pas**.

Lorsque vous relancez un node, il regénère une clé SSH, pour vous y connecter de nouveau, il faudra supprimer l'ancienne clé ssh de votre pc avec ssh-keygen -R IP. 

Veiller à garder la configuration des nodes master/agent entre chaque reboot, sinon longhorn peut ne pas être content. (même nom de node par pc, le même node est master etc), tout pareil au boot

**Si vous n'avez pas les mêmes ordinateurs que nous:**

Dans les scripts de la clé on suppose que le disque dur est sur /dev/sda et qu'il a été préalablement formatté, si ce n'est pas le cas, le script échouera et le boot ne fonctionnera probablement pas (while infini sur le mount bind /var/longhorn) veuillez donc formatter au préalable le disque dur ou adapter le script en fonction du pc (si le disque dur n'est pas dans /dev/sda notamment)
 