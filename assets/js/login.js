function showLogin() {
            hideAllForms();
            document.getElementById('loginForm').classList.remove('hidden');
            document.getElementById('loginForm').classList.add('slide-in');
        }

        function showRegister() {
            hideAllForms();
            document.getElementById('registerForm').classList.remove('hidden');
            document.getElementById('registerForm').classList.add('slide-in');
        }

        function showForgotPassword() {
            hideAllForms();
            document.getElementById('forgotForm').classList.remove('hidden');
            document.getElementById('forgotForm').classList.add('slide-in');
        }

        function hideAllForms() {
            const forms = ['loginForm', 'registerForm', 'forgotForm', 'successMessage'];
            forms.forEach(formId => {
                document.getElementById(formId).classList.add('hidden');
                document.getElementById(formId).classList.remove('slide-in');
            });
        }

        function showSuccess(message) {
            hideAllForms();
            document.getElementById('successText').textContent = message;
            document.getElementById('successMessage').classList.remove('hidden');
            document.getElementById('successMessage').classList.add('slide-in');
        }

        function togglePassword() {
            const passwordInput = document.getElementById('password');
            const eyeIcon = document.getElementById('eyeIcon');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                eyeIcon.innerHTML = `
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
                `;
            } else {
                passwordInput.type = 'password';
                eyeIcon.innerHTML = `
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                `;
            }
        }

        function formatCPF(input) {
            let value = input.value.replace(/\D/g, '');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            input.value = value;
        }

        function toggleRegistrationNumber() {
            const profession = document.getElementById('profession').value;
            const registrationDiv = document.getElementById('registrationNumberDiv');
            const registrationInput = document.getElementById('registrationNumber');
            
            const professionsWithRegistration = ['Médico', 'Enfermeiro', 'Técnico em Enfermagem', 'Fisioterapeuta', 'Nutricionista', 'Psicólogo', 'Assistente Social', 'Farmacêutico'];
            
            if (professionsWithRegistration.includes(profession)) {
                registrationDiv.classList.remove('hidden');
                registrationInput.required = true;
            } else {
                registrationDiv.classList.add('hidden');
                registrationInput.required = false;
                registrationInput.value = '';
            }
        }

        async function handleLogin(event) {
            event.preventDefault();
            const cpf = document.getElementById('cpf').value;
            const password = document.getElementById('password').value;
            const loginBtn = event.target;
            
            loginBtn.disabled = true;
            loginBtn.textContent = 'Entrando...';
            
            try {
                // Para exemplo, usamos o CPF como email@fake.com
                const email = cpf.replace(/\D/g, '') + '@msidoso.com';
                await firebase.auth().signInWithEmailAndPassword(email, password);
                showSuccess('Login realizado com sucesso! Redirecionando...');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } catch (error) {
                console.error('Erro de login:', error);
                let errorMessage = 'Erro ao fazer login: ';
                
                switch (error.code) {
                    case 'auth/api-key-not-valid':
                        errorMessage = 'Erro de configuração: Firebase não configurado corretamente. Verifique o arquivo firebase-config.js';
                        break;
                    case 'auth/user-not-found':
                        errorMessage = 'Usuário não encontrado. Verifique seu CPF ou cadastre-se.';
                        break;
                    case 'auth/wrong-password':
                        errorMessage = 'Senha incorreta. Tente novamente.';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'CPF inválido. Verifique o formato.';
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = 'Muitas tentativas de login. Tente novamente mais tarde.';
                        break;
                    case 'auth/network-request-failed':
                        errorMessage = 'Erro de conexão. Verifique sua internet.';
                        break;
                    default:
                        errorMessage += (error.message || error);
                }
                
                alert(errorMessage);
            } finally {
                loginBtn.disabled = false;
                loginBtn.textContent = 'Entrar';
            }
        }

        async function handleRegister(event) {
            event.preventDefault();
            const fullName = document.getElementById('fullName').value;
            const cpf = document.getElementById('registerCpf').value;
            const email = document.getElementById('registerEmail').value;
            const municipality = document.getElementById('municipality').value;
            const profession = document.getElementById('profession').value;
            const registrationNumber = document.getElementById('registrationNumber').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const registerBtn = event.target;
            
            registerBtn.disabled = true;
            registerBtn.textContent = 'Criando conta...';
            
            if (password !== confirmPassword) {
                alert('As senhas não coincidem!');
                registerBtn.disabled = false;
                registerBtn.textContent = 'Criar conta';
                return;
            }
            
            // Verificar se o registro profissional é obrigatório
            const professionsWithRegistration = ['Médico', 'Enfermeiro', 'Técnico em Enfermagem', 'Fisioterapeuta', 'Nutricionista', 'Psicólogo', 'Assistente Social', 'Farmacêutico'];
            if (professionsWithRegistration.includes(profession) && !registrationNumber) {
                alert('Número de registro profissional é obrigatório para esta área!');
                registerBtn.disabled = false;
                registerBtn.textContent = 'Criar conta';
                return;
            }
            
            try {
                // Para exemplo, usamos o CPF como email@fake.com
                const fakeEmail = cpf.replace(/\D/g, '') + '@msidoso.com';
                const cred = await firebase.auth().createUserWithEmailAndPassword(fakeEmail, password);
                
                // Salvar dados do usuário no Firestore
                await db.collection('usuarios').doc(cred.user.uid).set({
                    fullName,
                    cpf,
                    email,
                    municipality,
                    profession,
                    registrationNumber,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                showSuccess('Conta criada com sucesso! Você já pode fazer login.');
                setTimeout(() => {
                    showLogin();
                }, 1500);
            } catch (error) {
                console.error('Erro de registro:', error);
                let errorMessage = 'Erro ao criar conta: ';
                
                switch (error.code) {
                    case 'auth/api-key-not-valid':
                        errorMessage = '🔧 Configuração necessária: O Firebase não está configurado. Por favor, configure suas credenciais no arquivo firebase-config.js seguindo as instruções no arquivo FIREBASE_SETUP.md';
                        break;
                    case 'auth/email-already-in-use':
                        errorMessage = 'Este CPF já está cadastrado. Tente fazer login ou use a opção "Esqueci minha senha".';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'CPF inválido. Verifique o formato.';
                        break;
                    case 'auth/weak-password':
                        errorMessage = 'Senha muito fraca. Use pelo menos 8 caracteres.';
                        break;
                    case 'auth/network-request-failed':
                        errorMessage = 'Erro de conexão. Verifique sua internet.';
                        break;
                    case 'auth/project-not-found':
                        errorMessage = 'Projeto Firebase não encontrado. Verifique a configuração do projectId.';
                        break;
                    default:
                        errorMessage += (error.message || error);
                }
                
                alert(errorMessage);
            } finally {
                registerBtn.disabled = false;
                registerBtn.textContent = 'Criar conta';
            }
        }

        async function handleForgotPassword(event) {
            event.preventDefault();
            const cpf = document.getElementById('forgotCpf').value;
            const forgotBtn = event.target;
            
            forgotBtn.disabled = true;
            forgotBtn.textContent = 'Enviando...';
            
            if (cpf) {
                try {
                    const fakeEmail = cpf.replace(/\D/g, '') + '@msidoso.com';
                    await firebase.auth().sendPasswordResetEmail(fakeEmail);
                    showSuccess('Instruções de recuperação enviadas para seu e-mail cadastrado!');
                } catch (error) {
                    console.error('Erro de recuperação:', error);
                    let errorMessage = 'Erro ao enviar instruções: ';
                    
                    switch (error.code) {
                        case 'auth/api-key-not-valid':
                            errorMessage = 'Erro de configuração: Firebase não configurado corretamente.';
                            break;
                        case 'auth/user-not-found':
                            errorMessage = 'CPF não encontrado. Verifique se está cadastrado.';
                            break;
                        case 'auth/invalid-email':
                            errorMessage = 'CPF inválido. Verifique o formato.';
                            break;
                        default:
                            errorMessage += (error.message || error);
                    }
                    
                    alert(errorMessage);
                }
            }
            
            forgotBtn.disabled = false;
            forgotBtn.textContent = 'Enviar instruções';
        }

        // Validação em tempo real da senha
        document.getElementById('registerPassword')?.addEventListener('input', function() {
            const password = this.value;
            const isValid = password.length >= 8;
            
            if (password.length > 0) {
                if (isValid) {
                    this.classList.remove('border-red-300');
                    this.classList.add('border-green-300');
                } else {
                    this.classList.remove('border-green-300');
                    this.classList.add('border-red-300');
                }
            } else {
                this.classList.remove('border-red-300', 'border-green-300');
            }
        });

        // Validação de confirmação de senha
        document.getElementById('confirmPassword')?.addEventListener('input', function() {
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = this.value;
            
            if (confirmPassword.length > 0) {
                if (password === confirmPassword) {
                    this.classList.remove('border-red-300');
                    this.classList.add('border-green-300');
                } else {
                    this.classList.remove('border-green-300');
                    this.classList.add('border-red-300');
                }
            } else {
                this.classList.remove('border-red-300', 'border-green-300');
            }
        });

        // Verificar configuração do Firebase ao carregar a página
        document.addEventListener('DOMContentLoaded', function() {
            // Verificar se há problemas de configuração
            checkFirebaseConfig();
        });

        function checkFirebaseConfig() {
            // Verificar se as configurações do Firebase são placeholders
            const config = window.firebaseConfig;
            if (config && (
                config.apiKey.includes('SUA_API_KEY') ||
                config.authDomain.includes('SEU_AUTH_DOMAIN') ||
                config.projectId.includes('SEU_PROJECT_ID')
            )) {
                showConfigBanner();
            }
        }

        function showConfigBanner() {
            const banner = document.getElementById('configBanner');
            if (banner) {
                banner.classList.remove('hidden');
                // Auto-hide após 10 segundos
                setTimeout(() => {
                    banner.classList.add('hidden');
                }, 10000);
            }
        }