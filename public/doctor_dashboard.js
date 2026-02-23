/* ===== MEDAIChain Doctor Dashboard - Business Logic ===== */

const API_BASE = window.location.origin;
const token = localStorage.getItem('admin_token') || localStorage.getItem('token');

// Auth Check
if (!token) {
    window.location.href = '/login.html';
}

// DOM Elements
const navItems = document.querySelectorAll('.nav-item');
const contentSections = document.querySelectorAll('.content-section');
const logoutBtn = document.getElementById('logout-btn');

// Profile Elements
const drName = document.getElementById('dr-name');
const drInitials = document.getElementById('dr-initials');

// Stats Elements
const statPatientsToday = document.getElementById('stat-patients-today');
const statPending = document.getElementById('stat-pending');
const statAlerts = document.getElementById('stat-alerts');
const statAiSuggestions = document.getElementById('stat-ai-suggestions');

// List Containers
const alertsList = document.getElementById('alerts-list');
const consultationsToday = document.getElementById('consultations-today');
const patientsGrid = document.getElementById('patients-grid');

// Initialize Dashboard
async function initDashboard() {
    await fetchProfile();
    await fetchStats();
    await fetchAlerts();
    await fetchConsultations();
    setupNavigation();
}

let doctorProfile = null;

// Fetch Doctor Profile
async function fetchProfile() {
    try {
        const response = await fetch(`${API_BASE}/profiles/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) return;
        doctorProfile = await response.json();

        const name = doctorProfile.firstName && doctorProfile.lastName ?
            `Dr. ${doctorProfile.firstName} ${doctorProfile.lastName}` :
            doctorProfile.fullName || 'Dr. Médecin';
        drName.textContent = name;

        const initials = doctorProfile.firstName && doctorProfile.lastName ?
            `${doctorProfile.firstName[0]}${doctorProfile.lastName[0]}` :
            (doctorProfile.fullName ? doctorProfile.fullName.split(' ').map(n => n[0]).join('') : 'DR');
        drInitials.textContent = initials.toUpperCase().substring(0, 2);

        // Update stats if we have them
        if (doctorProfile.stats) {
            statPatientsToday.textContent = doctorProfile.stats.patientsCount || 0;
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
        drName.textContent = 'Dr. Docteur';
    }
}

// Fetch Stats (Mocked if no endpoint available, or using existing stats)
async function fetchStats() {
    // For now, using the values in HTML as "real" or fetching if endpoint exists
    // Example: fetch(`${API_BASE}/appointments/stats`)
    console.log('Fetching stats...');
}

// Fetch Alerts (Notifications)
async function fetchAlerts() {
    try {
        const response = await fetch(`${API_BASE}/notifications`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error();
        const notifications = await response.json();
        renderAlerts(notifications);

        // Update unread count badge
        const unreadCount = notifications.filter(n => !n.isRead).length;
        statAlerts.textContent = unreadCount;

        const alertSummary = document.getElementById('alert-summary');
        if (alertSummary) alertSummary.textContent = `${unreadCount} alertes actives`;

        const badge = document.querySelector('.notification-badge');
        if (badge) badge.textContent = unreadCount;
    } catch (error) {
        console.error('Error fetching notifications:', error);
    }
}

function renderAlerts(notifications) {
    if (!alertsList) return;
    alertsList.innerHTML = '';

    if (notifications.length === 0) {
        alertsList.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 10px;">Aucune notification</p>';
        return;
    }

    notifications.slice(0, 5).forEach(n => {
        const item = document.createElement('div');
        item.className = 'notif-item';
        if (n.isRead) item.style.opacity = '0.7';

        const dateStr = new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        item.innerHTML = `
            <div class="notif-icon-box" style="background: ${n.isRead ? 'rgba(107, 114, 128, 0.1)' : 'rgba(245, 158, 11, 0.1)'}; color: ${n.isRead ? 'var(--text-light)' : 'var(--warning)'}">
                <span class="material-icons-round">${n.icon || 'notifications'}</span>
            </div>
            <div class="notif-content">
                <h4>${n.title}</h4>
                <div class="notif-meta">
                    <span class="type-tag ${n.type === 'URGENT' ? 'urgent' : 'suivi'}">${n.type || 'INFO'}</span>
                    <span style="font-size: 11px; color: var(--text-secondary)">${dateStr}</span>
                </div>
            </div>
            ${!n.isRead ? `<div class="time-badge" onclick="markAsRead('${n._id}')">Lu</div>` : ''}
        `;
        alertsList.appendChild(item);
    });
}

async function markAsRead(id) {
    try {
        await fetch(`${API_BASE}/notifications/${id}/read`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchAlerts();
    } catch (error) {
        console.error('Error marking as read:', error);
    }
}

// Fetch Today's Consultations
async function fetchConsultations() {
    try {
        const response = await fetch(`${API_BASE}/appointments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) return;
        const appointments = await response.json();

        // Filter today's appointments
        const today = new Date().toISOString().split('T')[0];
        const todayApps = appointments.filter(a => a.dateTime.startsWith(today));
        renderConsultations(todayApps);

        statPatientsToday.textContent = todayApps.length;
    } catch (error) {
        console.error('Error fetching appointments:', error);
    }
}

