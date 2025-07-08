#!/bin/sh
#File rebuild.sh


docker compose down --rmi cloud_api

docker compose up --build -d