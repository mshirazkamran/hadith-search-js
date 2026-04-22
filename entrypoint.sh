#!/bin/bash

docker compose up -d;

echo "Docker container started"

echo "Starrting Express App"

node index.js

echo "Started Express App..."



