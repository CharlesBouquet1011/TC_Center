# Longhorn
Longhorn sert à avoir une solution de stockage distribuée:
installation avec:
`kubectl apply -f https://raw.githubusercontent.com/longhorn/longhorn/master/deploy/longhorn.yaml  `

utilisation avec:
``` 
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