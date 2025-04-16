#!/bin/bash

if [ ! -d "/mnt/home" ]; then
  sudo mkdir /mnt/home
  sudo mount -t cifs -o username=$USER_LOGIN,uid=$USER_LOGIN,gid=dsi //ps-home.insa-lyon.fr/$USER_LOGIN /mnt/home
  if [ $? -eq 0 ]; then
    sudo ln -s /mnt/home 
  else
    echo "Le montage a échoué"
    sudo rmdir /mnt/home
  fi
fi


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
