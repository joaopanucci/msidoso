import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
        import { getFirestore, collection, getDocs, query, where, orderBy, limit, } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
        import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

        // Firebase configuration (replace with your config)
        const firebaseConfig = {
            apiKey: "AIzaSyDCrtBxvIcacNY5bsnL1yJ-1atWYkccilk",
            authDomain: "msidoso.firebaseapp.com",
            projectId: "msidoso",
            storageBucket: "msidoso.firebasestorage.app",
            messagingSenderId: "251928338091",
            appId: "1:251928338091:web:9dd6f45787aab0ee85e1ee",
            measurementId: "G-9JKWL7536W"
        };

        try {
            console.log('🔄 Inicializando Firebase...');

            // Inicializar Firebase App
            if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
                throw new Error('Configuração do Firebase inválida');
            }
            window.firebaseApp = initializeApp(firebaseConfig);
            console.log('✅ Firebase App inicializado');

            // Inicializar Firestore
            window.db = getFirestore(window.firebaseApp);
            if (!window.db) {
                throw new Error('Erro ao inicializar Firestore');
            }
            console.log('✅ Firestore inicializado');

            // Inicializar Authentication
            window.auth = getAuth(window.firebaseApp);
            if (!window.auth) {
                throw new Error('Erro ao inicializar Authentication');
            }
            console.log('✅ Authentication inicializado');

            // Exportar módulos
            window.firebaseModules = {
                collection,
                getDocs,
                query,
                where,
                orderBy,
                limit,
                onAuthStateChanged,
                signOut
            };

            // Verificar se todos os módulos foram exportados
            const requiredModules = ['collection', 'getDocs', 'query', 'where', 'orderBy', 'limit'];
            const missingModules = requiredModules.filter(module => !window.firebaseModules[module]);

            if (missingModules.length > 0) {
                throw new Error(`Módulos faltando: ${missingModules.join(', ')}`);
            }
            console.log('✅ Módulos Firebase exportados globalmente');

            // Dispatch custom event
            window.dispatchEvent(new CustomEvent('firebaseReady'));
            console.log('🚀 Firebase está pronto para uso!');
        } catch (error) {
  console.error('❌ Erro ao inicializar Firebase:', error);
  window.addEventListener('DOMContentLoaded', () => {
    try {
      const loading = document.getElementById('loadingScreen');
      const authReq = document.getElementById('authRequired');
      if (loading) loading.classList.add('hidden');
      if (authReq) {
        authReq.classList.remove('hidden');
        const p = authReq.querySelector('p');
        if (p) p.textContent = 'Erro ao conectar com o Firebase. Por favor, recarregue a página.';
      }
    } catch (e) { console.error(e); }
  });
}

