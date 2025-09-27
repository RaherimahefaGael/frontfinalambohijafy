document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    // var ip = "http://localhost:4545";
    var ip = "http://199.231.191.243:4545";
    async function login() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(ip + '/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                window.location.href = 'home.html';
            } else {
                document.getElementById('errorMessage').textContent = data.error || 'Nom d\'utilisateur ou mot de passe incorrect';
            }
        } catch (error) {
            console.error('Erreur :', error);
            document.getElementById('errorMessage').textContent = 'Une erreur s\'est produite lors de la connexion.';
        }
    }

    login();
});
