# Solutions de Monitoring

Ce document présente deux solutions de monitoring intégrables dans votre cluster Kubernetes : **Headlamp** pour une visualisation directe de l'état du cluster, et **Grafana**, couplé à l'**OpenTelemetry Operator**, pour une supervision avancée des performances applicatives.

---

## 1. Headlamp

**Headlamp** est une interface graphique moderne pour Kubernetes, conçue pour faciliter l'administration et le diagnostic des clusters.

- Interface simple et intuitive
- Accès en temps réel aux ressources du cluster
- Installation légère et rapide

> 📌 L'installation de Headlamp dépend de vos préférences d’exposition (NodePort, Ingress, etc.) — non détaillée ici mais facilement intégrable via un Helm chart ou un manifest standard.

---

## 2. Grafana + OpenTelemetry : Supervision avancée

### Objectif

Mettre en place une stack de monitoring basée sur :
- **Grafana** : tableau de bord de visualisation
- **Prometheus + OpenTelemetry Collector** : collecte des métriques
- **Helm** : déploiement automatisé sur Kubernetes

### Prérequis

- Un cluster Kubernetes fonctionnel
- Helm installé et configuré
- Accès à un volume persistant si vous souhaitez conserver les données de Grafana

---

### Étapes d’installation

#### 1. Ajouter les dépôts Helm nécessaires
```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts
helm repo update
```

#### 2. Déployer la stack de monitoring Grafana
```bash
helm upgrade --install k8s-monitoring grafana/k8s-monitoring --namespace monitoring --create-namespace -f ~/mnt/k3sVolume/values.yaml
```

#### 3. Installer l’OpenTelemetry Operator
```bash
helm install opentelemetry-operator open-telemetry/opentelemetry-operator --namespace monitoring --create-namespace --set manager.collectorImage.repository=ghcr.io/open-telemetry/opentelemetry-collector-contrib --set manager.collectorImage.tag=latest
kubectl apply -f /mnt/k3sVolume/otel-collector.yaml
```


# pistes d'améliorations:
Utilisation de Argo CD pour monitoring + pipelines de déploiement

Lens pour regarder les objets.
Loki pour les logs.