#!/bin/bash

docker compose --env-file .env up -d;

echo "Docker container started"
sleep 5  # Give MongoDB time to initialize

echo "Starting Express App"

node index.js

echo "Started Express App..."



