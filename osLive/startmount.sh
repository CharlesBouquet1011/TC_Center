#!/bin/bash

if  mount /dev/sda1 /mnt/ ; then
  echo "Disque monté avec succès"
  #création des dossiers k3s et docker
  mkdir -p /mnt/k3sVolume/docker
  mkdir -p /mnt/k3sVolume/k3s 
else
  echo "Echec du montage"
fi