// Global variables
        let evaluationChart = null;
        let patientsChart = null;
        let updateInterval = null;
        let currentUser = null;
        let currentFilters = {
            municipality: '',
            dateRange: '30',
            riskLevel: ''
        };

        // Configuration
        const CONFIG = {
            updateInterval: 5 * 60 * 1000, // 5 minutes
            itemsPerList: 5,
            chartPeriod: 7, // days
            colors: {
                patients: '#3B82F6',
                evaluations: '#10B981',
                professionals: '#8B5CF6',
                alerts: '#EF4444'
            }
        };

        // Authentication check
        function initializeAuth() {
            const { onAuthStateChanged } = window.firebaseModules;

            onAuthStateChanged(window.auth, (user) => {
                if (user) {
                    currentUser = user;
                    document.getElementById('userDisplayName').textContent = user.displayName || user.email;
                    document.getElementById('loadingScreen').classList.add('hidden');
                    document.getElementById('dashboardContent').classList.remove('hidden');
                    document.getElementById('dashboardContent').classList.add('fade-in');
                    initializeDashboard();
                } else {
                    document.getElementById('loadingScreen').classList.add('hidden');
                    document.getElementById('authRequired').classList.remove('hidden');
                }
            });
        }

        // Redirect to login
        function redirectToLogin() {
            window.location.href = 'login.html';
        }

        // Logout function
        function logout() {
            const { signOut } = window.firebaseModules;
            signOut(window.auth).then(() => {
                console.log('Usuário deslogado com sucesso');
            }).catch((error) => {
                console.error('Erro ao fazer logout:', error);
            });
        }

        // Initialize dashboard
        async function initializeDashboard() {
            console.log('🚀 Iniciando dashboard...');

            // Set current date first
            setCurrentDate();

            try {
                console.log('✅ Conexão com Firestore será testada ao carregar os dados');

                // Initialize components
                await loadDashboardData();
                setupEventListeners();
                startAutoUpdate();

                console.log('✅ Dashboard inicializado com sucesso!');
            } catch (error) {
                console.error('❌ Erro ao inicializar dashboard:', error);
                showErrorMessage('Erro ao carregar dados. Verifique sua conexão.');

                // Still setup listeners even if initial load fails
                setupEventListeners();
                startAutoUpdate();
            }
        }

        // Set current date
        function setCurrentDate() {
            document.getElementById('currentDate').textContent = new Date().toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        // Load dashboard data
        async function loadDashboardData() {
            try {
                console.log('📊 Iniciando carregamento de dados...');
                updateLastUpdateTime();

                // Verificar se temos acesso aos módulos do Firebase
                const { collection, getDocs } = window.firebaseModules;
                if (!collection || !getDocs) {
                    throw new Error('Módulos do Firebase não estão disponíveis');
                }

                console.log('🔍 Verificando conexão com o Firestore...');
                // Testar conexão com o Firestore
                const testQuery = await getDocs(collection(window.db, 'pacientes'));
                console.log(`✅ Conexão testada - ${testQuery.size} documentos encontrados`);

                // Load data in parallel for better performance
                console.log('🔄 Carregando dados em paralelo...');
                const [
                    patientsData,
                    evaluationsData,
                    professionalsData,
                    vulnerabilityData
                ] = await Promise.all([
                    loadPatientsData(),
                    loadEvaluationsData(),
                    loadProfessionalsData(),
                    loadVulnerabilityData()
                ]);

                // Update UI with loaded data
                updateStatistics(patientsData, evaluationsData, professionalsData, vulnerabilityData);
                updateCharts(evaluationsData, patientsData);
                updateRecentLists(patientsData, evaluationsData);

            } catch (error) {
                console.error('Erro ao carregar dados do dashboard:', error);
                showErrorMessage('Erro ao carregar dados. Tentando novamente...');
            }
        }

        // Load patients data from Firestore with filters
        async function loadPatientsData() {
            try {
                console.log('👥 Carregando dados de pacientes...');

                // Verificar se temos os módulos necessários
                const { collection, getDocs, query, where, orderBy, limit } = window.firebaseModules;
                if (!collection || !getDocs || !query || !where || !orderBy || !limit) {
                    throw new Error('Módulos do Firebase necessários não encontrados');
                }

                // Verificar se temos acesso ao Firestore
                if (!window.db) {
                    throw new Error('Firestore não está inicializado');
                }

                // Build base query with filters
                let baseQuery = collection(window.db, 'pacientes');
                let queryConstraints = [];

                console.log('🔍 Aplicando filtros:', currentFilters);

                // Apply municipality filter
                if (currentFilters.municipality) {
                    queryConstraints.push(where('municipio', '==', currentFilters.municipality));
                }

                // Apply date range filter
                if (currentFilters.dateRange !== 'all') {
                    const daysAgo = parseInt(currentFilters.dateRange);
                    const filterDate = new Date();
                    filterDate.setDate(filterDate.getDate() - daysAgo);
                    queryConstraints.push(where('dataCadastro', '>=', filterDate));
                }

                // Get total patients with filters
                const filteredQuery = queryConstraints.length > 0 ?
                    query(baseQuery, ...queryConstraints) : baseQuery;
                const patientsSnapshot = await getDocs(filteredQuery);
                const totalPatients = patientsSnapshot.size;

                // Get today's patients
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                let todayConstraints = [where('dataCadastro', '>=', today)];
                if (currentFilters.municipality) {
                    todayConstraints.push(where('municipio', '==', currentFilters.municipality));
                }

                const todayQuery = query(baseQuery, ...todayConstraints);
                const todaySnapshot = await getDocs(todayQuery);
                const newPatientsToday = todaySnapshot.size;

                // Get recent patients with filters
                let recentConstraints = [orderBy('dataCadastro', 'desc'), limit(CONFIG.itemsPerList)];
                if (currentFilters.municipality) {
                    recentConstraints.unshift(where('municipio', '==', currentFilters.municipality));
                }

                const recentQuery = query(baseQuery, ...recentConstraints);
                const recentSnapshot = await getDocs(recentQuery);
                const recentPatients = recentSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Get trend data
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                let trendConstraints = [where('dataCadastro', '>=', sevenDaysAgo), orderBy('dataCadastro', 'asc')];
                if (currentFilters.municipality) {
                    trendConstraints.unshift(where('municipio', '==', currentFilters.municipality));
                }

                const trendQuery = query(baseQuery, ...trendConstraints);
                const trendSnapshot = await getDocs(trendQuery);
                const trendData = processTrendData(trendSnapshot.docs);

                // Calculate growth percentage
                const lastWeekPatients = trendData.reduce((a, b) => a + b, 0);
                const growthPercentage = lastWeekPatients > 0 ?
                    ((newPatientsToday / lastWeekPatients) * 100).toFixed(1) : 0;

                return {
                    total: totalPatients,
                    newToday: newPatientsToday,
                    recent: recentPatients,
                    trend: trendData,
                    growth: growthPercentage,
                    topMunicipality: await getTopMunicipality('pacientes')
                };
            } catch (error) {
                console.error('Erro ao carregar dados de pacientes:', error);
                return { total: 0, newToday: 0, recent: [], trend: [], growth: 0, topMunicipality: '--' };
            }
        }

        // Load evaluations data from Firestore
        async function loadEvaluationsData() {
            const { collection, getDocs, query, where, orderBy, limit } = window.firebaseModules;

            try {
                // Get total evaluations
                const evaluationsSnapshot = await getDocs(collection(window.db, 'avaliacoes'));
                const totalEvaluations = evaluationsSnapshot.size;

                // Get today's evaluations
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const todayQuery = query(
                    collection(window.db, 'avaliacoes'),
                    where('dataAvaliacao', '>=', today)
                );
                const todaySnapshot = await getDocs(todayQuery);
                const newEvaluationsToday = todaySnapshot.size;

                // Get recent evaluations
                const recentQuery = query(
                    collection(window.db, 'avaliacoes'),
                    orderBy('dataAvaliacao', 'desc'),
                    limit(CONFIG.itemsPerList)
                );
                const recentSnapshot = await getDocs(recentQuery);
                const recentEvaluations = recentSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Process evaluation types
                const evaluationTypes = processEvaluationTypes(evaluationsSnapshot.docs);

                return {
                    total: totalEvaluations,
                    newToday: newEvaluationsToday,
                    recent: recentEvaluations,
                    types: evaluationTypes
                };
            } catch (error) {
                console.error('Erro ao carregar dados de avaliações:', error);
                return { total: 0, newToday: 0, recent: [], types: {} };
            }
        }

        // Load professionals data from Firestore
        async function loadProfessionalsData() {
            const { collection, getDocs } = window.firebaseModules;

            try {
                const professionalsSnapshot = await getDocs(collection(window.db, 'usuarios'));
                return professionalsSnapshot.size;
            } catch (error) {
                console.error('Erro ao carregar dados de profissionais:', error);
                return 0;
            }
        }

        // Load vulnerability data from Firestore
        async function loadVulnerabilityData() {
            const { collection, getDocs, query, where } = window.firebaseModules;

            try {
                const highRiskQuery = query(
                    collection(window.db, 'vulnerabilidade'),
                    where('nivelRisco', '==', 'alto')
                );
                const highRiskSnapshot = await getDocs(highRiskQuery);
                return highRiskSnapshot.size;
            } catch (error) {
                console.error('Erro ao carregar dados de vulnerabilidade:', error);
                return 0;
            }
        }

        // Process trend data for charts
        function processTrendData(docs) {
            const trendData = Array(7).fill(0);
            const today = new Date();

            docs.forEach(doc => {
                const docDate = doc.data().dataCadastro.toDate();
                const daysDiff = Math.floor((today - docDate) / (1000 * 60 * 60 * 24));
                if (daysDiff >= 0 && daysDiff < 7) {
                    trendData[6 - daysDiff]++;
                }
            });

            return trendData;
        }

        // Process evaluation types for chart
        function processEvaluationTypes(docs) {
            const types = {
                'Inicial': 0,
                'Seguimento': 0,
                'Reavaliação': 0,
                'Alta': 0,
                'IVCF-20': 0,
                'IVSF-10': 0
            };

            docs.forEach(doc => {
                const tipo = doc.data().tipo;
                if (types.hasOwnProperty(tipo)) {
                    types[tipo]++;
                }
            });

            return types;
        }

        // Helper function to get top municipality
        async function getTopMunicipality(collection) {
            try {
                const { getDocs, collection: firestoreCollection } = window.firebaseModules;
                const snapshot = await getDocs(firestoreCollection(window.db, collection));

                const municipalityCounts = {};
                snapshot.docs.forEach(doc => {
                    const municipio = doc.data().municipio || 'Não informado';
                    municipalityCounts[municipio] = (municipalityCounts[municipio] || 0) + 1;
                });

                const topMunicipality = Object.keys(municipalityCounts).reduce((a, b) =>
                    municipalityCounts[a] > municipalityCounts[b] ? a : b, 'Campo Grande');

                return topMunicipality;
            } catch (error) {
                return 'Campo Grande';
            }
        }

        // Update statistics cards with enhanced data
        function updateStatistics(patientsData, evaluationsData, professionalsData, vulnerabilityData) {
            // Animate number changes
            animateNumber('totalPatients', patientsData.total);
            animateNumber('totalEvaluations', evaluationsData.total);
            animateNumber('totalProfessionals', professionalsData);
            animateNumber('highRiskPatients', vulnerabilityData);

            // Update growth indicators
            document.getElementById('newPatientsToday').innerHTML = `<i class="fas fa-arrow-up bounce"></i> +${patientsData.newToday} hoje`;
            document.getElementById('newEvaluationsToday').innerHTML = `<i class="fas fa-arrow-up bounce"></i> +${evaluationsData.newToday} hoje`;

            // Update additional metrics
            document.getElementById('patientsGrowth').textContent = `Crescimento: +${patientsData.growth}%`;
            document.getElementById('patientsCity').textContent = `Município: ${patientsData.topMunicipality}`;

            document.getElementById('evaluationsGrowth').textContent = `Crescimento: +${evaluationsData.growth || 0}%`;
            document.getElementById('evaluationsCompleted').textContent = `Concluídas: ${evaluationsData.completed || 0}`;

            document.getElementById('professionalsOnline').textContent = `Online: ${Math.floor(professionalsData * 0.7)}`;
            document.getElementById('professionalsRole').textContent = `Médicos: ${Math.floor(professionalsData * 0.4)}`;

            document.getElementById('riskTrend').textContent = `Tendência: ${vulnerabilityData > 10 ? '↗️' : '↘️'}`;
            document.getElementById('riskUrgent').textContent = `Urgente: ${Math.floor(vulnerabilityData * 0.3)}`;
        }

        // Animate number changes
        function animateNumber(elementId, targetValue) {
            const element = document.getElementById(elementId);
            const currentValue = parseInt(element.textContent) || 0;
            const increment = Math.ceil((targetValue - currentValue) / 20);

            if (currentValue !== targetValue) {
                const timer = setInterval(() => {
                    const current = parseInt(element.textContent) || 0;
                    if (current < targetValue) {
                        element.textContent = Math.min(current + increment, targetValue).toLocaleString('pt-BR');
                    } else {
                        element.textContent = targetValue.toLocaleString('pt-BR');
                        clearInterval(timer);
                    }
                }, 50);
            } else {
                element.textContent = targetValue.toLocaleString('pt-BR');
            }
        }

        // Update charts
        function updateCharts(evaluationsData, patientsData) {
            // Evaluation types chart
            const evaluationCtx = document.getElementById('evaluationChart').getContext('2d');

            if (evaluationChart) {
                evaluationChart.destroy();
            }

            const hasEvaluationData = Object.values(evaluationsData.types).some(value => value > 0);

            evaluationChart = new Chart(evaluationCtx, {
                type: 'bar',
                data: {
                    labels: Object.keys(evaluationsData.types),
                    datasets: [{
                        label: 'Avaliações',
                        data: hasEvaluationData ? Object.values(evaluationsData.types) : [1, 1, 1, 1, 1, 1],
                        backgroundColor: hasEvaluationData ? [
                            CONFIG.colors.patients,
                            CONFIG.colors.evaluations,
                            CONFIG.colors.professionals,
                            '#F59E0B',
                            CONFIG.colors.alerts,
                            '#06B6D4'
                        ] : ['#E5E7EB', '#E5E7EB', '#E5E7EB', '#E5E7EB', '#E5E7EB', '#E5E7EB'],
                        borderRadius: 8,
                        borderSkipped: false,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: '#F3F4F6'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });

            // Patients trend chart
            const patientsCtx = document.getElementById('patientsChart').getContext('2d');

            if (patientsChart) {
                patientsChart.destroy();
            }

            const labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
            const hasTrendData = patientsData.trend.some(value => value > 0);

            patientsChart = new Chart(patientsCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Novos Pacientes',
                        data: hasTrendData ? patientsData.trend : [0, 0, 0, 0, 0, 0, 0],
                        borderColor: hasTrendData ? CONFIG.colors.patients : '#E5E7EB',
                        backgroundColor: hasTrendData ? `${CONFIG.colors.patients}20` : '#F9FAFB',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: hasTrendData ? CONFIG.colors.patients : '#E5E7EB',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: '#F3F4F6'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }

        // Update recent lists
        function updateRecentLists(patientsData, evaluationsData) {
            // Recent patients
            const recentPatientsContainer = document.getElementById('recentPatients');
            recentPatientsContainer.innerHTML = '';

            if (patientsData.recent.length === 0) {
                recentPatientsContainer.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-user-times text-3xl mb-2"></i>
                        <p>Nenhum paciente recente</p>
                    </div>
                `;
            } else {
                patientsData.recent.forEach(patient => {
                    const patientElement = createRecentPatientElement(patient);
                    recentPatientsContainer.appendChild(patientElement);
                });
            }

            // Recent evaluations
            const recentEvaluationsContainer = document.getElementById('recentEvaluations');
            recentEvaluationsContainer.innerHTML = '';

            if (evaluationsData.recent.length === 0) {
                recentEvaluationsContainer.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-clipboard-times text-3xl mb-2"></i>
                        <p>Nenhuma avaliação recente</p>
                    </div>
                `;
            } else {
                evaluationsData.recent.forEach(evaluation => {
                    const evaluationElement = createRecentEvaluationElement(evaluation);
                    recentEvaluationsContainer.appendChild(evaluationElement);
                });
            }

            // Load upcoming appointments from Firebase
            updateUpcomingAppointments();
        }

        // Create recent patient element
        function createRecentPatientElement(patient) {
            const div = document.createElement('div');
            div.className = 'flex items-center space-x-3 p-3 bg-gray-50 rounded-lg';

            const timeAgo = getTimeAgo(patient.dataCadastro);

            div.innerHTML = `
                <div class="bg-blue-100 p-2 rounded-full">
                    <i class="fas fa-user text-blue-600"></i>
                </div>
                <div class="flex-1">
                    <p class="font-medium text-gray-900">${patient.nome}</p>
                    <p class="text-sm text-gray-500">${timeAgo}</p>
                </div>
            `;

            return div;
        }

        // Create recent evaluation element
        function createRecentEvaluationElement(evaluation) {
            const div = document.createElement('div');
            div.className = 'flex items-center space-x-3 p-3 bg-gray-50 rounded-lg';

            const timeAgo = getTimeAgo(evaluation.dataAvaliacao);

            div.innerHTML = `
                <div class="bg-green-100 p-2 rounded-full">
                    <i class="fas fa-clipboard-check text-green-600"></i>
                </div>
                <div class="flex-1">
                    <p class="font-medium text-gray-900">${evaluation.tipo} - ${evaluation.pacienteNome}</p>
                    <p class="text-sm text-gray-500">${timeAgo}</p>
                </div>
            `;

            return div;
        }

        // Update upcoming appointments from Firebase
        async function updateUpcomingAppointments() {
            const { collection, getDocs, query, where, orderBy, limit } = window.firebaseModules;
            const appointmentsContainer = document.getElementById('upcomingAppointments');

            try {
                // Get upcoming appointments from Firebase
                const today = new Date();
                const nextWeek = new Date();
                nextWeek.setDate(today.getDate() + 7);

                const appointmentsQuery = query(
                    collection(window.db, 'consultas'),
                    where('dataConsulta', '>=', today),
                    where('dataConsulta', '<=', nextWeek),
                    orderBy('dataConsulta', 'asc'),
                    limit(CONFIG.itemsPerList)
                );

                const appointmentsSnapshot = await getDocs(appointmentsQuery);
                appointmentsContainer.innerHTML = '';

                if (appointmentsSnapshot.empty) {
                    appointmentsContainer.innerHTML = `
                        <div class="text-center py-8 text-gray-500">
                            <i class="fas fa-calendar-times text-3xl mb-2"></i>
                            <p>Nenhuma consulta agendada</p>
                        </div>
                    `;
                    return;
                }

                appointmentsSnapshot.docs.forEach(doc => {
                    const appointment = doc.data();
                    const div = document.createElement('div');
                    div.className = 'flex items-center space-x-3 p-3 bg-gray-50 rounded-lg';

                    const appointmentTime = formatAppointmentTime(appointment.dataConsulta);

                    div.innerHTML = `
                        <div class="bg-purple-100 p-2 rounded-full">
                            <i class="fas fa-calendar text-purple-600"></i>
                        </div>
                        <div class="flex-1">
                            <p class="font-medium text-gray-900">${appointment.pacienteNome}</p>
                            <p class="text-sm text-gray-500">${appointmentTime}</p>
                        </div>
                    `;
                    appointmentsContainer.appendChild(div);
                });

            } catch (error) {
                console.error('Erro ao carregar consultas:', error);
                appointmentsContainer.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-exclamation-triangle text-3xl mb-2"></i>
                        <p>Erro ao carregar consultas</p>
                    </div>
                `;
            }
        }

        // Get time ago string
        function getTimeAgo(timestamp) {
            const now = new Date();
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

            if (diffInHours < 1) return 'Há poucos minutos';
            if (diffInHours < 24) return `Há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;

            const diffInDays = Math.floor(diffInHours / 24);
            if (diffInDays === 1) return 'Ontem';
            if (diffInDays < 7) return `Há ${diffInDays} dias`;

            return date.toLocaleDateString('pt-BR');
        }

        // Format appointment time
        function formatAppointmentTime(timestamp) {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const appointmentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

            const timeString = date.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });

            if (appointmentDate.getTime() === today.getTime()) {
                return `Hoje, ${timeString}`;
            } else if (appointmentDate.getTime() === tomorrow.getTime()) {
                return `Amanhã, ${timeString}`;
            } else {
                return `${date.toLocaleDateString('pt-BR')}, ${timeString}`;
            }
        }

        // Update last update time
        function updateLastUpdateTime() {
            const now = new Date();
            document.getElementById('lastUpdate').textContent = now.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        // Show error message with toast notification and retry button
        function showErrorMessage(message, type = 'error') {
            console[type === 'error' ? 'error' : 'warn'](message);

            // Remove existing toast if any
            const existingToast = document.querySelector('.toast-notification');
            if (existingToast) {
                existingToast.remove();
            }

            // Create toast element
            const toast = document.createElement('div');
            toast.className = `toast-notification fixed bottom-4 right-4 ${type === 'error' ? 'bg-red-500' : 'bg-yellow-500'} text-white px-6 py-3 rounded-lg shadow-lg z-50 fade-in flex items-center space-x-2`;

            // Adicionar botão de retry apenas para erros
            const retryButton = type === 'error' ? `
                <button class="ml-4 bg-white text-red-500 px-2 py-1 rounded hover:bg-red-100 transition-colors" onclick="retryLoad()">
                    <i class="fas fa-sync-alt mr-1"></i>Tentar Novamente
                </button>
            ` : '';

            toast.innerHTML = `
                <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-exclamation-triangle'} mr-2"></i>
                <span>${message}</span>
                ${retryButton}
                <button class="ml-4 hover:text-gray-200" onclick="this.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            `;

            document.body.appendChild(toast);

            // Auto remove after 5 seconds
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.classList.remove('fade-in');
                    toast.classList.add('fade-out');
                    setTimeout(() => toast.remove(), 300);
                }
            }, 5000);
        }

        // Filter management functions
        function applyFilters() {
            const municipality = document.getElementById('municipalityFilter').value;
            const dateRange = document.getElementById('dateRangeFilter').value;
            const riskLevel = document.getElementById('riskLevelFilter').value;

            currentFilters = { municipality, dateRange, riskLevel };

            updateActiveFilters();
            loadDashboardData();

            // Add loading animation to apply button
            const applyBtn = document.getElementById('applyFiltersBtn');
            applyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Aplicando...</span>';

            setTimeout(() => {
                applyBtn.innerHTML = '<i class="fas fa-search"></i> <span>Aplicar</span>';
            }, 1000);
        }

        function updateActiveFilters() {
            const activeFiltersDiv = document.getElementById('activeFilters');
            const activeFilterTags = document.getElementById('activeFilterTags');

            activeFilterTags.innerHTML = '';

            let hasActiveFilters = false;

            if (currentFilters.municipality) {
                hasActiveFilters = true;
                const tag = createFilterTag('Município', currentFilters.municipality, 'municipality');
                activeFilterTags.appendChild(tag);
            }

            if (currentFilters.dateRange !== '30') {
                hasActiveFilters = true;
                const dateLabels = {
                    '7': 'Últimos 7 dias',
                    '90': 'Últimos 3 meses',
                    '365': 'Último ano',
                    'all': 'Todo período'
                };
                const tag = createFilterTag('Período', dateLabels[currentFilters.dateRange], 'dateRange');
                activeFilterTags.appendChild(tag);
            }

            if (currentFilters.riskLevel) {
                hasActiveFilters = true;
                const riskLabels = {
                    'baixo': 'Baixo Risco',
                    'medio': 'Médio Risco',
                    'alto': 'Alto Risco'
                };
                const tag = createFilterTag('Risco', riskLabels[currentFilters.riskLevel], 'riskLevel');
                activeFilterTags.appendChild(tag);
            }

            if (hasActiveFilters) {
                activeFiltersDiv.classList.remove('hidden');
                activeFiltersDiv.classList.add('slide-up');
            } else {
                activeFiltersDiv.classList.add('hidden');
            }
        }

        function createFilterTag(label, value, filterType) {
            const tag = document.createElement('div');
            tag.className = 'filter-tag';
            tag.innerHTML = `
                <span>${label}: ${value}</span>
                <i class="fas fa-times remove-tag" onclick="removeFilter('${filterType}')"></i>
            `;
            return tag;
        }

        function removeFilter(filterType) {
            currentFilters[filterType] = filterType === 'dateRange' ? '30' : '';

            // Update form controls
            if (filterType === 'municipality') {
                document.getElementById('municipalityFilter').value = '';
            } else if (filterType === 'dateRange') {
                document.getElementById('dateRangeFilter').value = '30';
            } else if (filterType === 'riskLevel') {
                document.getElementById('riskLevelFilter').value = '';
            }

            updateActiveFilters();
            loadDashboardData();
        }

        function clearAllFilters() {
            currentFilters = { municipality: '', dateRange: '30', riskLevel: '' };

            document.getElementById('municipalityFilter').value = '';
            document.getElementById('dateRangeFilter').value = '30';
            document.getElementById('riskLevelFilter').value = '';

            updateActiveFilters();
            loadDashboardData();
        }

        // Card interaction functions
        function showPatientDetails(e) {
            // Add scale animation
            e.currentTarget.classList.add('scale-in');
            setTimeout(() => {
                e.currentTarget.classList.remove('scale-in');
            }, 300);

            // Navigate to patients page with current filters
            const params = new URLSearchParams(currentFilters);
            window.location.href = `pacientes.html?${params.toString()}`;
        }

        function showEvaluationDetails(e) {
            e.currentTarget.classList.add('scale-in');
            setTimeout(() => {
                e.currentTarget.classList.remove('scale-in');
            }, 300);

            const params = new URLSearchParams(currentFilters);
            window.location.href = `avaliacoes.html?${params.toString()}`;
        }

        function showProfessionalDetails(e) {
            e.currentTarget.classList.add('scale-in');
            setTimeout(() => {
                e.currentTarget.classList.remove('scale-in');
            }, 300);

            window.location.href = 'usuarios.html';
        }

        function showRiskDetails(e) {
            e.currentTarget.classList.add('scale-in');
            setTimeout(() => {
                e.currentTarget.classList.remove('scale-in');
            }, 300);

            const params = new URLSearchParams({ ...currentFilters, riskLevel: 'alto' });
            window.location.href = `indicevulnerabilidade.html?${params.toString()}`;
        }

        // Setup event listeners
        function setupEventListeners() {
            // Logout button
            document.getElementById('logoutBtn').addEventListener('click', logout);

            // Filter controls
            document.getElementById('applyFiltersBtn').addEventListener('click', applyFilters);
            document.getElementById('clearFiltersBtn').addEventListener('click', clearAllFilters);

            // Quick action buttons with enhanced animations
            document.getElementById('addPatientBtn').addEventListener('click', (e) => {
                e.currentTarget.classList.add('scale-in');
                setTimeout(() => {
                    window.location.href = 'pacientes.html';
                }, 200);
            });

            document.getElementById('newEvaluationBtn').addEventListener('click', (e) => {
                e.currentTarget.classList.add('scale-in');
                setTimeout(() => {
                    window.location.href = 'avaliacoes.html';
                }, 200);
            });

            document.getElementById('manageUsersBtn').addEventListener('click', (e) => {
                e.currentTarget.classList.add('scale-in');
                setTimeout(() => {
                    window.location.href = 'usuarios.html';
                }, 200);
            });

            // Refresh icon click
            document.getElementById('refreshIcon').addEventListener('click', () => {
                document.getElementById('refreshIcon').classList.add('fa-spin');
                loadDashboardData().finally(() => {
                    document.getElementById('refreshIcon').classList.remove('fa-spin');
                });
            });

            // Add keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    switch (e.key) {
                        case 'r':
                            e.preventDefault();
                            document.getElementById('refreshIcon').click();
                            break;
                        case 'f':
                            e.preventDefault();
                            document.getElementById('municipalityFilter').focus();
                            break;
                    }
                }
            });
        }

        // Start auto update
        function startAutoUpdate() {
            updateInterval = setInterval(() => {
                loadDashboardData();
            }, CONFIG.updateInterval);
        }

        // Stop auto update
        function stopAutoUpdate() {
            if (updateInterval) {
                clearInterval(updateInterval);
                updateInterval = null;
            }
        }

        // Initialize when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            // Wait for Firebase modules to load
            setTimeout(initializeAuth, 1000);
        });

        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            stopAutoUpdate();
        });