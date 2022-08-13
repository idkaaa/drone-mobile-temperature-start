#!/bin/sh

apt update 
apt upgrade

apt install nodejs

npm install -g dotenv
npm install -g drone-mobile