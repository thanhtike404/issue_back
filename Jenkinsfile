pipeline {
    agent any
    
    environment {
        VULTR_USER = "root"
        VULTR_HOST = "45.77.35.66"
        IMAGE_NAME = "issue-back"
        IMAGE_TAG = "1.9.2"  // Change if needed
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
            // steps {
            //     script {
            //         echo "Building Docker image..."
            //         sh """
            //             docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
            //             docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${DOCKER_HUB_USER}/${IMAGE_NAME}:${IMAGE_TAG}
            //         """
            //     }
            // }
        }

        stage("Push to Docker Hub") {
            // steps {
            //     withCredentials([usernamePassword(credentialsId: 'docker-hub', usernameVariable: 'DK_NAME', passwordVariable: 'DK_PASSWORD')]) {
            //         echo "======== Logging in to Docker Hub ========"
            //         sh """
            //             echo $DK_PASSWORD | docker login -u $DK_NAME --password-stdin
            //             echo "======== Login Successful ========"
            //             docker push $DK_NAME/${IMAGE_NAME}:${IMAGE_TAG}
            //         """
            //     }
            
            // }
        }

        
        stage('Deploy to EC2') {
            steps {
                sh "echo 'Deploying to EC2..."
                script {
                    sshagent(['vultr_vps']) {
                        sh """
                        ssh -o StrictHostKeyChecking=no ${VULTR_USER}@${VULTR_HOST} << 'EOF'
                          touch index.html
EOF
                        """
                    }
            }
            }
        }
    }
}
