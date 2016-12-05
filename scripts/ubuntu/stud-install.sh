#!/bin/bash
export DEBIAN_FRONTEND=noninteractive
# Remove the lock
set +e
sudo rm -f /var/lib/dpkg/lock > /dev/null
sudo rm -f /var/cache/apt/archives/lock > /dev/null
sudo dpkg --configure -a
set -e

sudo apt-get -y install libev4 libev-dev gcc make libssl-dev git
cd /tmp
sudo rm -rf /tmp/stud

echo "Cloning stud git repository..."
sudo git clone https://github.com/bumptech/stud.git stud

echo "Compiling..."
(cd stud && sudo make install)
sudo rm -rf /tmp/stud

#make sure comet folder exists
sudo mkdir -p /opt/stud

#initial permission
sudo chown -R $USER /etc/init
sudo chown -R $USER /opt/stud


if [[ -d /etc/init ]] ; then

echo "Setting up init config"
cat <<END | sudo tee /etc/init/stud.conf
#!upstart
description "starting stud"
author      "comet"

start on runlevel [2345]
stop on runlevel [06]

respawn
limit nofile 65536 65536

script
  stud --config=/opt/stud/stud.conf
end script
END

fi


if [[ -d /etc/systemd/system ]] ; then

echo "Setting up systemd config service"
cat <<END | sudo tee /etc/systemd/system/stud.service
[Unit]
Description=Stud

[Service]
ExecStart=/usr/local/bin/stud --config=<%= deployPrefix %>/stud/stud.conf

[Install]
WantedBy=multi-user.target
END

fi


#create non-privileged user
sudo useradd stud || :