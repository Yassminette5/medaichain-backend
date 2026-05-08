// DOM Elements
const form = document.getElementById('signup-form');
const roleBadge = document.getElementById('role-badge');
const roleSpecificFields = document.getElementById('role-specific-fields');
const errorCard = document.getElementById('error-message');
const errorText = document.getElementById('error-text');

// Role Labels & Configuration
const roleConfig = {
    medecin: {
        label: 'Médecin',
        class: 'badge-medecin',
        fields: [
            { label: 'Spécialité', name: 'speciality', type: 'text', required: true },
            { label: 'Ville / Wilaya', name: 'wilaya', type: 'text', required: true },
            { label: "Années d'expérience", name: 'yearsOfExperience', type: 'number', required: true }
        ]
    },
    centre_analyse: {
        label: "Centre d'Analyse",
        class: 'badge-centre',
        fields: [
            { label: 'Nom du Centre', name: 'centreName', type: 'text', required: true },
            { label: 'Catégorie', name: 'categorie', type: 'text', required: true },
            { label: 'Localisation', name: 'localisation', type: 'text', required: true }
        ],
        hideName: true
    },
    pharmacie: {
        label: 'Pharmacie',
        class: 'badge-pharmacie',
        fields: [
            { label: 'Nom de la Pharmacie', name: 'pharmacyName', type: 'text', required: true },
            { label: 'Nom du Propriétaire', name: 'ownerName', type: 'text', required: true },
            { label: 'Numéro de Licence', name: 'licenseNumber', type: 'text', required: true },
            { label: 'Adresse', name: 'address', type: 'text', required: true },
            { label: 'Gouvernorat', name: 'gouvernorat', type: 'text', required: true },
            { label: 'Délégation', name: 'delegation', type: 'text', required: true }
        ],
        hideName: true
    },
    clinique: {
        label: 'Clinique',
        class: 'badge-clinique',
        fields: [
            { label: 'Nom de la Clinique', name: 'clinicName', type: 'text', required: true },
            { label: 'Date de création', name: 'creationDate', type: 'date', required: true },
            { label: 'Email Officiel', name: 'officialEmail', type: 'email', required: true },
            { label: 'Adresse', name: 'address', type: 'text', required: true }
        ],
        hideName: true
    }
};

// Initialize Page
function init() {
    // 1. Check Params
    if (!token || !role) {
        showError("Lien d'invitation invalide ou incomplet.");
        form.style.display = 'none';
        return;
    }

    // 2. Set Role Badge
    const config = roleConfig[role];
    if (config) {
        roleBadge.textContent = config.label;
        roleBadge.style.background = 'rgba(0, 191, 166, 0.1)';
        roleBadge.style.color = '#00BFA6';

        // 3. Inject Fields
        if (config.fields && config.fields.length > 0) {
            const section = document.createElement('div');
            section.className = 'form-section';
            section.innerHTML = `<h3><span class="material-icons-round">business</span> Informations Professionnelles</h3>`;

            const row = document.createElement('div');
            row.className = 'form-row';
            let currentRow = row;
            section.appendChild(currentRow);

            config.fields.forEach((field, index) => {
                const group = document.createElement('div');
                group.className = 'form-group';
                group.innerHTML = `
                    <label>${field.label}</label>
                    <input type="${field.type}" name="${field.name}" ${field.required ? 'required' : ''}>
                `;
                currentRow.appendChild(group);
            });

            roleSpecificFields.appendChild(section);
        }

        // Adjust Name fields for generic organizations?
        if (config.hideName) {
            document.getElementById('group-firstname').style.display = 'none';
            document.getElementById('group-lastname').style.display = 'none';
            document.querySelector('input[name="firstName"]').removeAttribute('required');
            document.querySelector('input[name="lastName"]').removeAttribute('required');
        }
    } else {
        showError("Rôle inconnu.");
        form.style.display = 'none';
    }
}

// Handle Submit
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorCard.style.display = 'none';

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Validate passwords
    if (data.password !== data.confirmPassword) {
        showError("Les mots de passe ne correspondent pas.");
        return;
    }

    // Sanitize and Format Payload
    delete data.confirmPassword;

    if (data.yearsOfExperience) {
        data.yearsOfExperience = parseInt(data.yearsOfExperience, 10);
    }

    // Prepare payload
    const payload = {
        token: token,
        ...data
    };

    const button = form.querySelector('button[type="submit"]');
    const originalText = button.textContent;
    button.textContent = 'Traitement en cours...';
    button.disabled = true;

    try {
        let userEmail = email;
        if (!userEmail) {
            userEmail = prompt("Veuillez confirmer votre adresse email pour finaliser l'inscription :");
            if (!userEmail) {
                throw new Error("L'email est requis.");
            }
        }

        const response = await fetch(`${API_BASE}/auth/complete-invite?email=${encodeURIComponent(userEmail)}&role=${role}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Erreur lors de l'inscription");
        }

        alert("Inscription réussie ! Vous pouvez maintenant vous connecter sur l'application mobile ou le dashboard.");
        
        // if (role === 'clinique') {
        //     window.location.href = 'clinique_dashboard.html';
        //     return;
        // }

        document.body.innerHTML = `
            <div style="text-align:center; color: white;">
                <h1>🎉 Inscription Réussie !</h1>
                <p>Votre compte est actif.</p>
            </div>
        `;

    } catch (error) {
        showError(error.message);
        button.textContent = originalText;
        button.disabled = false;
    }
});

function showError(msg) {
    errorText.textContent = msg;
    errorCard.style.display = 'block';
}

// Run
init();
