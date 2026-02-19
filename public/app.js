// ===== MEDAIChain Admin Dashboard - App Logic =====

const API_BASE = window.location.origin;

// Check Auth
const token = localStorage.getItem('admin_token');
if (!token) {
    window.location.href = '/login.html';
}

// DOM Elements
const form = document.getElementById('create-user-form');
const submitBtn = document.getElementById('submit-btn');
const resultCard = document.getElementById('result-card');
const errorCard = document.getElementById('error-card');
const roleCards = document.querySelectorAll('.role-card input[name="role"]');
const navItems = document.querySelectorAll('.nav-item');

const usersTableBody = document.getElementById('users-table-body');
const usersLoading = document.getElementById('users-loading');
const usersEmpty = document.getElementById('users-empty');
const refreshUsersBtn = document.getElementById('refresh-users-btn');
const refreshStatsBtn = document.getElementById('refresh-stats-btn');
const logoutBtn = document.getElementById('logout-btn');

// ===== LOGOUT =====
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('admin_token');
        window.location.href = '/login.html';
    });
}

// ===== STATS REFRESH =====
if (refreshStatsBtn) {
    refreshStatsBtn.addEventListener('click', () => {
        const icon = refreshStatsBtn.querySelector('.material-icons-round');
        icon.style.animation = 'spin 1s linear infinite';
        fetchStats().then(() => {
            setTimeout(() => icon.style.animation = 'none', 500);
        });
    });
}

// ===== NAVIGATION =====
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.dataset.section;

        // Update active nav
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');

        // Show section
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        document.getElementById(`section-${section}`).classList.add('active');

        // Update header
        const titles = {
            'dashboard': ['Tableau de Bord', 'Aperçu global de l\'activité'],
            'create-user': ['Envoyer une invitation', 'Envoyez un lien d\'inscription par email aux professionnels'],
            'users-list': ['Utilisateurs', 'Liste de tous les utilisateurs du système'],
        };
        const [title, subtitle] = titles[section] || ['', ''];
        if (title) {
            document.getElementById('page-title').textContent = title;
            document.getElementById('page-subtitle').textContent = subtitle;
        }

        // Fetch data based on section
        if (section === 'users-list') fetchUsers();
        if (section === 'dashboard') fetchStats();
    });
});

