// Listar usuários
function renderUsuarios() {
    const usuariosList = document.getElementById('usuariosList');
    usuariosList.innerHTML = '<div class="text-gray-500">Carregando...</div>';
    db.collection('usuarios').get().then(snapshot => {
        if (snapshot.empty) {
            usuariosList.innerHTML = '<div class="text-gray-500">Nenhum usuário encontrado.</div>';
            return;
        }
        let html = '<table class="min-w-full bg-white rounded shadow"><thead><tr><th class="px-4 py-2">Nome</th><th class="px-4 py-2">Município</th><th class="px-4 py-2">Área</th><th class="px-4 py-2">Ações</th></tr></thead><tbody>';
        snapshot.forEach(doc => {
            const u = doc.data();
            html += `<tr><td class='border px-4 py-2'>${u.fullName||''}</td><td class='border px-4 py-2'>${u.municipality||''}</td><td class='border px-4 py-2'>${u.profession||''}</td><td class='border px-4 py-2'><button onclick="showEditModal('${doc.id}','${u.fullName||''}','${u.municipality||''}','${u.profession||''}')" class='text-blue-600 hover:underline mr-2'>Editar</button><button onclick="deleteUsuario('${doc.id}')" class='text-red-600 hover:underline'>Remover</button></td></tr>`;
        });
        html += '</tbody></table>';
        usuariosList.innerHTML = html;
    });
}
renderUsuarios();

// Remover usuário
function deleteUsuario(id) {
    if (confirm('Tem certeza que deseja remover este usuário?')) {
        db.collection('usuarios').doc(id).delete().then(renderUsuarios);
    }
}

// Editar usuário
function showEditModal(id, fullName, municipality, profession) {
    document.getElementById('editUserId').value = id;
    document.getElementById('editFullName').value = fullName;
    document.getElementById('editMunicipality').value = municipality;
    document.getElementById('editProfession').value = profession;
    document.getElementById('editModal').classList.remove('hidden');
}
function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
}
document.getElementById('editUserForm').onsubmit = function(e) {
    e.preventDefault();
    const id = document.getElementById('editUserId').value;
    db.collection('usuarios').doc(id).update({
        fullName: document.getElementById('editFullName').value,
        municipality: document.getElementById('editMunicipality').value,
        profession: document.getElementById('editProfession').value
    }).then(() => {
        closeEditModal();
        renderUsuarios();
    });
};