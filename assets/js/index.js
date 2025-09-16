// Navigation and UI Functions
        function showSection(sectionName) {
            // Hide all sections
            const sections = ['dashboard', 'ivcf20', 'ivsf10', 'indicators', 'patients', 'reports', 'rbac', 'settings'];
            sections.forEach(section => {
                document.getElementById(section + '-section').classList.add('hidden');
            });
            
            // Show selected section
            document.getElementById(sectionName + '-section').classList.remove('hidden');
            
            // Update navigation
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('bg-blue-50', 'text-blue-700');
                item.classList.add('text-gray-700');
            });
            event.target.closest('.nav-item').classList.add('bg-blue-50', 'text-blue-700');
            event.target.closest('.nav-item').classList.remove('text-gray-700');
        }

        // Sidebar toggle
        document.getElementById('sidebarToggle').addEventListener('click', function() {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('-translate-x-full');
        });

        // IVCF-20 Functions
        function startIVCF20() {
            document.getElementById('ivcf20-form').classList.remove('hidden');
            document.getElementById('ivcf20-result').classList.add('hidden');
        }

        function calculateIVCF20() {
            // Simulate calculation
            const score = Math.floor(Math.random() * 15) + 1;
            let classification = 'Baixo Risco';
            let classColor = 'text-green-600';
            
            if (score >= 7 && score <= 14) {
                classification = 'Risco Moderado';
                classColor = 'text-yellow-600';
            } else if (score >= 15) {
                classification = 'Alto Risco';
                classColor = 'text-red-600';
            }
            
            document.getElementById('ivcf-score').textContent = score;
            document.getElementById('ivcf-classification').textContent = classification;
            document.getElementById('ivcf-classification').className = `text-lg font-semibold ${classColor}`;
            
            document.getElementById('ivcf20-form').classList.add('hidden');
            document.getElementById('ivcf20-result').classList.remove('hidden');
        }

        function cancelIVCF20() {
            document.getElementById('ivcf20-form').classList.add('hidden');
        }

        function saveIVCF20() {
            alert('Avaliação IVCF-20 salva com sucesso!');
            document.getElementById('ivcf20-result').classList.add('hidden');
        }

        // IVSF-10 Functions
        function startIVSF10() {
            document.getElementById('ivsf10-form').classList.remove('hidden');
        }

        function calculateIVSF10() {
            alert('Cálculo IVSF-10 realizado com sucesso!');
            document.getElementById('ivsf10-form').classList.add('hidden');
        }

        function cancelIVSF10() {
            document.getElementById('ivsf10-form').classList.add('hidden');
        }

        // RBAC Functions
        function showAddUser() {
            document.getElementById('addUserModal').classList.remove('hidden');
        }

        function closeAddUser() {
            document.getElementById('addUserModal').classList.add('hidden');
        }

        function saveUser() {
            alert('Usuário adicionado com sucesso!');
            closeAddUser();
        }

        // Initialize Charts
        window.addEventListener('load', function() {
            // IVCF Chart
            const ivcfCtx = document.getElementById('ivcfChart').getContext('2d');
            new Chart(ivcfCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                    datasets: [{
                        label: 'Avaliações IVCF-20',
                        data: [1200, 1350, 1100, 1400, 1250, 1500],
                        borderColor: '#3B82F6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4
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
                            beginAtZero: true
                        }
                    }
                }
            });

            // IVSF Chart
            const ivsfCtx = document.getElementById('ivsfChart').getContext('2d');
            new Chart(ivsfCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Campo Grande', 'Dourados', 'Três Lagoas', 'Corumbá', 'Outros'],
                    datasets: [{
                        data: [35, 20, 15, 12, 18],
                        backgroundColor: [
                            '#3B82F6',
                            '#10B981',
                            '#F59E0B',
                            '#EF4444',
                            '#8B5CF6'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });

            // IVSF Risk Chart
            const ivsfRiskCtx = document.getElementById('ivsfRiskChart').getContext('2d');
            new Chart(ivsfRiskCtx, {
                type: 'pie',
                data: {
                    labels: ['Baixo Risco', 'Risco Moderado', 'Alto Risco'],
                    datasets: [{
                        data: [45, 35, 20],
                        backgroundColor: ['#10B981', '#F59E0B', '#EF4444']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        });