function renderConsultations(apps) {
    if (!consultationsToday) return;
    consultationsToday.innerHTML = '';

    if (apps.length === 0) {
        consultationsToday.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 20px;">Aucun rendez-vous aujourd\'hui</p>';
        return;
    }

    apps.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime)).forEach(a => {
        const date = new Date(a.dateTime);
        const item = document.createElement('div');
        item.className = 'consultation-item';

        item.innerHTML = `
            <div class="time-box">
                <span class="hour">${date.getHours().toString().padStart(2, '0')}</span>
                <span class="min">${date.getMinutes().toString().padStart(2, '0')}</span>
            </div>
            <div class="patient-info">
                <h4>${a.title}</h4>
                <p>${a.description || 'Consultation standard'}</p>
            </div>
            <div class="status-tag">${a.status || 'CONFIRMÉ'}</div>
        `;
        consultationsToday.appendChild(item);
    });
}

// Navigation Logic
function setupNavigation() {
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = item.dataset.section;

            // Update Active Nav
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Show Section
            contentSections.forEach(section => section.classList.remove('active'));
            const targetSection = document.getElementById(`section-${sectionId}`);
            if (targetSection) targetSection.classList.add('active');

            // Route to specific renderers
            switch (sectionId) {
                case 'accueil': populateStats(); populateTodayConsultations(); break;
                case 'patients': fetchPatients(); break;
                case 'agenda': renderAgenda(); break;
                case 'ai': renderAI(); break;
                case 'profile': renderProfile(); break;
            }
        });
    });
}

// Support for AI Tabs
function setupAITabs() {
    const aiTabs = document.querySelectorAll('.tab-item');
    aiTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            aiTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderAI(tab.dataset.tab);
        });
    });
}

