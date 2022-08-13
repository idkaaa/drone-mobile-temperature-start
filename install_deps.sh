#!/bin/sh

apt update 
apt upgrade

apt install nodejs

npm install dotenv
npm install drone-mobile