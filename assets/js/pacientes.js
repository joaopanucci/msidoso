// Verificar autenticação
firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = 'login.html';
    }
});

// Formatação de CPF
function formatCPF(input) {
    let value = input.value.replace(/\D/g, '');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    input.value = value;
}

// Formatação de CEP
function formatCEP(input) {
    let value = input.value.replace(/\D/g, '');
    value = value.replace(/(\d{5})(\d)/, '$1-$2');
    input.value = value;
}

// Adicionar formatação de CEP aos campos
document.addEventListener('DOMContentLoaded', function() {
    const cepFields = document.querySelectorAll('#addPacienteCep, #editPacienteCep');
    cepFields.forEach(field => {
        field.addEventListener('input', function() {
            formatCEP(this);
        });
    });
});

// Listar pacientes com novos campos
function renderPacientes() {
    const pacientesList = document.getElementById('pacientesList');
    pacientesList.innerHTML = '<div class="text-gray-500">Carregando...</div>';
    
    db.collection('pacientes').orderBy('name').get().then(snapshot => {
        if (snapshot.empty) {
            pacientesList.innerHTML = '<div class="text-gray-500 text-center py-8">Nenhum paciente encontrado.</div>';
            return;
        }

        let html = `
            <div class="bg-white rounded-lg shadow overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Idade</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contato</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Localização</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Info. Médicas</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
        `;

        snapshot.forEach(doc => {
            const p = doc.data();
            const birthDate = p.birthDate ? (p.birthDate.toDate ? p.birthDate.toDate() : new Date(p.birthDate)) : null;
            const age = birthDate ? calculateAge(birthDate) : 'N/A';
            const formattedBirth = birthDate ? birthDate.toLocaleDateString('pt-BR') : 'N/A';

            html += `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 h-10 w-10">
                                <div class="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                    <span class="text-white font-medium">${(p.name || '').charAt(0).toUpperCase()}</span>
                                </div>
                            </div>
                            <div class="ml-4">
                                <div class="text-sm font-medium text-gray-900">${p.name || 'N/A'}</div>
                                <div class="text-sm text-gray-500">CPF: ${p.cpf || 'N/A'}</div>
                                <div class="text-sm text-gray-500">${p.sex || ''} ${p.sex && birthDate ? '•' : ''} ${formattedBirth}</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">${age} anos</div>
                        ${p.bloodType ? `<div class="text-sm text-gray-500">Tipo: ${p.bloodType}</div>` : ''}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">${p.phone || 'N/A'}</div>
                        ${p.phone2 ? `<div class="text-sm text-gray-500">${p.phone2}</div>` : ''}
                        ${p.email ? `<div class="text-sm text-gray-500">${p.email}</div>` : ''}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">${p.municipality || 'N/A'}</div>
                        ${p.neighborhood ? `<div class="text-sm text-gray-500">${p.neighborhood}</div>` : ''}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        ${p.sus ? `<div class="text-sm text-gray-900">SUS: ${p.sus}</div>` : ''}
                        ${p.healthPlan ? `<div class="text-sm text-gray-500">Plano: ${p.healthPlan}</div>` : ''}
                        ${p.dependency ? `<div class="text-sm text-gray-500">${p.dependency}</div>` : ''}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button onclick="viewPaciente('${doc.id}')" class="text-blue-600 hover:text-blue-900">Ver</button>
                        <button onclick="showEditModal('${doc.id}')" class="text-yellow-600 hover:text-yellow-900">Editar</button>
                        <button onclick="deletePaciente('${doc.id}')" class="text-red-600 hover:text-red-900">Remover</button>
                    </td>
                </tr>
            `;
        });

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        pacientesList.innerHTML = html;
    }).catch(error => {
        console.error('Erro ao carregar pacientes:', error);
        pacientesList.innerHTML = '<div class="text-red-500">Erro ao carregar pacientes.</div>';
    });
}

function calculateAge(birthDate) {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
}

