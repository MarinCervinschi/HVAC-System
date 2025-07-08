#!/bin/sh
#File rebuild.sh


docker compose down --rmi data_collector, gateway, dasboard, cloud_simulator --remove-orphans

docker compose up --build -d