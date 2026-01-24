pipeline {
    agent any
    tools {
        nodejs 'NodeJS-20' // Jenkins'te NodeJS 20 kurulu olmalı
    }
    options {
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '30'))
        disableConcurrentBuilds()
    }

    environment {
        BUILD_NUMBER = "${env.BUILD_NUMBER}"
        MY_WORKSPACE = "/var/lib/jenkins/workspace/tog-b2b-frontend"
        BRANCH = "${env.BRANCH_NAME}"
        VERSION = "${env.VERSION}"
        JOB = "${env.JOB_NAME}"
        BUILD_URL = "${env.BUILD_URL}"
        GIT_REPO = "${env.GIT_URL}"
        defaultMailReceivers = "travelofglobe@gmail.com"
        successMailReceivers = "${defaultMailReceivers}"
        failureMailReceivers = "${defaultMailReceivers}"
    }

    stages {

        stage('Checkout & Preparations') {
            steps {
                echo "Starting Project $JOB job on $BRANCH branch with $VERSION build Version - $JOB $BUILD_NUMBER (<$BUILD_URL|Open>)"
                sh 'printenv'
                sh "node --version"
                sh "npm --version"
            }
        }

        /*-- Build & Production Bundle --*/
        stage('Build & Production Bundle') {
            steps {
                echo 'Starting Project Build'
                script {
                    // Install dependencies
                    sh "npm ci"
                    
                    // Build production bundle
                    sh "npm run build"
                    
                    // Verify build output
                    sh "ls -la dist/"
                }
                echo 'Finished Project Build'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploying....'
                script {
                    //grant permissions
                    sh "chmod +x -R ${WORKSPACE}/conf/script_for_*.sh"
                    
                    if ("${BRANCH}" == "test") {
                        echo "Will be deploy ${BRANCH} ...."
                        sh "sh ${WORKSPACE}/conf/script_for_${BRANCH}_branch.sh"
                        echo "Deployment finished for ${BRANCH}."
                    }
                    
                    if ("${BRANCH}" == "main") {
                        echo "Are You Sure Deploy ${BRANCH} ?"
                        input message: "Are you sure deploy ${BRANCH} to production platform?", 
                              submitter: 'ugur.gogebakan,ahmet.beylihan,travelofglobe', 
                              submitterParameter: 'approvers-id-to-be-stored'
                        sh "sh ${WORKSPACE}/conf/script_for_${BRANCH}_branch.sh"
                    }
                }
            }
        }
    }
    
    post {
        success {
            script {
                echo "build success"
                emailext body: '${SCRIPT, template="groovy-html.template"}', 
                        recipientProviders: [[$class: 'DevelopersRecipientProvider'], 
                                           [$class: 'RequesterRecipientProvider']], 
                        subject: "Jenkins Success - ${JOB} #${BUILD_NUMBER} succeeded!", 
                        to:"${successMailReceivers}"
            }
        }
        failure {
            script {
                echo "build failure"
                emailext body: '${SCRIPT, template="groovy-html.template"}', 
                        attachLog: true, 
                        recipientProviders: [[$class: 'DevelopersRecipientProvider'],
                                           [$class: 'CulpritsRecipientProvider'], 
                                           [$class: 'RequesterRecipientProvider']], 
                        subject: "Jenkins Fail - ${JOB} #${BUILD_NUMBER} failed!", 
                        to:"${failureMailReceivers}"
            }
        }
    }
}