// Visualizar paciente
function viewPaciente(id) {
    db.collection('pacientes').doc(id).get().then(doc => {
        if (!doc.exists) return;
        
        const p = doc.data();
        const birthDate = p.birthDate ? (p.birthDate.toDate ? p.birthDate.toDate() : new Date(p.birthDate)) : null;
        const age = birthDate ? calculateAge(birthDate) : 'N/A';
        
        const modalContent = `
            <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onclick="this.remove()">
                <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl max-h-screen overflow-y-auto" onclick="event.stopPropagation()">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-xl font-bold">Detalhes do Paciente</h2>
                        <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-4">
                            <h3 class="text-lg font-semibold text-blue-800 border-b pb-2">Dados Pessoais</h3>
                            <div><strong>Nome:</strong> ${p.name || 'N/A'}</div>
                            <div><strong>CPF:</strong> ${p.cpf || 'N/A'}</div>
                            <div><strong>RG:</strong> ${p.rg || 'N/A'}</div>
                            <div><strong>Data de Nascimento:</strong> ${birthDate ? birthDate.toLocaleDateString('pt-BR') : 'N/A'}</div>
                            <div><strong>Idade:</strong> ${age} anos</div>
                            <div><strong>Sexo:</strong> ${p.sex || 'N/A'}</div>
                            <div><strong>Estado Civil:</strong> ${p.maritalStatus || 'N/A'}</div>
                        </div>
                        
                        <div class="space-y-4">
                            <h3 class="text-lg font-semibold text-blue-800 border-b pb-2">Contato</h3>
                            <div><strong>Telefone:</strong> ${p.phone || 'N/A'}</div>
                            <div><strong>Telefone 2:</strong> ${p.phone2 || 'N/A'}</div>
                            <div><strong>E-mail:</strong> ${p.email || 'N/A'}</div>
                            <div><strong>Emergência:</strong> ${p.emergencyContact || 'N/A'}</div>
                        </div>
                        
                        <div class="space-y-4">
                            <h3 class="text-lg font-semibold text-blue-800 border-b pb-2">Endereço</h3>
                            <div><strong>CEP:</strong> ${p.cep || 'N/A'}</div>
                            <div><strong>Endereço:</strong> ${p.address || 'N/A'} ${p.number ? ', ' + p.number : ''}</div>
                            <div><strong>Complemento:</strong> ${p.complement || 'N/A'}</div>
                            <div><strong>Bairro:</strong> ${p.neighborhood || 'N/A'}</div>
                            <div><strong>Município:</strong> ${p.municipality || 'N/A'}</div>
                            <div><strong>UF:</strong> ${p.state || 'MS'}</div>
                        </div>
                        
                        <div class="space-y-4">
                            <h3 class="text-lg font-semibold text-blue-800 border-b pb-2">Informações Médicas</h3>
                            <div><strong>Cartão SUS:</strong> ${p.sus || 'N/A'}</div>
                            <div><strong>Plano de Saúde:</strong> ${p.healthPlan || 'N/A'}</div>
                            <div><strong>Tipo Sanguíneo:</strong> ${p.bloodType || 'N/A'}</div>
                            <div><strong>Peso:</strong> ${p.weight ? p.weight + ' kg' : 'N/A'}</div>
                            <div><strong>Altura:</strong> ${p.height ? p.height + ' cm' : 'N/A'}</div>
                            <div><strong>Dependência:</strong> ${p.dependency || 'N/A'}</div>
                        </div>
                    </div>
                    
                    <div class="mt-6 space-y-4">
                        <h3 class="text-lg font-semibold text-blue-800 border-b pb-2">Histórico Médico</h3>
                        ${p.chronicDiseases ? `<div><strong>Doenças Crônicas:</strong><br>${p.chronicDiseases}</div>` : ''}
                        ${p.medications ? `<div><strong>Medicamentos:</strong><br>${p.medications}</div>` : ''}
                        ${p.allergies ? `<div><strong>Alergias:</strong><br>${p.allergies}</div>` : ''}
                        ${p.surgeries ? `<div><strong>Cirurgias:</strong><br>${p.surgeries}</div>` : ''}
                        ${p.notes ? `<div><strong>Observações:</strong><br>${p.notes}</div>` : ''}
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalContent);
    });
}

renderPacientes();

// Adicionar paciente com novos campos
function showAddPacienteModal() {
    document.getElementById('addPacienteModal').classList.remove('hidden');
}

function closeAddPacienteModal() {
    document.getElementById('addPacienteModal').classList.add('hidden');
    document.getElementById('addPacienteForm').reset();
}

document.getElementById('addPacienteForm').onsubmit = function(e) {
    e.preventDefault();
    
    const user = firebase.auth().currentUser;
    if (!user) {
        alert('Usuário não autenticado');
        return;
    }

    const pacienteData = {
        // Dados pessoais
        name: document.getElementById('addPacienteName').value,
        cpf: document.getElementById('addPacienteCpf').value,
        rg: document.getElementById('addPacienteRg').value,
        sex: document.getElementById('addPacienteSex').value,
        maritalStatus: document.getElementById('addPacienteMaritalStatus').value,
        
        // Contato
        phone: document.getElementById('addPacientePhone').value,
        phone2: document.getElementById('addPacientePhone2').value,
        email: document.getElementById('addPacienteEmail').value,
        emergencyContact: document.getElementById('addPacienteEmergencyContact').value,
        
        // Endereço
        cep: document.getElementById('addPacienteCep').value,
        address: document.getElementById('addPacienteAddress').value,
        number: document.getElementById('addPacienteNumber').value,
        complement: document.getElementById('addPacienteComplement').value,
        neighborhood: document.getElementById('addPacienteNeighborhood').value,
        municipality: document.getElementById('addPacienteMunicipality').value,
        state: document.getElementById('addPacienteState').value || 'MS',
        
        // Informações médicas
        sus: document.getElementById('addPacienteSus').value,
        healthPlan: document.getElementById('addPacienteHealthPlan').value,
        bloodType: document.getElementById('addPacienteBloodType').value,
        weight: parseFloat(document.getElementById('addPacienteWeight').value) || null,
        height: parseInt(document.getElementById('addPacienteHeight').value) || null,
        dependency: document.getElementById('addPacienteDependency').value,
        
        // Histórico médico
        chronicDiseases: document.getElementById('addPacienteChronicDiseases').value,
        medications: document.getElementById('addPacienteMedications').value,
        allergies: document.getElementById('addPacienteAllergies').value,
        surgeries: document.getElementById('addPacienteSurgeries').value,
        notes: document.getElementById('addPacienteNotes').value,
        
        // Metadados
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdBy: user.uid
    };

    // Data de nascimento
    const birthValue = document.getElementById('addPacienteBirth').value;
    if (birthValue) {
        pacienteData.birthDate = firebase.firestore.Timestamp.fromDate(new Date(birthValue));
    }
    
    db.collection('pacientes').add(pacienteData).then(() => {
        closeAddPacienteModal();
        renderPacientes();
        alert('Paciente adicionado com sucesso!');
    }).catch(error => {
        console.error('Erro ao adicionar paciente:', error);
        alert('Erro ao adicionar paciente: ' + error.message);
    });
};

// Remover paciente
function deletePaciente(id) {
    if (confirm('Tem certeza que deseja remover este paciente? Esta ação não pode ser desfeita.')) {
        db.collection('pacientes').doc(id).delete().then(() => {
            renderPacientes();
            alert('Paciente removido com sucesso!');
        }).catch(error => {
            console.error('Erro ao remover paciente:', error);
            alert('Erro ao remover paciente: ' + error.message);
        });
    }
}

// Editar paciente com novos campos
function showEditModal(id) {
    db.collection('pacientes').doc(id).get().then(doc => {
        if (!doc.exists) return;
        
        const p = doc.data();
        
        document.getElementById('editPacienteId').value = id;
        
        // Dados pessoais
        document.getElementById('editPacienteName').value = p.name || '';
        document.getElementById('editPacienteCpf').value = p.cpf || '';
        document.getElementById('editPacienteRg').value = p.rg || '';
        document.getElementById('editPacienteSex').value = p.sex || '';
        document.getElementById('editPacienteMaritalStatus').value = p.maritalStatus || '';
        
        // Data de nascimento
        if (p.birthDate) {
            const birthDate = p.birthDate.toDate ? p.birthDate.toDate() : new Date(p.birthDate);
            document.getElementById('editPacienteBirth').value = birthDate.toISOString().split('T')[0];
        }
        
        // Contato
        document.getElementById('editPacientePhone').value = p.phone || '';
        document.getElementById('editPacientePhone2').value = p.phone2 || '';
        document.getElementById('editPacienteEmail').value = p.email || '';
        document.getElementById('editPacienteEmergencyContact').value = p.emergencyContact || '';
        
        // Endereço
        document.getElementById('editPacienteCep').value = p.cep || '';
        document.getElementById('editPacienteAddress').value = p.address || '';
        document.getElementById('editPacienteNumber').value = p.number || '';
        document.getElementById('editPacienteComplement').value = p.complement || '';
        document.getElementById('editPacienteNeighborhood').value = p.neighborhood || '';
        document.getElementById('editPacienteMunicipality').value = p.municipality || '';
        document.getElementById('editPacienteState').value = p.state || 'MS';
        
        // Informações médicas
        document.getElementById('editPacienteSus').value = p.sus || '';
        document.getElementById('editPacienteHealthPlan').value = p.healthPlan || '';
        document.getElementById('editPacienteBloodType').value = p.bloodType || '';
        document.getElementById('editPacienteWeight').value = p.weight || '';
        document.getElementById('editPacienteHeight').value = p.height || '';
        document.getElementById('editPacienteDependency').value = p.dependency || '';
        
        // Histórico médico
        document.getElementById('editPacienteChronicDiseases').value = p.chronicDiseases || '';
        document.getElementById('editPacienteMedications').value = p.medications || '';
        document.getElementById('editPacienteAllergies').value = p.allergies || '';
        document.getElementById('editPacienteSurgeries').value = p.surgeries || '';
        document.getElementById('editPacienteNotes').value = p.notes || '';
        
        document.getElementById('editModal').classList.remove('hidden');
    });
}

function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
}

document.getElementById('editPacienteForm').onsubmit = function(e) {
    e.preventDefault();
    
    const id = document.getElementById('editPacienteId').value;
    const user = firebase.auth().currentUser;
    
    const updateData = {
        // Dados pessoais
        name: document.getElementById('editPacienteName').value,
        cpf: document.getElementById('editPacienteCpf').value,
        rg: document.getElementById('editPacienteRg').value,
        sex: document.getElementById('editPacienteSex').value,
        maritalStatus: document.getElementById('editPacienteMaritalStatus').value,
        
        // Contato
        phone: document.getElementById('editPacientePhone').value,
        phone2: document.getElementById('editPacientePhone2').value,
        email: document.getElementById('editPacienteEmail').value,
        emergencyContact: document.getElementById('editPacienteEmergencyContact').value,
        
        // Endereço
        cep: document.getElementById('editPacienteCep').value,
        address: document.getElementById('editPacienteAddress').value,
        number: document.getElementById('editPacienteNumber').value,
        complement: document.getElementById('editPacienteComplement').value,
        neighborhood: document.getElementById('editPacienteNeighborhood').value,
        municipality: document.getElementById('editPacienteMunicipality').value,
        state: document.getElementById('editPacienteState').value,
        
        // Informações médicas
        sus: document.getElementById('editPacienteSus').value,
        healthPlan: document.getElementById('editPacienteHealthPlan').value,
        bloodType: document.getElementById('editPacienteBloodType').value,
        weight: parseFloat(document.getElementById('editPacienteWeight').value) || null,
        height: parseInt(document.getElementById('editPacienteHeight').value) || null,
        dependency: document.getElementById('editPacienteDependency').value,
        
        // Histórico médico
        chronicDiseases: document.getElementById('editPacienteChronicDiseases').value,
        medications: document.getElementById('editPacienteMedications').value,
        allergies: document.getElementById('editPacienteAllergies').value,
        surgeries: document.getElementById('editPacienteSurgeries').value,
        notes: document.getElementById('editPacienteNotes').value,
        
        // Metadados
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedBy: user ? user.uid : null
    };

    // Data de nascimento
    const birthValue = document.getElementById('editPacienteBirth').value;
    if (birthValue) {
        updateData.birthDate = firebase.firestore.Timestamp.fromDate(new Date(birthValue));
    }
    
    db.collection('pacientes').doc(id).update(updateData).then(() => {
        closeEditModal();
        renderPacientes();
        alert('Paciente atualizado com sucesso!');
    }).catch(error => {
        console.error('Erro ao atualizar paciente:', error);
        alert('Erro ao atualizar paciente: ' + error.message);
    });
};