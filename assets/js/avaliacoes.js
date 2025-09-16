// ------- Estado -------
let evaluations = [];                 // será populado
let vulnerabilityAssessments = [];    // será populado
let filteredEvaluations = [];

const statusColors = {
    pendente: 'bg-orange-100 text-orange-800',
    concluida: 'bg-green-100 text-green-800',
    revisao: 'bg-blue-100 text-blue-800',
};
const typeColors = {
    ivcf20: 'bg-blue-100 text-blue-800',
    ivsf10: 'bg-purple-100 text-purple-800',
    vulnerabilidade: 'bg-indigo-100 text-indigo-800',
};
const typeLabels = {
    inicial: 'Avaliação Inicial',
    ivcf20: 'IVCF-20',
    ivsf10: 'IVSF-10',
    seguimento: 'Seguimento',
    reavaliacao: 'Reavaliação',
    alta: 'Alta',
    vulnerabilidade: 'Vulnerabilidade',
};

// ------- Init -------
document.addEventListener('DOMContentLoaded', async () => {
    try {
        checkAuthentication();
        wireUI();
        await loadVulnerabilityAssessments();   // carrega e converte para evaluations
        filteredEvaluations = [...evaluations];
        renderEvaluationsTable();
        updateFilterResults();
        updateStatistics();
    } catch (err) {
        console.error(err);
        showErrorMessage('Erro ao carregar a página. Recarregue a página.');
    }
});

function checkAuthentication() {
    if (!firebase?.auth) return; // caso offline
    firebase.auth().onAuthStateChanged((user) => {
        if (!user) window.location.href = 'login.html';
    });
}

// ------- Carregamento (Firestore) -------
async function loadAllAssessments() {
    try {
        if (!window.db) {
            console.warn('Firestore não inicializado. Carregando dados vazios.');
            return;
        }
        showLoadingState();

        // Carrega os dois tipos de avaliação em paralelo
        const [vulnerabilitySnapshot, clinicalSnapshot] = await Promise.all([
            db.collection('vulnerabilidade').orderBy('createdAt', 'desc').get(),
            db.collection('avaliacoes').orderBy('date', 'desc').get()
        ]);

        // Processa avaliações de vulnerabilidade
        const vulnerabilityAssessments = [];
        vulnerabilitySnapshot.forEach((doc) => {
            const data = doc.data();
            vulnerabilityAssessments.push({
                id: doc.id,
                patient: data.pacienteName || 'Nome não informado',
                type: data.assessmentType || 'vulnerabilidade', // ivcf20 ou ivsf10
                date: data.date || (data.createdAt ? data.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
                status: 'concluida', // Avaliações de vulnerabilidade são sempre concluídas
                professional: data.evaluatedBy || 'Não informado',
                score: data.score || 0,
                vulnerabilityLevel: data.vulnerabilityLevel || 'Não avaliado',
                source: 'vulnerabilidade'
            });
        });

        // Processa avaliações clínicas
        const clinicalAssessments = [];
        clinicalSnapshot.forEach((doc) => {
            const data = doc.data();
            clinicalAssessments.push({
                id: doc.id,
                patient: data.patient || 'Nome não informado',
                type: data.type || 'inicial',
                date: data.date || new Date().toISOString().split('T')[0],
                status: data.status || 'pendente',
                professional: data.professional || 'Não informado',
                ...data, // Inclui todos os outros campos
                source: 'avaliacoes'
            });
        });

        // Combina e remove duplicatas, se houver (improvável com fontes diferentes)
        evaluations = [...vulnerabilityAssessments, ...clinicalAssessments];

    } catch (e) {
        console.error('Erro ao carregar avaliações:', e);
        showErrorMessage('Erro ao carregar avaliações. Tente recarregar a página.');
    }
}

// ------- UI wiring -------
function wireUI() {
    // Botões topo
    document.getElementById('btnExportar').addEventListener('click', exportarRelatorio);
    document.getElementById('btnAplicar').addEventListener('click', aplicarFiltros);
    document.getElementById('btnLimpar').addEventListener('click', limparFiltros);

    // Modal new
    document.getElementById('btnCloseNew').addEventListener('click', hideNewEvaluationModal);
    document.getElementById('btnCancelarNew').addEventListener('click', hideNewEvaluationModal);

    // Modal view
    document.getElementById('btnCloseView').addEventListener('click', hideViewEvaluationModal);

    // Tempo real
    setupRealTimeFiltering();

    // Validations
    setupFormValidations();

    // Submit do form
    setupFormHandlers();
}

// ------- Form validações -------
function setupFormValidations() {
    const form = document.getElementById('newEvaluationForm');
    const inputs = form.querySelectorAll('input[required], select[required]');
    inputs.forEach((input) => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });
}

