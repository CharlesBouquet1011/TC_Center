#!/bin/bash

echo "Ajout des dépôts Helm grafana et telemetry"
helm repo add grafana https://grafana.github.io/helm-charts
helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts

echo "Mise à jour des dépôts"
helm repo update

echo "Déploiement de Grafana monitoring"
helm upgrade --install k8s-monitoring grafana/k8s-monitoring \
  --namespace monitoring \
  --create-namespace \
  -f ~/mnt/k3sVolume/values.yaml

echo "Installation de l'opentelemetry-operator"
helm install opentelemetry-operator open-telemetry/opentelemetry-operator \
  --namespace monitoring \
  --create-namespace \
  --set manager.collectorImage.repository=ghcr.io/open-telemetry/opentelemetry-collector-contrib \
  --set manager.collectorImage.tag=latest

echo "Application du fichier yaml"
kubectl apply -f /mnt/k3sVolume/otel-collector.yaml

echo "Déploiement terminé avec succès."
