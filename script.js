// ----- UTILITAIRES SESSION -----
var ip = "http://148.230.125.64:4545";
function saveUserSession(user) {
    localStorage.setItem('userId', user.id);
    localStorage.setItem('username', user.username);
}

function clearUserSession() {
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
}

function getUserSession() {
    const id = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    if (id && username) return { id, username };
    return null;
}

// ----- FETCH SIMPLE (sans token) -----
async function fetchWithAuth(url, options = {}) {
    // Pas d'Authorization header ici car back n'utilise pas JWT
    return fetch(url, options);
}

// ----- GESTION PAGE LOGIN -----
if (document.getElementById('loginForm')) {
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        console.log(username, password);

        try {
            const res = await fetch(ip + '/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();
            console.log(data);
            if (res.ok) {
                saveUserSession(data.user);
                window.location.href = 'home.html';
            } else {
                loginError.style.display = 'block';
                loginError.textContent = data.error || 'Nom d’utilisateur ou mot de passe incorrect.';
            }
        } catch (err) {
            loginError.style.display = 'block';
            loginError.textContent = 'Erreur de connexion au serveur.';
            console.error(err);
        }
    });
}

// ----- GESTION PAGE CLIENTS (index.html) -----
if (document.getElementById('clientTable')) {
    const userSession = getUserSession();
    if (!userSession) {
        window.location.href = 'login.html';
    }

    // Sélecteurs
    const openModalBtn = document.getElementById('openModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modal = document.getElementById('modal');
    const clientForm = document.getElementById('clientForm');
    const clientTableBody = document.querySelector('#clientTable tbody');
    const modalTitle = document.getElementById('modalTitle');
    const submitBtn = document.getElementById('submitBtn');
    const clientIdInput = document.getElementById('clientId');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const imageModal = document.getElementById('imageModal');
    const closeImageModalBtn = document.getElementById('closeImageModalBtn');
    const expandedImage = document.getElementById('expandedImage');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const changePasswordModal = document.getElementById('changePasswordModal');
    const closeChangePasswordModalBtn = document.getElementById('closeChangePasswordModalBtn');
    const changePasswordForm = document.getElementById('changePasswordForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const imprimerBtn = document.getElementById('imprimerBtn');
    let clients = [];

    // Ouvrir modal ajout client
    openModalBtn.addEventListener('click', () => {
        modalTitle.textContent = 'Ajouter un Client';
        submitBtn.textContent = 'Ajouter';
        clientForm.reset();
        clientIdInput.value = '';
        modal.style.display = 'flex';
    });

    // Fermer modal ajout client
    closeModalBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
        if (e.target === imageModal) imageModal.style.display = 'none';
        if (e.target === changePasswordModal) changePasswordModal.style.display = 'none';
    });

    // Soumission ajout/modif client
    clientForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('nom', document.getElementById('nom').value);
        formData.append('ref', document.getElementById('ref').value);
        formData.append('no_compteur', document.getElementById('no_compteur').value);
        formData.append('adresse', document.getElementById('adresse').value);

        const photoFile = document.getElementById('photo').files[0];
        if (photoFile) formData.append('photo', photoFile);

        const clientId = clientIdInput.value;
        const url = clientId ? `${ip}/clients/${clientId}` : ip + '/clients';
        const method = clientId ? 'PUT' : 'POST';

        try {
            const res = await fetchWithAuth(url, { method, body: formData });
            if (res.ok) {
                alert(clientId ? 'Client modifié avec succès !' : 'Client ajouté avec succès !');
                clientForm.reset();
                modal.style.display = 'none';
                fetchClients();
            } else {
                alert('Erreur lors de la soumission du formulaire.');
            }
        } catch (err) {
            console.error(err);
        }
    });

    // Récupérer clients
    async function fetchClients() {
        try {
            const res = await fetchWithAuth(ip + '/clients');
            clients = await res.json();
            renderClients(clients);
        } catch (err) {
            console.error(err);
        }
    }

    // Affichage clients
    function renderClients(clientsToRender) {
        clientTableBody.innerHTML = '';
        clientsToRender.forEach((client) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${client.nom}</td>
                <td>${client.ref}</td>
                <td>${client.no_compteur}</td>
                <td>${client.adresse}</td>
                <td>${client.photo ? `<img src="${ip}${client.photo}" alt="Photo" class="clickable-image">` : ''}</td>
                <td class="actions">
                    <button class="edit" onclick="editClient(${client.id})">Modifier</button>
                    <button class="delete" onclick="deleteClient(${client.id})">Supprimer</button>
                </td>
            `;
            clientTableBody.appendChild(row);
        });

        // Click image agrandie
        document.querySelectorAll('.clickable-image').forEach((img) => {
            img.addEventListener('click', () => {
                expandedImage.src = img.src;
                imageModal.style.display = 'flex';
            });
        });
    }

    // Filtrer clients
    function filterClients(term) {
        const filtered = clients.filter((c) =>
            (c.nom && c.nom.toLowerCase().includes(term)) ||
            (c.ref && c.ref.toLowerCase().includes(term)) ||
            (c.no_compteur && c.no_compteur.toLowerCase().includes(term)) ||
            (c.adresse && c.adresse.toLowerCase().includes(term))
        );
        renderClients(filtered);
    }

    searchInput.addEventListener('input', () => {
        filterClients(searchInput.value.trim().toLowerCase());
    });
    searchBtn.addEventListener('click', () => {
        filterClients(searchInput.value.trim().toLowerCase());
    });

    // Modifier client (rempli modal)
    window.editClient = function (id) {
        const client = clients.find((c) => c.id === id);
        if (!client) return;
        modalTitle.textContent = 'Modifier un Client';
        submitBtn.textContent = 'Modifier';
        clientIdInput.value = client.id;
        document.getElementById('nom').value = client.nom;
        document.getElementById('ref').value = client.ref;
        document.getElementById('no_compteur').value = client.no_compteur;
        document.getElementById('adresse').value = client.adresse;
        modal.style.display = 'flex';
    };

    // Supprimer client
    window.deleteClient = async function (id) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return;
        try {
            const res = await fetchWithAuth(`${ip}/clients/${id}`, { method: 'DELETE' });
            if (res.ok) {
                alert('Client supprimé avec succès !');
                fetchClients();
            } else {
                alert('Erreur lors de la suppression du client.');
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Changement mot de passe modal
    changePasswordBtn.addEventListener('click', () => {
        changePasswordModal.style.display = 'flex';
    });
    closeChangePasswordModalBtn.addEventListener('click', () => {
        changePasswordModal.style.display = 'none';
    });

    // Soumission changement mot de passe
    changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;

        if (newPassword !== confirmNewPassword) {
            alert('Les nouveaux mots de passe ne correspondent pas.');
            return;
        }

        try {
            const res = await fetch(ip + '/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: userSession.username,
                    currentPassword,
                    newPassword,
                }),
            });
            const data = await res.json();

            if (res.ok) {
                alert('Mot de passe modifié avec succès !');
                changePasswordForm.reset();
                changePasswordModal.style.display = 'none';
            } else {
                alert(data.error || 'Erreur lors de la modification du mot de passe.');
            }
        } catch (err) {
            console.error(err);
            alert('Erreur lors de la modification du mot de passe.');
        }
    });
    //aller vers imprimer
    imprimerBtn.addEventListener('click', () => {
        window.location.href = 'imprimer/imprimer.html';
    });
    // Déconnexion
    logoutBtn.addEventListener('click', () => {
        clearUserSession();
        window.location.href = 'index.html';
    });

    // Charger clients au démarrage
    fetchClients();
}
