#!/usr/bin/env groovy

pipeline {
	agent {
		docker {
			image 'node:10'
			args '-u 0'
		}
	}
	environment {
		CI = 'true'
		DEBIAN_FRONTEND = 'noninteractive'
	}
	stages {
		stage('Bootstrap') {
			steps {
				echo 'Bootstrapping..'
				sh 'apt-get update && apt-get install -y python3 sox libav-tools'
			}
		}
		stage('Lint') {
			steps {
				echo 'Linting..'
				sh 'make lint-checkstyle'
				recordIssues qualityGates: [[threshold: 5, type: 'TOTAL', unstable: false]], tools: [esLint(pattern: 'test/tests.eslint.xml')], unhealthy: 50
			}
		}
		stage('Build') {
			steps {
				echo 'Building..'
				sh 'CI=false make'
			}
		}
		stage('Test') {
			when {
				branch 'devel'
			}
			steps {
				echo 'Testing..'
				sh 'make test-coverage'
				junit allowEmptyResults: true, testResults: 'test/jest-test-results.xml'
				publishHTML([allowMissing: false, alwaysLinkToLastBuild: false, keepAll: true, reportDir: 'coverage/lcov-report/', reportFiles: 'index.html', reportName: 'Test Coverage Report', reportTitles: ''])
			}
		}
		stage('Dist') {
			steps {
				echo 'Dist..'
				sh 'make dist'
				sh '$(git diff --stat)'
				sh 'test -z "$(git diff --shortstat 2>/dev/null |tail -n1)" && echo "Clean check passed."'
				archiveArtifacts artifacts: 'dist/*.tar.gz', fingerprint: true
			}
		}
	}
	post {
		always {
			cleanWs()
		}
	}
}
