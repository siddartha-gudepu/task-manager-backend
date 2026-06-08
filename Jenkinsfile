pipeline {
agent any

```
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

                writeFile file: '.env', text: """
```

MONGO_URI=mongodb://${MONGO_USER}:${MONGO_PASS}@mongodb:27017/taskdb?authSource=admin
MONGO_INITDB_ROOT_USERNAME=${MONGO_USER}
MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASS}

ME_CONFIG_MONGODB_URL=mongodb://${MONGO_USER}:${MONGO_PASS}@mongodb:27017/
ME_CONFIG_MONGODB_ADMINUSERNAME=${MONGO_USER}
ME_CONFIG_MONGODB_ADMINPASSWORD=${MONGO_PASS}

JWT_SECRET=${JWT_SECRET}
ADMIN_INVITE_TOKEN=${ADMIN_INVITE_TOKEN}

PORT=8000
"""
}
}
}

```
    stage('Build Containers') {
        steps {
            sh 'docker compose build'
        }
    }

    stage('Start Environment') {
        steps {
            sh 'docker compose up -d'
        }
    }

    stage('Wait for Application') {
        steps {
            sh '''
                sleep 20
                docker ps
            '''
        }
    }

    stage('Run Tests') {
        steps {
            sh '''
                docker compose exec -T task-manager npm test
            '''
        }
    }

    stage('Build Docker Image') {
        steps {
            sh '''
                docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
                docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:latest
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

                sh '''
                    echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin

                    docker push ${IMAGE_NAME}:${IMAGE_TAG}
                    docker push ${IMAGE_NAME}:latest
                '''
            }
        }
    }

    stage('Archive Artifacts') {
        steps {
            sh '''
                docker save ${IMAGE_NAME}:${IMAGE_TAG} -o task-manager-${BUILD_NUMBER}.tar
            '''

            archiveArtifacts artifacts: '*.tar', fingerprint: true
        }
    }
}

post {

    always {
        sh 'docker compose down -v || true'
    }

    success {
        echo 'Build, Test and Push Successful'
    }

    failure {
        echo 'Build Failed'
    }
}
```

}
