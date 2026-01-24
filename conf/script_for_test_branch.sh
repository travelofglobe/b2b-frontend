#!/usr/bin/env bash

PROJECT_NAME=tog-b2b-frontend
REMOTE_PATH=/opt/deployment/tog-b2b-frontend
IPS="37.148.213.4"
COMMIT_ID=$(git log -n 1 --pretty=format:'%H')

for IP in $IPS;
do
    echo "Deploying to: $IP";
    
    # Create remote directory if not exists
    ssh deployment@${IP} "sudo mkdir -p ${REMOTE_PATH}";
    
    # Backup old deployment (optional)
    ssh deployment@${IP} "sudo rm -rf ${REMOTE_PATH}.backup && sudo cp -r ${REMOTE_PATH} ${REMOTE_PATH}.backup 2>/dev/null || true";
    
    # Clean old files
    ssh deployment@${IP} "sudo rm -rf ${REMOTE_PATH}/*";
    
    echo "Deploy : $COMMIT_ID to $IP";
    
    # Copy dist folder contents to remote server
    rsync -arvzPc --delete ${WORKSPACE}/dist/ deployment@${IP}:${REMOTE_PATH}/
    
    # Set proper permissions
    ssh deployment@${IP} "sudo chown -R deployment:deployment ${REMOTE_PATH}";
    ssh deployment@${IP} "sudo chmod -R 755 ${REMOTE_PATH}";
    
    # Reload nginx (if using nginx)
    ssh deployment@${IP} "sudo systemctl reload nginx || true";
    
    echo "Deployment completed for $IP";
done
