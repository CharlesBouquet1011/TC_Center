#!/bin/bash


if [! -d "/mnt/k3sVolume"]; then
  sudo mkdir /mnt/k3sVolume
  sudo mount /dev/sda /mnt/k3sVolume
  if [ $? -eq 0 ]; then
    echo "Disque monté avec succès"
  else
    echo "Échec du montage"
    sudo rmdir /mnt/k3sVolume
  fi
fi