function validateField(event) {
    const field = event.target;
    const value = String(field.value || '').trim();
    field.classList.remove('border-red-500', 'focus:ring-red-500');

    if (field.hasAttribute('required') && !value) {
        showFieldError(field, 'Este campo é obrigatório');
        return false;
    }
    if (field.type === 'date' && value) {
        const selected = new Date(value); const today = new Date(); today.setHours(0, 0, 0, 0);
        if (selected < today) { showFieldError(field, 'A data não pode ser anterior a hoje'); return false; }
    }
    if (field.type === 'number' && value) {
        const n = parseFloat(value);
        if (field.id === 'pesoInput' && (n < 20 || n > 300)) { showFieldError(field, 'Peso deve estar entre 20 e 300 kg'); return false; }
        if (field.id === 'alturaInput' && (n < 100 || n > 250)) { showFieldError(field, 'Altura deve estar entre 100 e 250 cm'); return false; }
    }
    return true;
}

function showFieldError(field, message) {
    field.classList.add('border-red-500', 'focus:ring-red-500');
    const prev = field.parentNode.querySelector('.field-error'); if (prev) prev.remove();
    const div = document.createElement('div'); div.className = 'field-error text-red-500 text-sm mt-1'; div.textContent = message;
    field.parentNode.appendChild(div);
}
function clearFieldError(event) {
    const field = event.target;
    field.classList.remove('border-red-500', 'focus:ring-red-500');
    const msg = field.parentNode.querySelector('.field-error'); if (msg) msg.remove();
}
function validateForm() {
    const form = document.getElementById('newEvaluationForm');
    const requiredFields = form.querySelectorAll('input[required], select[required]');
    let ok = true;
    requiredFields.forEach((f) => { if (!validateField({ target: f })) ok = false; });
    return ok;
}

