# Longhorn
Longhorn sert à avoir une solution de stockage distribuée:
installation avec:
`kubectl apply -f https://raw.githubusercontent.com/longhorn/longhorn/master/deploy/longhorn.yaml  `

utilisation avec:
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

Interface d'administration:

récupérer IP et port avec `kubectl get svc -n longhorn-system`
 aller ensuite dans le navigateur et mettre http://IP:Port avec l'IP et le port du longhorn frontend

Il y a ensuite moyen d'attacher des volumes à des noeuds, de faire des backups, de gérer les volumes longhorn, etc...
Utile pour débuguer des volumes qui ne fonctionnent pas. (il y a également un monitoring du stockage utilisé)