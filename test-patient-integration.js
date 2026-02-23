/**
 * Script de test d'intégration pour l'API Patient
 * Usage: node test-patient-integration.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
let accessToken = '';
let refreshToken = '';

// Fonction helper pour faire des requêtes HTTP
function makeRequest(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const response = {
                        statusCode: res.statusCode,
                        body: body ? JSON.parse(body) : null
                    };
                    resolve(response);
                } catch (e) {
                    resolve({ statusCode: res.statusCode, body: body });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

// Tests
async function runTests() {
    console.log('🚀 Démarrage des tests d\'intégration Patient API\n');

    try {
        // Test 1: Inscription
        console.log('📝 Test 1: Inscription d\'un nouveau patient');
        const registerData = {
            email: `test.patient.${Date.now()}@medaichain.com`,
            password: 'Password123!',
            phone: `+21355${Math.floor(Math.random() * 1000000)}`,
            role: 'patient',
            fullName: 'Test Patient'
        };

        const registerRes = await makeRequest('POST', '/auth/register', registerData);
        if (registerRes.statusCode === 201) {
            console.log('✅ Inscription réussie');
            accessToken = registerRes.body.accessToken;
            refreshToken = registerRes.body.refreshToken;
            console.log(`   User ID: ${registerRes.body.user.id}`);
            console.log(`   Email: ${registerRes.body.user.email}`);
            console.log(`   FullName: ${registerRes.body.user.fullName}`);
        } else {
            console.log('❌ Échec de l\'inscription');
            console.log(`   Status: ${registerRes.statusCode}`);
            console.log(`   Error: ${JSON.stringify(registerRes.body)}`);
            return;
        }

        // Test 2: Obtenir le profil
        console.log('\n📝 Test 2: Obtenir le profil utilisateur');
        const profileRes = await makeRequest('GET', '/auth/me', null, accessToken);
        if (profileRes.statusCode === 200) {
            console.log('✅ Profil récupéré avec succès');
            console.log(`   FullName: ${profileRes.body.fullName}`);
            console.log(`   Profile Completed: ${profileRes.body.isProfileCompleted}`);
        } else {
            console.log('❌ Échec de récupération du profil');
            console.log(`   Status: ${profileRes.statusCode}`);
        }

        // Test 3: Mettre à jour les informations patient
        console.log('\n📝 Test 3: Mise à jour des informations patient');
        const updateData = {
            fullName: 'Test Patient Updated',
            gender: 'homme',
            age: 30,
            height: 175,
            weight: 70,
            allergies: ['Pénicilline', 'Pollen']
        };

        const updateRes = await makeRequest('PUT', '/profiles/patient', updateData, accessToken);
        if (updateRes.statusCode === 200) {
            console.log('✅ Informations mises à jour avec succès');
            console.log(`   FullName: ${updateRes.body.fullName}`);
            console.log(`   Gender: ${updateRes.body.gender}`);
            console.log(`   Age: ${updateRes.body.age}`);
            console.log(`   Height: ${updateRes.body.height}`);
            console.log(`   Weight: ${updateRes.body.weight}`);
            console.log(`   Allergies: ${updateRes.body.allergies?.join(', ')}`);
            console.log(`   Profile Completed: ${updateRes.body.isProfileCompleted}`);
        } else {
            console.log('❌ Échec de mise à jour');
            console.log(`   Status: ${updateRes.statusCode}`);
            console.log(`   Error: ${JSON.stringify(updateRes.body)}`);
        }

        // Test 4: Vérifier le profil mis à jour
        console.log('\n📝 Test 4: Vérifier le profil après mise à jour');
        const updatedProfileRes = await makeRequest('GET', '/auth/me', null, accessToken);
        if (updatedProfileRes.statusCode === 200) {
            console.log('✅ Profil vérifié');
            console.log(`   FullName: ${updatedProfileRes.body.fullName}`);
            console.log(`   Gender: ${updatedProfileRes.body.gender}`);
            console.log(`   Age: ${updatedProfileRes.body.age}`);
            console.log(`   Profile Completed: ${updatedProfileRes.body.isProfileCompleted}`);
        } else {
            console.log('❌ Échec de vérification');
        }

        // Test 5: Connexion
        console.log('\n📝 Test 5: Connexion avec les identifiants');
        const loginRes = await makeRequest('POST', '/auth/login', {
            email: registerData.email,
            password: registerData.password
        });
        if (loginRes.statusCode === 200) {
            console.log('✅ Connexion réussie');
            console.log(`   New Access Token: ${loginRes.body.accessToken.substring(0, 20)}...`);
        } else {
            console.log('❌ Échec de connexion');
            console.log(`   Status: ${loginRes.statusCode}`);
        }

        // Test 6: Inscription sans fullName
        console.log('\n📝 Test 6: Inscription sans fullName (optionnel)');
        const registerNoNameData = {
            email: `test.patient.noname.${Date.now()}@medaichain.com`,
            password: 'Password123!',
            phone: `+21355${Math.floor(Math.random() * 1000000)}`,
            role: 'patient'
        };

        const registerNoNameRes = await makeRequest('POST', '/auth/register', registerNoNameData);
        if (registerNoNameRes.statusCode === 201) {
            console.log('✅ Inscription sans fullName réussie');
            console.log(`   FullName: ${registerNoNameRes.body.user.fullName || 'null'}`);
        } else {
            console.log('❌ Échec de l\'inscription sans fullName');
            console.log(`   Status: ${registerNoNameRes.statusCode}`);
            console.log(`   Error: ${JSON.stringify(registerNoNameRes.body)}`);
        }

        console.log('\n✨ Tous les tests sont terminés!\n');

    } catch (error) {
        console.error('❌ Erreur lors des tests:', error.message);
    }
}

// Vérifier que le serveur est démarré
console.log('🔍 Vérification que le serveur est démarré...');
makeRequest('GET', '/api')
    .then(() => {
        console.log('✅ Serveur accessible\n');
        runTests();
    })
    .catch(() => {
        console.error('❌ Le serveur n\'est pas accessible sur', BASE_URL);
        console.error('   Assurez-vous que le backend est démarré avec: npm run start:dev');
        process.exit(1);
    });
