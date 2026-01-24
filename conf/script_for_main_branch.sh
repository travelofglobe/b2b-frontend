#!/bin/bash

APP_NAME="tog-b2b-frontend"
PORT=3000

echo "Building Docker Image: $APP_NAME"
docker build -t $APP_NAME .

echo "Checking for existing container..."
if [ "$(docker ps -aq -f name=$APP_NAME)" ]; then
    echo "Stopping and removing existing container: $APP_NAME"
    docker stop $APP_NAME
    docker rm $APP_NAME
fi

echo "Starting new container on port $PORT"
docker run -d --name $APP_NAME -p $PORT:3000 --restart always $APP_NAME

echo "Deployment finished successfully for port $PORT."