// ------- Renderização -------
function renderEvaluationsTable() {
    const tbody = document.getElementById('evaluationsTable');
    tbody.innerHTML = '';

    if (filteredEvaluations.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" class="px-6 py-12 text-center text-gray-500">
              <i class="fas fa-clipboard-list text-4xl mb-4 block text-gray-300"></i>
              <p class="text-lg font-medium">Nenhuma avaliação encontrada</p>
              <p class="text-sm">Inicie uma nova avaliação para ver os resultados aqui.</p>
            </td>
          </tr>`;
        return;
    }

    filteredEvaluations.forEach((ev) => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50 fade-in';
        tr.innerHTML = `
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm font-medium text-gray-900">${ev.patient}</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${typeColors[ev.type] || 'bg-gray-100 text-gray-800'}">${typeLabels[ev.type] || ev.type}</span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatDate(ev.date)}</td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[ev.status] || 'bg-gray-100 text-gray-800'}">${getStatusLabel(ev.status)}</span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${ev.professional || '-'}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <button class="text-blue-600 hover:text-blue-900 mr-3" onclick="viewEvaluation('${ev.id}')"><i class="fas fa-eye"></i></button>
            <button class="text-green-600 hover:text-green-900" onclick="generateReport('${ev.id}')"><i class="fas fa-file-download"></i></button>
          </td>
        `;
        tbody.appendChild(tr);
    });
}

function getStatusLabel(s) {
    const map = { pendente: 'Pendente', concluida: 'Concluída', revisao: 'Em Revisão' };
    return map[s] || s;
}
function formatDate(d) {
    const date = new Date(d);
    return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('pt-BR');
}

// ------- Filtros -------
async function filtrarAvaliacoes() {
    try {
        showLoadingState();
        const searchTerm = (document.getElementById('searchInput').value || '').toLowerCase();
        const t = document.getElementById('typeFilter').value;
        const s = document.getElementById('statusFilter').value;
        const p = document.getElementById('periodFilter').value;

        // pequena simulação de delay
        await new Promise(r => setTimeout(r, 150));

        const today = new Date();
        filteredEvaluations = evaluations.filter((ev) => {
            const matchesSearch = !searchTerm || (ev.patient || '').toLowerCase().includes(searchTerm);
            const matchesType = !t || ev.type === t;
            const matchesStatus = !s || ev.status === s;

            let matchesPeriod = true;
            if (p) {
                const d = new Date(ev.date);
                if (isNaN(d)) return false;
                switch (p) {
                    case 'today':
                        matchesPeriod = d.toDateString() === today.toDateString(); break;
                    case 'week': {
                        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                        matchesPeriod = d >= weekAgo; break;
                    }
                    case 'month':
                        matchesPeriod = d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear(); break;
                    case 'quarter': {
                        const q = Math.floor(today.getMonth() / 3);
                        const eq = Math.floor(d.getMonth() / 3);
                        matchesPeriod = (eq === q) && (d.getFullYear() === today.getFullYear()); break;
                    }
                    case 'year':
                        matchesPeriod = d.getFullYear() === today.getFullYear(); break;
                }
            }
            return matchesSearch && matchesType && matchesStatus && matchesPeriod;
        });

        renderEvaluationsTable();
        updateFilterResults();
        hideLoadingState();
    } catch (e) {
        console.error('Erro ao filtrar:', e);
        showErrorMessage('Erro ao aplicar filtros. Tente novamente.');
        hideLoadingState();
    }
}

function aplicarFiltros() { filtrarAvaliacoes(); }
function limparFiltros() {
    document.getElementById('searchInput').value = '';
    document.getElementById('typeFilter').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('periodFilter').value = '';
    filteredEvaluations = [...evaluations];
    renderEvaluationsTable();
    updateFilterResults();
}
function updateFilterResults() {
    document.getElementById('resultCount').textContent = filteredEvaluations.length;
    document.getElementById('totalCount').textContent = evaluations.length;
}
function showLoadingState() {
    const tbody = document.getElementById('evaluationsTable');
    tbody.innerHTML = `
        <tr>
          <td colspan="6" class="px-6 py-12 text-center">
            <div class="text-gray-500">
              <i class="fas fa-spinner fa-spin text-2xl mb-4"></i>
              <p class="text-lg font-medium">Carregando avaliações...</p>
            </div>
          </td>
        </tr>`;
}
function hideLoadingState() { /* render limpa o loading */ }

// ------- Tempo real -------
function setupRealTimeFiltering() {
    const realTime = document.getElementById('realTimeFilter');
    const search = document.getElementById('searchInput');
    const type = document.getElementById('typeFilter');
    const status = document.getElementById('statusFilter');
    const period = document.getElementById('periodFilter');

    const attach = () => {
        search.addEventListener('input', debounce(filtrarAvaliacoes, 300));
        type.addEventListener('change', filtrarAvaliacoes);
        status.addEventListener('change', filtrarAvaliacoes);
        period.addEventListener('change', filtrarAvaliacoes);
    };
    const detach = () => {
        search.oninput = null;
        type.onchange = null;
        status.onchange = null;
        period.onchange = null;
    };

    if (realTime.checked) attach();
    realTime.addEventListener('change', () => {
        if (realTime.checked) attach(); else detach();
    });
}
function debounce(fn, wait) {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

// ------- Métricas / relatórios -------
function showMetricsModal(type) {
    const m = {
        total: { title: 'Total de Avaliações', data: 'Distribuição por mês, tendências e comparativos' },
        ivcf20: { title: 'Avaliações IVCF-20', data: 'Índice Clínico-Funcional' },
        ivsf10: { title: 'Avaliações IVSF-10', data: 'Índice Social-Familiar' },
        pendentes: { title: 'Avaliações Pendentes', data: 'Avaliações que requerem atenção' },
        concluidas: { title: 'Avaliações Concluídas', data: 'Histórico de finalizadas' },
    };
    alert(`Métricas: ${m[type].title}\n${m[type].data}`);
}
function gerarRelatorio(tipo) {
    const r = {
        periodo: 'Relatório por Período - Avaliações por data',
        tipo: 'Relatório por Tipo - Distribuição dos tipos',
        profissional: 'Relatório por Profissional - Produtividade',
        paciente: 'Relatório por Paciente - Histórico individual',
    };
    alert(`Gerando: ${r[tipo]}`);
}
function exportarRelatorio() {
    try {
        const csv = generateCSVContent();
        downloadCSV(csv, 'avaliacoes_msidoso.csv');
        alert('Relatório exportado com sucesso!');
    } catch (e) {
        console.error(e);
        alert('Erro ao exportar relatório. Tente novamente.');
    }
}
function generateCSVContent() {
    const headers = ['Data', 'Paciente', 'Tipo', 'Status', 'Profissional'];
    const rows = filteredEvaluations.map((ev) => [
        formatDate(ev.date), ev.patient, ev.type, ev.status, ev.professional || ''
    ]);
    return [headers, ...rows].map(r => r.join(',')).join('\n');
}
function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.style.display = 'none';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

// ------- IMC -------
function calcularIMC() {
    const peso = parseFloat(document.getElementById('pesoInput').value);
    const altura = parseFloat(document.getElementById('alturaInput').value);
    const box = document.getElementById('imcResult');
    const span = document.getElementById('imcValue');
    if (peso && altura) {
        const imc = peso / Math.pow(altura / 100, 2);
        let cat = imc < 18.5 ? 'Abaixo do peso' : imc < 25 ? 'Peso normal' : imc < 30 ? 'Sobrepeso' : 'Obesidade';
        span.textContent = `${imc.toFixed(1)} (${cat})`;
        box.classList.remove('hidden');
    } else { box.classList.add('hidden'); }
}

// ------- Modais -------
function showNewEvaluationModal() {
    document.getElementById('newEvaluationModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}
function hideNewEvaluationModal() {
    document.getElementById('newEvaluationModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}
function hideViewEvaluationModal() {
    document.getElementById('viewEvaluationModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function viewEvaluation(id) {
    const evaluation = evaluations.find(e => e.id === id);
    if (!evaluation) return;

    const details = document.getElementById('evaluationDetails');
    const vulnColor = { Baixa: 'bg-green-100 text-green-800', Moderada: 'bg-yellow-100 text-yellow-800', Alta: 'bg-red-100 text-red-800' };

    details.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <h4 class="text-lg font-semibold text-gray-900 border-b pb-2">Informações Gerais</h4>
            <div><label class="block text-sm font-medium text-gray-600">Paciente</label>
              <p class="text-gray-900 font-medium">${evaluation.patient}</p></div>
            <div><label class="block text-sm font-medium text-gray-600">Tipo de Avaliação</label>
              <p class="text-gray-900">${typeLabels[evaluation.type] || evaluation.type}</p></div>
            <div><label class="block text-sm font-medium text-gray-600">Data da Avaliação</label>
              <p class="text-gray-900">${formatDate(evaluation.date)}</p></div>
            <div><label class="block text-sm font-medium text-gray-600">Profissional</label>
              <p class="text-gray-900">${evaluation.professional || '-'}</p></div>
            <div><label class="block text-sm font-medium text-gray-600">Status</label>
              <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[evaluation.status] || 'bg-gray-100 text-gray-800'}">
                ${getStatusLabel(evaluation.status)}
              </span></div>
          </div>
          <div class="space-y-4">
            <h4 class="text-lg font-semibold text-gray-900 border-b pb-2">Resultado</h4>
            <div><label class="block text-sm font-medium text-gray-600">Pontuação Total</label>
              <p class="text-2xl font-bold text-gray-900">${evaluation.score ?? 'N/A'}</p></div>
            <div><label class="block text-sm font-medium text-gray-600">Nível de Vulnerabilidade</label>
              <span class="inline-flex px-3 py-2 text-sm font-semibold rounded-full ${vulnColor[evaluation.vulnerabilityLevel] || 'bg-gray-100 text-gray-800'}">
                ${evaluation.vulnerabilityLevel || 'N/A'}
              </span></div>
          </div>
        </div>
        <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button onclick="hideViewEvaluationModal()" class="bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors">Fechar</button>
          <button onclick="generateReport('${evaluation.id}')" class="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
            <i class="fas fa-file-download mr-2"></i>Gerar Relatório
          </button>
        </div>
      `;
    document.getElementById('viewEvaluationModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function editEvaluation(id) { alert(`Editando avaliação ID: ${id}`); }
function deleteEvaluation(id) { if (confirm('Excluir?')) alert(`Excluída ID: ${id}`); }
function generateReport(id) { alert(`Gerando relatório para avaliação ID: ${id}`); }

function setupFormHandlers() {
    document.getElementById('newEvaluationForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        if (!validateForm()) { alert('Corrija os erros no formulário.'); return; }

        const submitBtn = this.querySelector('button[type="submit"]');
        const original = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Salvando...';
        submitBtn.disabled = true;

        try {
            await new Promise(r => setTimeout(r, 600)); // simula I/O

            const fd = new FormData(this);
            const newEvaluation = {
                id: (evaluations.length + 1).toString(),
                patient: fd.get('patient') || 'Paciente',
                type: fd.get('type') || 'inicial',
                date: fd.get('date') || new Date().toISOString().split('T')[0],
                time: fd.get('time') || '09:00',
                status: 'pendente',
                professional: 'Dr. Silva',
                score: null,
                vulnerabilityLevel: null,
                vitals: {
                    pressure: fd.get('pressure') || '120/80',
                    weight: parseFloat(fd.get('weight')) || null,
                    height: parseFloat(fd.get('height')) || null,
                    temperature: parseFloat(fd.get('temperature')) || null,
                    imc: document.getElementById('imcValue').textContent || null,
                },
                clinical: {
                    complaint: fd.get('complaint') || '',
                    examination: fd.get('examination') || '',
                    diagnosis: fd.get('diagnosis') || '',
                    conduct: fd.get('conduct') || '',
                    notes: fd.get('notes') || '',
                },
            };

            evaluations.push(newEvaluation);
            filteredEvaluations = [...evaluations];
            renderEvaluationsTable();
            updateFilterResults();
            updateStatistics();

            alert('Nova avaliação criada com sucesso!');
            hideNewEvaluationModal();
            this.reset();
            document.getElementById('imcResult').classList.add('hidden');
        } catch (err) {
            console.error(err);
            alert('Erro ao criar avaliação. Tente novamente.');
        } finally {
            submitBtn.innerHTML = original;
            submitBtn.disabled = false;
        }
    });
}

