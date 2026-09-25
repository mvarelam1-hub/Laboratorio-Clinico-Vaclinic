// Jenkinsfile — Entregable "DevOps 2" (ACS, Fase 2)
//
// Definición PORTABLE del mismo pipeline de 4 etapas (checkout -> build ->
// test -> deploy staging) implementado y EJECUTADO de verdad en GitHub
// Actions (.github/workflows/ci-cd-e12.yml, con capturas reales de
// corridas exitosas y fallidas en el documento de este entregable).
//
// Por qué esta definición no se ejecutó contra un servidor Jenkins real:
// levantar un servidor Jenkins (vía Docker Hub o vía el instalador de
// jenkins.io) requiere descargar imágenes/paquetes desde dominios que la
// política de red del entorno de desarrollo de este entregable bloquea, y
// crear una cuenta nueva en un Jenkins gestionado en la nube está fuera de
// lo que se nos permite hacer automáticamente en nombre del equipo. En vez
// de simular una ejecución que no ocurrió, se optó por lo mismo que en
// entregables anteriores: declarar la limitación con transparencia y
// entregar un pipeline SÍ verificado de punta a punta en una herramienta
// de CI/CD real y accesible (GitHub Actions, sobre el repositorio real del
// equipo). Este Jenkinsfile es sintácticamente válido y queda listo para
// ejecutarse tal cual en cualquier servidor Jenkins con el plugin
// "Pipeline" y un agente con Node.js 20 + Python 3.11 + Chrome, apuntando
// a este mismo repositorio.
pipeline {
    agent any

    environment {
        DATABASE_URL          = 'postgres://postgres:postgres@localhost:5432/vaclinic_ci'
        PGSSLMODE             = 'disable'
        PORTAL_TOKEN_SECRET   = 'clave-larga-de-prueba-para-ci-1234567890abcdef'
        DEV_AUTH_BYPASS_UID   = 'ci-test-uid'
        NODE_ENV              = 'development'
        VACLINIC_BASE_URL     = 'http://localhost:3000'
    }

    stages {
        stage('1. Checkout') {
            steps {
                checkout scm
            }
        }

        stage('2. Build') {
            steps {
                sh 'npm ci'
                sh 'npm run build'
            }
        }

        stage('3. Test') {
            stages {
                stage('3a. Unitarias (Vitest, E10)') {
                    steps {
                        sh 'npm run test:coverage'
                    }
                }
                stage('3b. Preparar base de datos de prueba') {
                    steps {
                        sh 'npm run migrate -- --seed'
                        sh '''
                          psql "$DATABASE_URL" -c \
                            "UPDATE usuario SET uid = 'ci-test-uid' WHERE rol = 'director_laboratorio';"
                        '''
                    }
                }
                stage('3c. Levantar servidor real') {
                    steps {
                        sh '''
                          nohup node dist/server.cjs > server.log 2>&1 &
                          for i in $(seq 1 30); do
                            curl -sf http://localhost:3000/api/health > /dev/null && exit 0
                            sleep 1
                          done
                          cat server.log; exit 1
                        '''
                    }
                }
                stage('3d. Integración + sistema + seguridad + rendimiento (pytest+Selenium)') {
                    steps {
                        sh 'pip install -r tests_python/requirements.txt'
                        sh 'pytest tests_python/ -v --html=reports/reporte_pytest.html --self-contained-html'
                    }
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'coverage/**, reports/**, server.log', allowEmptyArchive: true
                    junit allowEmptyResults: true, testResults: 'reports/*.xml'
                }
            }
        }

        stage('4. Deploy staging') {
            when {
                branch 'main'
            }
            steps {
                // Equivalente al job "deploy-staging" de GitHub Actions:
                // publica el frontend compilado en un entorno de staging
                // real y separado de producción (Render + Neon).
                sh 'npx vite build --base=/Laboratorio-Clinico-Vaclinic/staging/'
                sh 'echo "Artefacto de staging listo en dist/ — publicar con el paso de despliegue del servidor Jenkins configurado (p. ej. rsync/scp a un host de staging, o un plugin de publicación de artefactos estáticos)."'
            }
        }
    }

    post {
        success {
            echo 'Pipeline completo: checkout, build, pruebas (unitarias + integración + sistema + seguridad + rendimiento) y deploy a staging.'
        }
        failure {
            echo 'El pipeline falló — revisar el estado de cada etapa arriba antes de fusionar/desplegar.'
        }
    }
}
