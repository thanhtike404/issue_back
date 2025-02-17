pipeline {
    agent any

    stages {
        stage('Test') {
            steps {
                echo "Running tests..."
                // Add test commands here if necessary
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    echo "Building Docker image..."
                    // Add Docker build commands here
                    // Example: sh 'docker build -t my-image:latest .'
                }
            }
        }

                stage('Ec2 Deployment'){
            steps {
               script {
                def dockerCmd = "docker run -d -p 4000:4000 thanhtikezaw404/issue-back:1.6"
                 sshagent(['ec2-server-key']) {
                    
                    sh "ssh -o StrictHostKeyChecking=no ubuntu@ec2-13-250-57-111.ap-southeast-1.compute.amazonaws.com ${dockerCmd}"
                    }
               }
            }
        }
    }
}
