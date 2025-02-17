pipeline {
    agent any
    
    environment {
        EC2_USER = "ubuntu"
        EC2_HOST = "13.250.57.111"
        IMAGE_NAME = "thanhtikezaw404/issue-back"
        IMAGE_TAG = "1.7"  // Change if needed
        CONTAINER_NAME = "issue-back"
        PORT = "4000"
        DOCKER_HUB_USER = "thanhtikezaw404"
    }

    stages {
        stage('Test') {
            steps {
                echo "Running tests..."
            }
        }

        stage('Build & Push Docker Image') {
            steps {
                script {
                    echo "Building Docker image..."
                    sh """
                        docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
                        docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${DOCKER_HUB_USER}/${IMAGE_NAME}:${IMAGE_TAG}
                    """
                }
            }
        }

        stage("Push to Docker Hub") {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-hub', usernameVariable: 'DK_NAME', passwordVariable: 'DK_PASSWORD')]) {
                    echo "======== Logging in to Docker Hub ========"
                    sh """
                        echo $DK_PASSWORD | docker login -u $DK_NAME --password-stdin
                        echo "======== Login Successful ========"
                        docker push $DK_NAME/${IMAGE_NAME}:${IMAGE_TAG}
                    """
                }
            }
        }

        stage('Deploy to EC2') {
            steps {
                script {
                    sshagent(['ec2-server-key']) {
                        sh """
                        ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} << EOF
                        
                        echo "Stopping existing container if running..."
                        docker stop ${CONTAINER_NAME} || true
                        docker rm ${CONTAINER_NAME} || true

                        echo "Pulling latest Docker image..."
                        docker pull ${DOCKER_HUB_USER}/${IMAGE_NAME}:${IMAGE_TAG}

                        echo "Running new container..."
                        docker run -d -p ${PORT}:${PORT} --name ${CONTAINER_NAME} ${DOCKER_HUB_USER}/${IMAGE_NAME}:${IMAGE_TAG}

                        echo "Deployment completed!"
                        EOF
                        """
                    }
                }
            }
        }
    }
}
