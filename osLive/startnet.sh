#!/bin/bash


nmcli con add type ethernet con-name filaire ifname eth0
nmcli con up filaire
