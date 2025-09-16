# MSidoso — Estrutura Organizada (assets)
- CSS em `assets/css/*.css`
- JS em `assets/js/*.js`
- Arquivo mestre: `assets/js/app.js` (inicializa Firebase e expõe `window.db`, `window.auth` e evento `firebaseReady`)
- Todas as páginas HTML foram atualizadas para referenciar:
  - `<link rel="stylesheet" href="assets/css/PAGINA.css">`
  - `<script src="assets/js/app.js" defer></script>`
  - `<script src="assets/js/PAGINA.js" defer></script>`

> Observação: o `storageBucket` do Firebase fornecido está como `msidoso.firebasestorage.app`. Em muitos projetos, o padrão é `msidoso.appspot.com`. Verifique no console do Firebase e ajuste em `assets/js/app.js` se necessário.
