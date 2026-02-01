#!/usr/bin/env bash

PROJECT_NAME=b2b-frontend
REMOTE_PATH=/opt/deployment/b2b-frontend
IPS="37.148.213.4"
COMMIT_ID=$(git log -n 1 --pretty=format:'%H')

for IP in $IPS;
do
    echo "Deploying to PRODUCTION: $IP";
    
    # Create remote directory if not exists
    ssh deployment@${IP} "sudo mkdir -p ${REMOTE_PATH}";
    
    # Backup old deployment
    BACKUP_DIR="${REMOTE_PATH}.backup.$(date +%Y%m%d_%H%M%S)"
    ssh deployment@${IP} "sudo cp -r ${REMOTE_PATH} ${BACKUP_DIR}";
    
    # Clean old files
    ssh deployment@${IP} "sudo rm -rf ${REMOTE_PATH}/*";
    
    echo "Deploy : $COMMIT_ID to PRODUCTION $IP";
    
    # Copy dist folder contents to remote server
    rsync -arvzPc --delete ${WORKSPACE}/dist/ deployment@${IP}:${REMOTE_PATH}/
    
    # Set proper permissions
    ssh deployment@${IP} "sudo chown -R deployment:deployment ${REMOTE_PATH}";
    ssh deployment@${IP} "sudo chmod -R 755 ${REMOTE_PATH}";
    
    # Reload nginx
    ssh deployment@${IP} "sudo systemctl reload nginx";
    
    echo "PRODUCTION Deployment completed for $IP";
    echo "Backup saved at: $BACKUP_DIR";
done
