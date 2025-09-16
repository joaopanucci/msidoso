// assets/js/main.js

/**
 * Carrega o cabeçalho de um arquivo externo e o insere no elemento #header-placeholder.
 * Também gerencia a visibilidade dos botões de login/logout e o estado ativo dos links de navegação.
 */
async function loadHeader() {
    try {
        const response = await fetch('_header.html');
        if (!response.ok) {
            throw new Error(`Erro ao carregar o cabeçalho: ${response.statusText}`);
        }
        const headerHTML = await response.text();
        const placeholder = document.getElementById('header-placeholder');
        if (placeholder) {
            placeholder.innerHTML = headerHTML;
            setupHeader();
        }
    } catch (error) {
        console.error(error);
        const placeholder = document.getElementById('header-placeholder');
        if (placeholder) {
            placeholder.innerHTML = '<p class="text-red-500 text-center">Erro ao carregar o menu.</p>';
        }
    }
}

/**
 * Configura os elementos do cabeçalho, como o estado de autenticação e os links de navegação.
 */
function setupHeader() {
    // Espera o Firebase estar pronto
    window.addEventListener('firebaseReady', () => {
        const auth = window.auth;
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const userInfo = document.getElementById('user-info');
        const userDisplayName = document.getElementById('userDisplayName');

        if (auth) {
            auth.onAuthStateChanged(user => {
                if (user) {
                    // Usuário está logado
                    if (loginBtn) loginBtn.classList.add('hidden');
                    if (logoutBtn) logoutBtn.classList.remove('hidden');
                    if (userInfo) userInfo.classList.remove('hidden');
                    if (userDisplayName) userDisplayName.textContent = user.displayName || user.email;

                    logoutBtn.addEventListener('click', () => {
                        auth.signOut().then(() => {
                            window.location.href = 'login.html';
                        });
                    });
                } else {
                    // Usuário não está logado
                    if (loginBtn) loginBtn.classList.remove('hidden');
                    if (logoutBtn) logoutBtn.classList.add('hidden');
                    if (userInfo) userInfo.classList.add('hidden');
                }
            });
        } else {
            console.warn("Firebase Auth não inicializado a tempo para o setupHeader.");
        }
    });

    // Define o link de navegação ativo
    setActiveNavLink();
}

/**
 * Adiciona a classe 'active' ao link de navegação correspondente à página atual.
 */
function setActiveNavLink() {
    const navLinks = document.querySelectorAll('#main-nav .nav-item');
    const currentPage = window.location.pathname.split('/').pop();

    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href').split('/').pop();
        if (linkPage === currentPage) {
            link.classList.add('text-blue-600', 'font-semibold', 'border-b-2', 'border-blue-600', 'pb-1');
            link.classList.remove('text-gray-600');
        } else {
            link.classList.remove('text-blue-600', 'font-semibold', 'border-b-2', 'border-blue-600', 'pb-1');
            link.classList.add('text-gray-600');
        }
    });
}

// Carrega o cabeçalho quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', loadHeader);