// ===== FETCH STATS =====
async function fetchStats() {
    try {
        const response = await fetch(`${API_BASE}/users/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) return;
        const stats = await response.json();

        // Update UI
        document.getElementById('stat-total').textContent = stats.total;
        document.getElementById('stat-medecin').textContent = stats.medecin;
        document.getElementById('stat-patient').textContent = stats.patient;
        document.getElementById('stat-pharmacie').textContent = stats.pharmacie;
        document.getElementById('stat-centre_analyse').textContent = stats.centre_analyse;
        document.getElementById('stat-clinique').textContent = stats.clinique;
        // document.getElementById('stat-admin').textContent = stats.admin; // Admin hidden

        // Update Chart
        updateChart(stats);

    } catch (error) {
        console.error('Error fetching stats:', error);
    }
}

// ===== CHART =====
let usersChart = null;

function updateChart(stats) {
    const ctx = document.getElementById('usersChart').getContext('2d');

    // Create Gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, '#22D3EE'); // Cyan top
    gradient.addColorStop(1, '#7C3AED'); // Purple bottom

    const data = {
        labels: ['Médecins', 'Patients', 'Pharmacies', 'Laboratoires', 'Cliniques'],
        datasets: [{
            label: 'Utilisateurs',
            data: [stats.medecin, stats.patient, stats.pharmacie, stats.centre_analyse, stats.clinique],
            backgroundColor: gradient,
            borderRadius: 50, // Fully rounded tops
            borderSkipped: false,
            barPercentage: 0.5,
            categoryPercentage: 0.8
        }]
    };

    if (usersChart) {
        usersChart.data = data;
        usersChart.update();
    } else {
        usersChart = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#FFFFFF',
                        titleColor: '#1E293B',
                        bodyColor: '#64748B',
                        borderColor: '#E2E8F0',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            label: function (context) {
                                return context.parsed.y + ' Utilisateurs';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            drawBorder: false,
                        },
                        ticks: {
                            color: '#A5B4FC',
                            font: { family: "'Plus Jakarta Sans', sans-serif" }
                        },
                        border: { display: false }
                    },
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false,
                        },
                        ticks: {
                            color: '#A5B4FC',
                            font: { family: "'Plus Jakarta Sans', sans-serif" }
                        },
                        border: { display: false }
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeOutQuart'
                }
            }
        });
    }
}

// Initial Load
fetchStats(); // Load stats by default as dashboard is active

// ===== FETCH USERS =====
async function fetchUsers() {
    usersTableBody.innerHTML = '';
    usersLoading.style.display = 'block';
    usersEmpty.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE}/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Impossible de charger les utilisateurs');

        const users = await response.json();

        usersLoading.style.display = 'none';

        if (users.length === 0) {
            usersEmpty.style.display = 'block';
            return;
        }

        renderUsers(users);
    } catch (err) {
        usersLoading.innerHTML = `<p style="color: var(--error-color)">Erreur: ${err.message}</p>`;
    }
}

function renderUsers(users) {
    users.forEach(user => {
        const tr = document.createElement('tr');

        const role = roleLabel(user.role);
        const isActive = user.isProfileCompleted;
        const statusClass = isActive ? 'status-active' : 'status-pending';
        const statusText = isActive ? 'Actif' : 'En attente';
        const date = new Date(user.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
        const initial = user.email.charAt(0).toUpperCase();

        tr.innerHTML = `
            <td>
                <div class="user-info">
                    <div class="user-avatar">${initial}</div>
                    <div class="user-details">
                        <span class="user-email">${user.email}</span>
                    </div>
                </div>
            </td>
            <td><span class="badge badge-role-${user.role}">${role}</span></td>
            <td>${user.phone || '-'}</td>
            <td>
                <div class="status-indicator ${statusClass}">
                    <div class="status-dot"></div>
                    <span>${statusText}</span>
                </div>
            </td>
            <td>${date}</td>
        `;
        usersTableBody.appendChild(tr);
    });
}

// Refresh Button
if (refreshUsersBtn) {
    refreshUsersBtn.addEventListener('click', fetchUsers);
}

// ===== FORM SUBMISSION =====
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Hide previous results
    resultCard.style.display = 'none';
    errorCard.style.display = 'none';

    // Get selected role
    const selectedRole = document.querySelector('input[name="role"]:checked');
    if (!selectedRole) {
        showError('Veuillez sélectionner un rôle');
        return;
    }

    // Build request body
    const formData = new FormData(form);
    const body = {
        email: formData.get('email'),
        role: selectedRole.value
    };

    // Show loading state
    submitBtn.disabled = true;
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<div class="spinner"></div> Envoi en cours...';

    try {
        const response = await fetch(`${API_BASE}/auth/admin/invite`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Erreur lors de l\'envoi de l\'invitation');
        }

        // Show success
        showResult(body.email, roleLabel(body.role));
    } catch (err) {
        showError(err.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
});

// ===== HELPERS =====
function roleLabel(role) {
    const labels = {
        medecin: 'Médecin',
        centre_analyse: "Centre d'Analyse",
        pharmacie: 'Pharmacie',
        clinique: 'Clinique',
    };
    return labels[role] || role;
}

function showResult(email, role) {
    document.getElementById('result-email').textContent = email;
    document.getElementById('result-role').textContent = role;
    // Hide password field as it's not relevant for invitation
    const passField = document.getElementById('result-password');
    if (passField && passField.parentElement) {
        passField.parentElement.style.display = 'none';
    }

    resultCard.style.display = 'block';
    errorCard.style.display = 'none';
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showError(message) {
    document.getElementById('error-message').textContent = message;
    errorCard.style.display = 'block';
    resultCard.style.display = 'none';
    errorCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function resetForm() {
    form.reset();
    resultCard.style.display = 'none';
    errorCard.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

