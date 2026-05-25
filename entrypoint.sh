#!/bin/bash

docker compose --env-file .env up -d;

echo "Docker container started"
sleep 8  # give time to mongodbb time to initialize properly

echo "Starting Express App"

node index.js

echo "Started Express App..."



