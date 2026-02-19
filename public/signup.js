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
        hideName: true // Hide generic First/Last name for organization? kept for contact person
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
        fields: []
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
        // Apply basic style if class logic not in CSS yet, or use inline
        roleBadge.style.background = 'rgba(0, 191, 166, 0.1)';
        roleBadge.style.color = '#00BFA6';

        // 3. Inject Fields
        if (config.fields && config.fields.length > 0) {
            const section = document.createElement('div');
            section.className = 'form-section';
            section.innerHTML = `<h3><span class="material-icons-round">business</span> Informations Professionnelles</h3>`;

            const row = document.createElement('div');
            row.className = 'form-row';
            // Simple grid logic: wrap every 2 fields

            let currentRow = row;
            section.appendChild(currentRow);

            config.fields.forEach((field, index) => {
                const group = document.createElement('div');
                group.className = 'form-group';
                group.innerHTML = `
                    <label>${field.label}</label>
                    <input type="${field.type}" name="${field.name}" ${field.required ? 'required' : ''}>
                `;

                // If index is even and > 0, make new row?
                // CSS grid handles form-row automatically if we use it correctly or use flex wrap
                // For now, let's just append to row.
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
    delete data.confirmPassword; // Remove field not in DTO

    if (data.yearsOfExperience) {
        data.yearsOfExperience = parseInt(data.yearsOfExperience, 10);
    }

    // Prepare payload
    const payload = {
        token: token,
        ...data
    };

    // If generic names hidden, maybe fill them with Organization name for contact?
    // Backend doesn't enforce First/Last for non-doctors in check?
    // CompleteInviteDto has optional First/Last.

    const button = form.querySelector('button[type="submit"]');
    const originalText = button.textContent;
    button.textContent = 'Traitement en cours...';
    button.disabled = true;

    try {
        // Need to pass email and role as query params or body?
        // Controller expects: @Query('email') email, @Query('role') role
        // We get role from URL.
        // We need Email. 
        // 1. Try to get email from URL param if available.
        // 2. PROMPT USER FOR EMAIL if missing?
        // Let's prompt user for email if not in URL.

        let userEmail = email; // from global var extracted from URL
        if (!userEmail) {
            // Check if we already added an email field?
            // If not, we should have...
            // Let's assume for this step we fail if no email.
            // OR we add email input dynamically.

            // For MVP: let's ask for email in a prompt if missing? NO, bad UX.
            // Better: Add email field to form if missing.
            userEmail = prompt("Veuillez confirmer votre adresse email pour finaliser l'inscription :");
            if (!userEmail) throw new Error("L'email est requis.");
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
        // Redirect or show success
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