// Fetch Patients
async function fetchPatients() {
    patientsGrid.innerHTML = '<div class="loading">Chargement des patients...</div>';
    try {
        // Example endpoint, verify in backend if exists
        const response = await fetch(`${API_BASE}/profiles/patients/my`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        // If fail, show mock
        if (!response.ok) throw new Error();

        const patients = await response.json();
        renderPatients(patients);
    } catch (error) {
        // Mock data for display
        const mockPatients = [
            { name: 'Jean Dupont', condition: 'Diabète Type 2', color: '#F59E0B' },
            { name: 'Marie Martin', condition: 'Hypertension', color: '#EF4444' },
            { name: 'Pierre Dubois', condition: 'Soins généraux', color: '#10B981' }
        ];
        renderPatients(mockPatients);
    }
}

function renderPatients(patients) {
    patientsGrid.innerHTML = '';
    patients.forEach(p => {
        const card = document.createElement('div');
        card.className = 'consultation-item';
        card.innerHTML = `
            <div class="time-box" style="background: rgba(124, 58, 237, 0.1)">
                <span class="material-icons-round">person</span>
            </div>
            <div class="patient-info">
                <h4>${p.name}</h4>
                <p>${p.condition} • Dernier RDV: Hier</p>
            </div>
            <span class="material-icons-round" style="color: var(--text-light)">chevron_right</span>
        `;
        patientsGrid.appendChild(card);
    });
}

// Agenda Rendering
function renderAgenda() {
    const list = document.getElementById('agenda-events-list');
    const calendarGrid = document.querySelector('.calendar-grid');
    const monthTitle = document.querySelector('.calendar-header h3');

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    monthTitle.textContent = `${now.toLocaleString('fr-FR', { month: 'long' })} ${currentYear}`;

    // Draw Calendar
    const firstDay = new Date(currentYear, now.getMonth(), 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    // Adjust first day (Monday = 0 in our grid if we want, or just match L-M-M-J-V-S-D)
    let startOffset = firstDay === 0 ? 6 : firstDay - 1;

    // Reset grid but keep labels
    const labels = Array.from(calendarGrid.querySelectorAll('.calendar-day-label'));
    calendarGrid.innerHTML = '';
    labels.forEach(l => calendarGrid.appendChild(l));

    // Add empty spaces
    for (let i = 0; i < startOffset; i++) {
        const spacer = document.createElement('div');
        calendarGrid.appendChild(spacer);
    }

    // Add days
    for (let d = 1; d <= daysInMonth; d++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        const dateStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;

        if (d === now.getDate()) dayEl.classList.add('today', 'active');

        dayEl.textContent = d;
        dayEl.addEventListener('click', () => {
            document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('active'));
            dayEl.classList.add('active');
            fetchAgendaEvents(dateStr);
        });
        calendarGrid.appendChild(dayEl);
    }

    // Fetch real events for the current day
    fetchAgendaEvents(new Date().toISOString().split('T')[0]);
}

// Add New Event Modal Logic
const addEventBtn = document.getElementById('btn-add-event');
if (addEventBtn) {
    addEventBtn.addEventListener('click', () => {
        // Simplified modal for now - in real app would open a form
        const title = prompt("Titre du rendez-vous :");
        if (!title) return;

        createAppointment(title);
    });
}

async function createAppointment(title) {
    try {
        const response = await fetch(`${API_BASE}/appointments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: title,
                dateTime: new Date().toISOString(), // Default to now for simplicity
                type: 'Consultation',
                status: 'CONFIRMÉ'
            })
        });

        if (response.ok) {
            renderAgenda(); // Refresh
            fetchConsultations(); // Refresh home
        }
    } catch (e) {
        console.error('Error creating appointment:', e);
    }
}

// Add New Notification Logic
const addNotifBtn = document.getElementById('btn-add-notif');
if (addNotifBtn) {
    addNotifBtn.addEventListener('click', () => {
        const title = prompt("Titre du rappel :");
        if (!title) return;

        createNotification(title);
    });
}

async function createNotification(title) {
    try {
        const response = await fetch(`${API_BASE}/notifications`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: title,
                type: 'SUIVI',
                icon: 'notifications_active'
            })
        });

        if (response.ok) {
            fetchAlerts(); // Refresh
        }
    } catch (e) {
        console.error('Error creating notification:', e);
    }
}

async function fetchAgendaEvents(dateStr) {
    const list = document.getElementById('agenda-events-list');
    list.innerHTML = '<div class="loading">Chargement...</div>';

    try {
        const response = await fetch(`${API_BASE}/appointments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const all = await response.json();
        const daily = all.filter(a => a.dateTime.startsWith(dateStr));

        list.innerHTML = daily.map(e => {
            const date = new Date(e.dateTime);
            return `
                <div class="consultation-item">
                    <div class="time-box">
                        <span class="hour">${date.getHours().toString().padStart(2, '0')}</span>
                        <span class="min">${date.getMinutes().toString().padStart(2, '0')}</span>
                    </div>
                    <div class="patient-info">
                        <h4>${e.title}</h4>
                        <p>${e.description || 'Rendez-vous'}</p>
                    </div>
                    <div class="status-tag" style="background: var(--primary-gradient)">${e.type || 'RDV'}</div>
                </div>
            `;
        }).join('');

        if (daily.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 20px;">Aucun événement pour ce jour</p>';
        }
    } catch (e) {
        list.innerHTML = '<p style="color: var(--error)">Erreur de chargement</p>';
    }
}

// AI Rendering
function renderAI(tab = 'exams') {
    const list = document.getElementById('ai-suggestions-list');
    let items = [];

    if (tab === 'exams') {
        items = [
            { title: 'Test HbA1c Suggéré', desc: 'Jean Dupont - Diabétique, dernier test il y a 3 mois', priority: 'Haute', color: 'var(--error)' },
            { title: 'Bilan Lipidique', desc: 'Marie Martin - Recommandé pour patients hypertendus', priority: 'Moyenne', color: 'var(--warning)' }
        ];
    } else if (tab === 'alerts') {
        items = [
            { title: 'Interaction Médicamenteuse', desc: 'Pierre Dubois - Interaction possible Lisinopril/Potassium', priority: 'Haute', color: 'var(--error)' }
        ];
    } else {
        items = [
            { title: 'Optimisation Traitement', desc: 'Envisager ajout agoniste GLP-1 pour Jean Dupont', priority: 'Conseil', color: 'var(--success)' }
        ];
    }

    list.innerHTML = items.map(s => `
        <div class="consultation-item" style="border-left: 4px solid ${s.color}">
            <div class="time-box" style="background: rgba(124, 58, 237, 0.1)">
                <span class="material-icons-round">psychology</span>
            </div>
            <div class="patient-info">
                <h4>${s.title}</h4>
                <p>${s.desc}</p>
            </div>
            <div class="status-tag" style="background: ${s.color}">${s.priority}</div>
        </div>
    `).join('');
}

// Profile Rendering
function renderProfile() {
    if (!doctorProfile) return;
    document.getElementById('profile-initials').textContent = doctorProfile.initials || 'DR';
    document.getElementById('profile-name').textContent = doctorProfile.displayName || 'Médecin';
    document.getElementById('profile-speciality').textContent = doctorProfile.speciality || 'Spécialité';
    document.getElementById('profile-exp').textContent = `${doctorProfile.yearsOfExperience || '-'} ans`;
    document.getElementById('profile-city').textContent = doctorProfile.city || '-';
    document.getElementById('profile-email').textContent = doctorProfile.email || '-';
    document.getElementById('profile-phone').textContent = doctorProfile.phone || '-';
}

// Logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    });
}

// Startup
initDashboard();
setupAITabs();
populateStats();
populateTodayConsultations();
