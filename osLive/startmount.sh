#!/bin/bash


if [ ! -d "/mnt/k3sVolume" ]; then
  mkdir /mnt/k3sVolume
  
  if  mount /dev/sda /mnt/k3sVolume ; then
    echo "Disque monté avec succès"
  else
    echo "Échec du montage"
    sudo rmdir /mnt/k3sVolume
  fi
fi
