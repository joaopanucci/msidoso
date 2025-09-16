// Página de introdução (inicio.js)
(function(){
  // Helpers de UI
  function scrollToLogin() {
    const el = document.getElementById('login-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }
  function showLoginForm() {
    const modal = document.getElementById('loginModal');
    if (modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); }
  }
  function closeModal() {
    const modal = document.getElementById('loginModal');
    if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
  }
  function showInfo() {
    alert('Para mais informações sobre o sistema MSIdoso, entre em contato com nossa equipe de suporte através do email: suporte@msidoso.com.br');
  }

  // Eventos antigos preservados
  document.addEventListener('DOMContentLoaded', () => {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
      loginModal.addEventListener('click', function(e){
        if (e.target === this) closeModal();
      });
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
          e.preventDefault();
          const target = document.querySelector(this.getAttribute('href'));
          if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    });

    // Expor as funções usadas por onclick no HTML
    window.scrollToLogin = scrollToLogin;
    window.showLoginForm = showLoginForm;
    window.closeModal = closeModal;
    window.showInfo = showInfo;
  });

  // Integração Firebase (Auth + Firestore)
  function wireLoginForm(){
    const form = document.querySelector('#loginModal form');
    if (!form || !window.auth) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = form.querySelector('input[type="text"]').value.trim();
      const pass  = form.querySelector('input[type="password"]').value;
      const btn   = form.querySelector('button[type="submit"]');
      const orig  = btn.innerHTML;
      try {
        btn.disabled = true; btn.innerHTML = 'Entrando...';
        await window.auth.signInWithEmailAndPassword(email, pass);
        // redirecionar após login
        window.location.href = 'dashboard.html';
      } catch (err) {
        alert('Falha no login: ' + (err.message || err));
      } finally {
        btn.disabled = false; btn.innerHTML = orig;
      }
    });
  }

  async function loadIntroStats(){
    if (!window.db) return;
    const el = document.createElement('div');
    el.className = 'mt-12 grid gap-6 sm:grid-cols-3';
    el.innerHTML = `
      <div class="bg-white/15 backdrop-blur-md rounded-2xl p-6 text-center border border-white/20">
        <p class="text-white/80 text-sm">Usuários</p>
        <p id="count-users" class="text-3xl font-bold text-white mt-2">--</p>
      </div>
      <div class="bg-white/15 backdrop-blur-md rounded-2xl p-6 text-center border border-white/20">
        <p class="text-white/80 text-sm">Pacientes</p>
        <p id="count-pacientes" class="text-3xl font-bold text-white mt-2">--</p>
      </div>
      <div class="bg-white/15 backdrop-blur-md rounded-2xl p-6 text-center border border-white/20">
        <p class="text-white/80 text-sm">Avaliações</p>
        <p id="count-avaliacoes" class="text-3xl font-bold text-white mt-2">--</p>
      </div>
    `;
    // inserir após o CTA
    const cta = document.getElementById('login-section');
    if (cta && cta.parentNode) cta.parentNode.appendChild(el);

    try {
      // Ajuste os nomes das coleções conforme o seu Firestore
      const usersSnap = await window.db.collection('usuarios').limit(1).get();
      const usersCount = (await window.db.collection('usuarios').get()).size || usersSnap.size; // simples
      document.getElementById('count-users').textContent = usersCount;

      const pacSnap = await window.db.collection('pacientes').get();
      document.getElementById('count-pacientes').textContent = pacSnap.size;

      // Avaliações: pode estar em 'avaliacoes' ou 'vulnerabilidade'
      let total = 0;
      try { total += (await window.db.collection('avaliacoes').get()).size; } catch(_){}
      try { total += (await window.db.collection('vulnerabilidade').get()).size; } catch(_){}
      document.getElementById('count-avaliacoes').textContent = total;
    } catch (e) {
      console.warn('Não foi possível carregar estatísticas iniciais:', e);
    }
  }

  // Quando Firebase estiver pronto
  if (window.firebaseApp) {
    wireLoginForm();
    loadIntroStats();
  } else {
    window.addEventListener('firebaseReady', () => {
      wireLoginForm();
      loadIntroStats();
    }, { once:true });
  }
})();
