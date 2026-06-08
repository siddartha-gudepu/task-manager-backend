pipeline {
    agent any

    environment {
        IMAGE_NAME = "siddartha001/task-manager-backend"
        IMAGE_TAG = "${BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Create .env') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'mongo-creds',
                        usernameVariable: 'MONGO_USER',
                        passwordVariable: 'MONGO_PASS'
                    ),
                    string(
                        credentialsId: 'JWT_SECRET',
                        variable: 'JWT_SECRET'
                    ),
                    string(
                        credentialsId: 'ADMIN_INVITE_TOKEN',
                        variable: 'ADMIN_INVITE_TOKEN'
                    )
                ]) {

                    script {
                        def envContent = """
MONGO_URI=mongodb://${env.MONGO_USER}:${env.MONGO_PASS}@mongodb:27017/taskdb?authSource=admin
MONGO_INITDB_ROOT_USERNAME=${env.MONGO_USER}
MONGO_INITDB_ROOT_PASSWORD=${env.MONGO_PASS}

ME_CONFIG_MONGODB_URL=mongodb://${env.MONGO_USER}:${env.MONGO_PASS}@mongodb:27017/
ME_CONFIG_MONGODB_ADMINUSERNAME=${env.MONGO_USER}
ME_CONFIG_MONGODB_ADMINPASSWORD=${env.MONGO_PASS}

JWT_SECRET=${env.JWT_SECRET}
ADMIN_INVITE_TOKEN=${env.ADMIN_INVITE_TOKEN}

PORT=8000
"""
                        writeFile file: '.env', text: envContent
                    }
                }
            }
        }

        stage('Build Containers') {
            steps {
                bat 'docker compose build'
            }
        }

        stage('Start Environment') {
            steps {
                bat 'docker compose up -d'
            }
        }

        stage('Wait for Application') {
            steps {
                bat '''
                    timeout /t 20 /nobreak
                    docker ps
                '''
            }
        }

        stage('Run Tests') {
            steps {
                bat 'docker compose exec -T task-manager npm test'
            }
        }

        stage('Build Docker Image') {
            steps {
                bat '''
                    docker build -t %IMAGE_NAME%:%IMAGE_TAG% .
                    docker tag %IMAGE_NAME%:%IMAGE_TAG% %IMAGE_NAME%:latest
                '''
            }
        }

        stage('Push To DockerHub') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-creds',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {

                    bat '''
                        echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin
                        docker push %IMAGE_NAME%:%IMAGE_TAG%
                        docker push %IMAGE_NAME%:latest
                    '''
                }
            }
        }

        stage('Archive Artifacts') {
            steps {
                bat 'docker save %IMAGE_NAME%:%IMAGE_TAG% -o task-manager-%BUILD_NUMBER%.tar'

                archiveArtifacts artifacts: '*.tar', fingerprint: true
            }
        }
    }

    post {

        always {
            // make cleanup tolerant: returnStatus prevents pipeline failure if command fails
            bat returnStatus: true, script: 'docker compose down -v'
        }

        success {
            echo 'Build, Test and Push Successful'
        }

        failure {
            echo 'Build Failed'
        }
    }
}
