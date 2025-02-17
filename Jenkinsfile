pipeline {
    agent any

    stages {
        stage('test'){

        }
        stage('Build Docker Image') {
            steps {
              
            }
        }
        stage('Ec2 Deployment'){
            steps{
               script{
                def dockerCmd = "docker run -d -p 4000:4000 thanhtikezaw404/issue-back:1.6 ${dockerCmd}"
                 sshagent(['ec2-server-key']) {
                    
                    sh 'ssh -o StrictHostKeyChecking=no ubuntu@13.250.57.111'
}
               }
            }
        }
    }
}
