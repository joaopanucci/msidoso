// INSTRUÇÕES PARA CONFIGURAR SEU FIREBASE:
// 1. Acesse https://console.firebase.google.com/
// 2. Crie um novo projeto ou use um existente
// 3. Ative Authentication (Email/Senha) e Firestore Database
// 4. No painel do projeto, clique no ícone de engrenagem > Configurações do projeto
// 5. Role para baixo até "Seus aplicativos" e adicione um aplicativo da web
// 6. Copie as credenciais e substitua os valores abaixo

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDCrtBxvIcacNY5bsnL1yJ-1atWYkccilk",
  authDomain: "msidoso.firebaseapp.com",
  projectId: "msidoso",
  storageBucket: "msidoso.firebasestorage.app",
  messagingSenderId: "251928338091",
  appId: "1:251928338091:web:9dd6f45787aab0ee85e1ee",
  measurementId: "G-9JKWL7536W"
};

// Verificar se Firebase está disponível
if (typeof firebase === 'undefined') {
    console.error('❌ Firebase SDK não carregado! Verifique se os scripts do Firebase estão incluídos no HTML.');
    alert('Erro: Firebase não carregado. Verifique a configuração.');
} else {
    try {
        // Inicializar Firebase apenas se ainda não foi inicializado
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log('✅ Firebase inicializado com sucesso!');
        } else {
            console.log('✅ Firebase já estava inicializado.');
        }
        
        // Inicializar serviços
        const auth = firebase.auth();
        const db = firebase.firestore();
        
        // Tornar disponível globalmente
        window.auth = auth;
        window.db = db;
        window.firebaseConfig = firebaseConfig;
        
        console.log('✅ Serviços Firebase prontos:', {
            auth: !!auth,
            firestore: !!db,
            projectId: firebaseConfig.projectId
        });
        
    } catch (error) {
        console.error('❌ Erro ao inicializar Firebase:', error);
        alert('Erro na configuração do Firebase: ' + error.message);
    }
}