function updateStatistics() {
    const total = evaluations.length;
    const ivcf20 = evaluations.filter(e => e.type === 'ivcf20').length;
    const ivsf10 = evaluations.filter(e => e.type === 'ivsf10').length;
    const pend = evaluations.filter(e => e.status === 'pendente').length;
    const conc = evaluations.filter(e => e.status === 'concluida').length;

    document.getElementById('totalAvaliacoes').textContent = total;
    document.getElementById('totalIVCF20').textContent = ivcf20;
    document.getElementById('totalIVSF10').textContent = ivsf10;
    document.getElementById('totalPendentes').textContent = pend;
    document.getElementById('totalConcluidas').textContent = conc;

    const ivcf20Percent = total ? Math.round((ivcf20 / total) * 100) : 0;
    const ivsf10Percent = total ? Math.round((ivsf10 / total) * 100) : 0;
    const concluidasPercent = total ? Math.round((conc / total) * 100) : 0;

    const ivcf20Desc = document.getElementById('totalIVCF20').parentNode.querySelector('.text-xs');
    if (ivcf20Desc) ivcf20Desc.textContent = `${ivcf20Percent}% do total`;

    const ivsf10Desc = document.getElementById('totalIVSF10').parentNode.querySelector('.text-xs');
    if (ivsf10Desc) ivsf10Desc.textContent = `${ivsf10Percent}% do total`;

    const concluidasDesc = document.getElementById('totalConcluidas').parentNode.querySelector('.text-xs');
    if (concluidasDesc) concluidasDesc.textContent = `${concluidasPercent}% taxa sucesso`;

    const pendDesc = document.getElementById('totalPendentes').parentNode.querySelector('.text-xs');
    if (pendDesc) pendDesc.textContent = pend > 0 ? `${pend} aguardando` : 'Nenhuma pendente';

    const totalDesc = document.getElementById('totalAvaliacoes').parentNode.querySelector('.text-xs');
    if (totalDesc) totalDesc.textContent = total > 0 ? `${total} registros` : 'Nenhuma avaliação';
}