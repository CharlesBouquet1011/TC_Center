#!/bin/bash


mkdir -p /mnt/k3sVolume
  
if  mount /dev/sda /mnt/k3sVolume ; then
  echo "Disque monté avec succès"
  #création des dossiers k3s et docker
  mkdir -p /mnt/k3sVolume/docker
  mkdir -p /mnt/k3sVolume/k3s 
else
  echo "Échec du montage"
  sudo rmdir /mnt/k3sVolume
  fi

