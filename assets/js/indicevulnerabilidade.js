// Global variables
        let selectedPatient = null;
        let pacientes = [];
        let currentAssessment = '';
        let questions = [];
        let currentQuestion = 0;
        let answers = {};

        // Questions
        const ivcf20Questions = [
            { id: 'vision', text: 'O(a) senhor(a) tem problema de visão que dificulta a leitura, assistir TV ou reconhecer pessoas?', type: 'yesno' },
            { id: 'hearing', text: 'O(a) senhor(a) tem problema de audição que dificulta a conversa com outras pessoas?', type: 'yesno' },
            { id: 'memory', text: 'O(a) senhor(a) tem perda de memória que atrapalha nas atividades do dia a dia?', type: 'yesno' },
            { id: 'mobility', text: 'O(a) senhor(a) tem problema de mobilidade, como dificuldade para andar dentro de casa ou subir escadas?', type: 'yesno' },
            { id: 'falls', text: 'O(a) senhor(a) já caiu nos últimos 12 meses?', type: 'yesno' },
            { id: 'selfcare', text: 'O(a) senhor(a) precisa de ajuda para se vestir, tomar banho ou se alimentar?', type: 'yesno' },
            { id: 'incontinence', text: 'O(a) senhor(a) tem dificuldade para controlar urina ou fezes?', type: 'yesno' },
            { id: 'loneliness', text: 'O(a) senhor(a) sente-se sozinho(a) ou triste com frequência?', type: 'yesno' },
            { id: 'sleep', text: 'O(a) senhor(a) tem dificuldade para dormir ou insônia frequente?', type: 'yesno' },
            { id: 'chronic', text: 'O(a) senhor(a) tem doenças crônicas como hipertensão, diabetes, doenças do coração, pulmão ou outras?', type: 'yesno' },
            { id: 'polypharmacy', text: 'O(a) senhor(a) faz uso de muitos remédios (polifarmácia)?', type: 'yesno' },
            { id: 'hospitalization', text: 'O(a) senhor(a) foi internado(a) no hospital no último ano?', type: 'yesno' },
            { id: 'shopping', text: 'O(a) senhor(a) consegue fazer compras sozinho(a)?', type: 'yesno' },
            { id: 'money', text: 'O(a) senhor(a) consegue administrar seu próprio dinheiro?', type: 'yesno' },
            { id: 'transport', text: 'O(a) senhor(a) consegue usar transporte público ou ir a lugares sozinho(a)?', type: 'yesno' },
            { id: 'cooking', text: 'O(a) senhor(a) consegue preparar suas refeições sozinho(a)?', type: 'yesno' },
            { id: 'cleaning', text: 'O(a) senhor(a) consegue fazer a limpeza da casa?', type: 'yesno' },
            { id: 'support', text: 'O(a) senhor(a) tem apoio familiar ou de amigos quando precisa de ajuda?', type: 'yesno' },
            { id: 'exercise', text: 'O(a) senhor(a) pratica atividade física regular (como caminhada, exercícios, esportes)?', type: 'yesno' },
            { id: 'social', text: 'O(a) senhor(a) participa de atividades sociais ou comunitárias?', type: 'yesno' }
        ];

        const ivsf10Questions = [
            { id: 'alone', text: 'O(a) senhor(a) mora sozinho(a)?', type: 'yesno' },
            { id: 'vision', text: 'O(a) senhor(a) tem dificuldade para enxergar?', type: 'yesno' },
            { id: 'hearing', text: 'O(a) senhor(a) tem dificuldade para ouvir?', type: 'yesno' },
            { id: 'mobility', text: 'O(a) senhor(a) tem dificuldade para caminhar dentro de casa ou subir escadas?', type: 'yesno' },
            { id: 'falls', text: 'O(a) senhor(a) já caiu nos últimos 12 meses?', type: 'yesno' },
            { id: 'memory', text: 'O(a) senhor(a) esquece compromissos importantes ou acontecimentos recentes?', type: 'yesno' },
            { id: 'selfcare', text: 'O(a) senhor(a) precisa de ajuda para se vestir, tomar banho ou comer?', type: 'yesno' },
            { id: 'chronic', text: 'O(a) senhor(a) tem alguma doença grave ou crônica?', type: 'yesno' },
            { id: 'medications', text: 'O(a) senhor(a) toma muitos medicamentos todos os dias?', type: 'yesno' },
            { id: 'support', text: 'O(a) senhor(a) tem pouco apoio familiar ou social?', type: 'yesno' }
        ];

        window.addEventListener('load', function() {
            checkAuth();
            loadPacientes();
        });

        function checkAuth() {
            firebase.auth().onAuthStateChanged(function(user) {
                if (user) {
                    document.getElementById('currentUser').textContent = user.email;
                } else {
                    window.location.href = 'login.html';
                }
            });
        }

        async function loadPacientes() {
            try {
                const snapshot = await db.collection('pacientes').get();
                pacientes = [];
                
                snapshot.forEach(doc => {
                    const paciente = doc.data();
                    pacientes.push({
                        id: doc.id,
                        fullName: paciente.fullName || paciente.nome || 'Nome não informado',
                        cpf: paciente.cpf || 'CPF não informado',
                        birthDate: paciente.birthDate || paciente.dataNascimento
                    });
                });

                // Inicializar pesquisa de pacientes com todos os pacientes
                if (pacientes.length > 0) {
                    renderPatientResults(pacientes);
                } else {
                    document.getElementById('patientResults').innerHTML = `
                        <div class="px-3 py-4 text-gray-500 text-center">
                            Nenhum paciente cadastrado
                        </div>
                    `;
                }
            } catch (error) {
                console.error('Erro ao carregar pacientes:', error);
                document.getElementById('patientResults').innerHTML = `
                    <div class="px-3 py-4 text-red-500 text-center">
                        Erro ao carregar pacientes: ${error.message}
                    </div>
                `;
            }
        }

        function nextToAssessmentSelection() {
            if (!selectedPatient) {
                alert('Por favor, selecione um paciente primeiro.');
                return;
            }
            document.getElementById('patientSelectionStep').classList.add('hidden');
            document.getElementById('assessmentSelection').classList.remove('hidden');
        }

        function startAssessment(type) {
            currentAssessment = type;
            currentQuestion = 0;
            answers = {};
            
            if (type === 'ivcf20') {
                questions = ivcf20Questions;
                document.getElementById('assessmentTitle').textContent = 'IVCF-20 - Avaliação Completa';
            } else if (type === 'ivsf10') {
                questions = ivsf10Questions;
                document.getElementById('assessmentTitle').textContent = 'IVSF-10 - Avaliação Rápida';
            }

            document.getElementById('assessmentSelection').classList.add('hidden');
            document.getElementById('assessmentForm').classList.remove('hidden');
            
            updateProgress();
            showQuestion();
        }

        function showQuestion() {
            const question = questions[currentQuestion];
            const container = document.getElementById('questionContainer');
            
            let questionHTML = `
                <div class="mb-6">
                    <h3 class="text-lg font-medium text-gray-800 mb-4">${currentQuestion + 1}. ${question.text}</h3>
                    <div class="space-y-3">
                        <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="radio" name="answer" value="yes" class="mr-3" onchange="handleAnswer('yes')">
                            <span>Sim</span>
                        </label>
                        <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="radio" name="answer" value="no" class="mr-3" onchange="handleAnswer('no')">
                            <span>Não</span>
                        </label>
                    </div>
                </div>
            `;
            
            container.innerHTML = questionHTML;
            
            // Restore previous answer if exists
            if (answers[question.id]) {
                const radio = container.querySelector(`input[value="${answers[question.id]}"]`);
                if (radio) radio.checked = true;
            }
            
            updateNavigationButtons();
        }

        function handleAnswer(value) {
            const question = questions[currentQuestion];
            answers[question.id] = value;
            document.getElementById('nextBtn').disabled = false;
        }

        function nextQuestion() {
            if (currentQuestion < questions.length - 1) {
                currentQuestion++;
                updateProgress();
                showQuestion();
            } else {
                showResults();
            }
        }

        function previousQuestion() {
            if (currentQuestion > 0) {
                currentQuestion--;
                updateProgress();
                showQuestion();
            }
        }

        function updateProgress() {
            const progress = ((currentQuestion + 1) / questions.length) * 100;
            document.getElementById('progressBar').style.width = progress + '%';
            document.getElementById('progressText').textContent = `${currentQuestion + 1}/${questions.length}`;
        }

        function updateNavigationButtons() {
            document.getElementById('prevBtn').disabled = currentQuestion === 0;
            document.getElementById('nextBtn').disabled = !answers[questions[currentQuestion].id];
            
            if (currentQuestion === questions.length - 1) {
                document.getElementById('nextBtn').textContent = 'Finalizar';
            } else {
                document.getElementById('nextBtn').textContent = 'Próxima';
            }
        }

        function calculateAge(birthDate) {
            if (!birthDate) return 0;
            const today = new Date();
            const birth = new Date(birthDate);
            let age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            return age;
        }

        function calculateScore() {
            let score = 0;
            const age = calculateAge(selectedPatient.birthDate);

            // Age-based scoring
            if (age >= 85) score += 3;
            else if (age >= 75) score += 2;
            else if (age >= 65) score += 1;

            Object.keys(answers).forEach(key => {
                if (currentAssessment === 'ivcf20') {
                    // For functional questions, "no" adds to vulnerability
                    if (['shopping', 'money', 'transport', 'cooking', 'cleaning', 'support', 'exercise', 'social'].includes(key)) {
                        if (answers[key] === 'no') score += 1;
                    } else {
                        // For health problems, "yes" adds to vulnerability
                        if (answers[key] === 'yes') score += 1;
                    }
                } else { // IVSF-10
                    // For most questions, "yes" indicates vulnerability
                    if (key === 'support') {
                        if (answers[key] === 'yes') score += 1; // Little support = vulnerability
                    } else {
                        if (answers[key] === 'yes') score += 1;
                    }
                }
            });

            return score;
        }

        function getVulnerabilityLevel(score) {
            if (currentAssessment === 'ivcf20') {
                if (score <= 6) return { level: 'Baixa', color: 'green', description: 'Baixo risco de vulnerabilidade' };
                if (score <= 13) return { level: 'Moderada', color: 'yellow', description: 'Risco moderado de vulnerabilidade' };
                return { level: 'Alta', color: 'red', description: 'Alto risco de vulnerabilidade' };
            } else { // IVSF-10
                if (score <= 3) return { level: 'Baixa', color: 'green', description: 'Baixo risco de vulnerabilidade' };
                if (score <= 6) return { level: 'Moderada', color: 'yellow', description: 'Risco moderado de vulnerabilidade' };
                return { level: 'Alta', color: 'red', description: 'Alto risco de vulnerabilidade' };
            }
        }

        async function showResults() {
            const score = calculateScore();
            const vulnerability = getVulnerabilityLevel(score);
            const maxScore = currentAssessment === 'ivcf20' ? 23 : 13; // 20 questions + 3 age points
            
            document.getElementById('assessmentForm').classList.add('hidden');
            document.getElementById('results').classList.remove('hidden');
            
            const resultContent = document.getElementById('resultContent');
            resultContent.innerHTML = `
                <div class="mb-6">
                    <div class="text-6xl font-bold text-${vulnerability.color}-600 mb-4">${score}</div>
                    <div class="text-xl text-gray-600 mb-2">Pontuação Total (de ${maxScore})</div>
                    <div class="inline-block px-4 py-2 rounded-full text-white bg-${vulnerability.color}-600 font-semibold">
                        Vulnerabilidade ${vulnerability.level}
                    </div>
                    <p class="text-gray-600 mt-4">${vulnerability.description}</p>
                </div>
                
                <div class="bg-gray-50 rounded-lg p-6 mb-6">
                    <h4 class="font-semibold text-gray-800 mb-4">Resumo da Avaliação</h4>
                    <div class="text-left space-y-2">
                        <p><strong>Paciente:</strong> ${selectedPatient.name}</p>
                        <p><strong>Idade:</strong> ${calculateAge(selectedPatient.birthDate)} anos</p>
                        <p><strong>Tipo de Avaliação:</strong> ${currentAssessment.toUpperCase()}</p>
                        <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
                        <p><strong>Avaliador:</strong> ${firebase.auth().currentUser.email}</p>
                    </div>
                </div>
            `;

            // Save to Firebase
            try {
                await saveAssessmentToFirebase(score, vulnerability);
            } catch (error) {
                console.error('Erro ao salvar avaliação:', error);
                alert('Erro ao salvar a avaliação. Os resultados foram calculados mas não foram salvos no banco de dados.');
            }
        }

        async function saveAssessmentToFirebase(score, vulnerability) {
            try {
                await db.collection('vulnerabilidade').add({
                    pacienteId: selectedPatient.id,
                    pacienteName: selectedPatient.name,
                    assessmentType: currentAssessment,
                    score: score,
                    vulnerabilityLevel: vulnerability.level,
                    answers: answers,
                    patientAge: calculateAge(selectedPatient.birthDate),
                    evaluatedBy: firebase.auth().currentUser.email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    date: new Date().toISOString().split('T')[0]
                });
                
                console.log('Avaliação de vulnerabilidade salva com sucesso!');
            } catch (error) {
                console.error('Erro ao salvar no Firebase:', error);
                throw error;
            }
        }

        function goBack() {
            document.getElementById('assessmentForm').classList.add('hidden');
            document.getElementById('assessmentSelection').classList.remove('hidden');
        }

        function restartAssessment() {
            document.getElementById('results').classList.add('hidden');
            document.getElementById('patientSelectionStep').classList.remove('hidden');
            
            // Reset form
            selectedPatient = null;
            clearPatientSelection();
            document.getElementById('nextToAssessment').disabled = true;
        }

        function printResults() {
            window.print();
        }

        // Funções para pesquisa de pacientes
        function searchPatients() {
            const searchTerm = document.getElementById('patientSearch').value.toLowerCase().trim();
            
            if (searchTerm.length === 0) {
                showAllPatients();
                return;
            }

            const filteredPatients = pacientes.filter(paciente => {
                const nome = paciente.fullName.toLowerCase();
                const cpf = paciente.cpf.replace(/\D/g, ''); // Remove caracteres não numéricos do CPF
                const searchCpf = searchTerm.replace(/\D/g, '');
                
                return nome.includes(searchTerm) || cpf.includes(searchCpf);
            });

            renderPatientResults(filteredPatients);
            showPatientDropdown();
        }

        function showAllPatients() {
            renderPatientResults(pacientes);
        }

        function renderPatientResults(patientsList) {
            const resultsDiv = document.getElementById('patientResults');
            
            if (patientsList.length === 0) {
                resultsDiv.innerHTML = `
                    <div class="px-3 py-2 text-gray-500 text-sm">
                        Nenhum paciente encontrado
                    </div>
                `;
                return;
            }

            resultsDiv.innerHTML = patientsList.map(paciente => `
                <div class="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0 patient-option" 
                     onclick="selectPatient('${paciente.id}', '${escapeHtml(paciente.fullName)}', '${paciente.birthDate}')">
                    <div class="font-medium text-gray-900">${escapeHtml(paciente.fullName)}</div>
                    <div class="text-sm text-gray-500">CPF: ${formatCPF(paciente.cpf)}</div>
                </div>
            `).join('');
        }

        function selectPatient(id, name, birthDate) {
            document.getElementById('patientSearch').value = name;
            document.getElementById('patientSelect').value = id;
            
            selectedPatient = {
                id: id,
                name: name,
                birthDate: birthDate
            };
            
            document.getElementById('nextToAssessment').disabled = false;
            hidePatientDropdown();
        }

        function clearPatientSelection() {
            document.getElementById('patientSearch').value = '';
            document.getElementById('patientSelect').value = '';
            selectedPatient = null;
            document.getElementById('nextToAssessment').disabled = true;
            hidePatientDropdown();
        }

        function showPatientDropdown() {
            document.getElementById('patientDropdown').classList.remove('hidden');
        }

        function hidePatientDropdown() {
            document.getElementById('patientDropdown').classList.add('hidden');
        }

        function formatCPF(cpf) {
            if (!cpf) return '';
            return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // Fechar dropdown ao clicar fora
        document.addEventListener('click', function(event) {
            const searchInput = document.getElementById('patientSearch');
            const dropdown = document.getElementById('patientDropdown');
            
            if (!searchInput.contains(event.target) && !dropdown.contains(event.target)) {
                hidePatientDropdown();
            }
        });

        // Navegação por teclado no dropdown
        document.getElementById('patientSearch').addEventListener('keydown', function(event) {
            const dropdown = document.getElementById('patientDropdown');
            const options = dropdown.querySelectorAll('.patient-option');
            let currentSelected = dropdown.querySelector('.bg-blue-100');
            
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                if (!currentSelected) {
                    if (options.length > 0) {
                        options[0].classList.add('bg-blue-100');
                    }
                } else {
                    currentSelected.classList.remove('bg-blue-100');
                    const nextOption = currentSelected.nextElementSibling;
                    if (nextOption) {
                        nextOption.classList.add('bg-blue-100');
                    } else {
                        options[0].classList.add('bg-blue-100');
                    }
                }
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                if (!currentSelected) {
                    if (options.length > 0) {
                        options[options.length - 1].classList.add('bg-blue-100');
                    }
                } else {
                    currentSelected.classList.remove('bg-blue-100');
                    const prevOption = currentSelected.previousElementSibling;
                    if (prevOption) {
                        prevOption.classList.add('bg-blue-100');
                    } else {
                        options[options.length - 1].classList.add('bg-blue-100');
                    }
                }
            } else if (event.key === 'Enter') {
                event.preventDefault();
                if (currentSelected) {
                    currentSelected.click();
                }
            } else if (event.key === 'Escape') {
                hidePatientDropdown();
            }
        });