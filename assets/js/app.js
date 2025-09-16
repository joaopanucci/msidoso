// MSidoso master app.js (Firebase init + helpers)
(function(){
  // Firebase config provided by the user
  const firebaseConfig = {
    apiKey: "AIzaSyDCrtBxvIcacNY5bsnL1yJ-1atWYkccilk",
    authDomain: "msidoso.firebaseapp.com",
    projectId: "msidoso",
    storageBucket: "msidoso.firebasestorage.app",
    messagingSenderId: "251928338091",
    appId: "1:251928338091:web:9dd6f45787aab0ee85e1ee",
    measurementId: "G-9JKWL7536W"
  };

  // Initialize only once
  if (!window.firebaseApp) {
    try {
      window.firebaseApp = firebase.initializeApp(firebaseConfig);
      window.auth = firebase.auth();
      window.db   = firebase.firestore();
      window.dispatchEvent(new Event('firebaseReady'));
      console.log('[MSidoso] Firebase inicializado.');
    } catch (e) {
      console.error('[MSidoso] Erro ao inicializar Firebase:', e);
    }
  }

  // Common auth guard helper
  window.requireAuth = function(onAuthed, onNoAuth){
    if (!window.auth) {
      console.warn('Auth não disponível');
      if (onNoAuth) onNoAuth();
      return;
    }
    window.auth.onAuthStateChanged((user) => {
      if (user) {
        onAuthed && onAuthed(user);
      } else {
        onNoAuth ? onNoAuth() : (window.location.href = 'login.html');
      }
    });
  };

  // Simple helpers
  window.formatDateBR = function(dateLike){
    const d = new Date(dateLike);
    return isNaN(d) ? '-' : d.toLocaleDateString('pt-BR');
  };
})();
