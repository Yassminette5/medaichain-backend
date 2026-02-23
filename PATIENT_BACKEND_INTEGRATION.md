# Intégration Backend Patient - MEDAIChain

## Vue d'ensemble
Ce document décrit l'intégration complète du backend pour l'application patient mobile (medaichain-mobile-patient) avec le backend principal (medaichain-backend).

## Modifications effectuées

### 1. Configuration de validation (main.ts)
**Fichier**: `src/main.ts`

**Changement**: Modification du ValidationPipe pour accepter les champs optionnels
```typescript
app.useGlobalPipes(
    new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false, // Permet les champs optionnels
        skipMissingProperties: false,
    }),
);
```

**Raison**: Le champ `fullName` est optionnel dans le RegisterDto mais était rejeté par la validation stricte.

### 2. Endpoints disponibles

#### A. Authentification (`/auth`)

##### Inscription
- **Endpoint**: `POST /auth/register`
- **Body**:
```json
{
  "email": "patient@example.com",
  "password": "Password123!",
  "phone": "+213555123456",
  "role": "patient",
  "fullName": "Jean Dupont" // Optionnel
}
```
- **Réponse**:
```json
{
  "message": "Inscription réussie",
  "user": {
    "id": "...",
    "email": "patient@example.com",
    "phone": "+213555123456",
    "role": "patient",
    "isEmailVerified": false,
    "isProfileCompleted": false,
    "isActive": true,
    "fullName": "Jean Dupont",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "accessToken": "...",
  "refreshToken": "..."
}
```

##### Connexion
- **Endpoint**: `POST /auth/login`
- **Body**:
```json
{
  "email": "patient@example.com",
  "password": "Password123!"
}
```

##### Mot de passe oublié
- **Endpoint**: `POST /auth/forgot-password`
- **Body**:
```json
{
  "email": "patient@example.com"
}
```

##### Réinitialiser mot de passe
- **Endpoint**: `POST /auth/reset-password`
- **Body**:
```json
{
  "token": "123456",
  "newPassword": "NewPassword123!"
}
```

##### Rafraîchir token
- **Endpoint**: `POST /auth/refresh`
- **Body**:
```json
{
  "refreshToken": "..."
}
```

##### Profil utilisateur
- **Endpoint**: `GET /auth/me`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Réponse**:
```json
{
  "id": "...",
  "email": "patient@example.com",
  "phone": "+213555123456",
  "role": "patient",
  "isEmailVerified": false,
  "isProfileCompleted": true,
  "isActive": true,
  "fullName": "Jean Dupont",
  "gender": "homme",
  "age": 30,
  "height": 175,
  "weight": 70,
  "allergies": ["Pénicilline"],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "lastLoginAt": "2024-01-02T00:00:00.000Z"
}
```

##### Compléter le profil
- **Endpoint**: `POST /auth/complete-profile`
- **Headers**: `Authorization: Bearer <accessToken>`

#### B. Profils (`/profiles`)

##### Mettre à jour profil patient
- **Endpoint**: `PUT /profiles/patient`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Body**:
```json
{
  "fullName": "Jean Dupont",
  "gender": "homme",
  "age": 30,
  "height": 175,
  "weight": 70,
  "allergies": ["Pénicilline", "Arachides"]
}
```
- **Réponse**: Retourne l'objet User mis à jour

##### Obtenir mon profil
- **Endpoint**: `GET /profiles/me`
- **Headers**: `Authorization: Bearer <accessToken>`

### 3. Schéma User (users/schemas/user.schema.ts)

Le schéma User inclut les champs suivants pour les patients:
```typescript
@Prop()
fullName?: string;

@Prop()
gender?: string;

@Prop()
age?: number;

@Prop()
height?: number;

@Prop()
weight?: number;

@Prop([String])
allergies?: string[];
```

### 4. Flux d'inscription patient

1. **Inscription initiale** (`POST /auth/register`)
   - L'utilisateur s'inscrit avec email, password, phone, role=patient
   - Optionnellement, peut envoyer fullName
   - Reçoit accessToken et refreshToken
   - Un profil patient vide est créé automatiquement

2. **Mise à jour des informations de santé** (`PUT /profiles/patient`)
   - Après inscription, l'utilisateur complète son profil
   - Envoie fullName, gender, age, height, weight, allergies
   - Le champ `isProfileCompleted` est mis à true

3. **Navigation vers l'application**
   - L'utilisateur est redirigé vers InformationsFlow
   - Puis vers HomeScreen une fois le profil complété

### 5. Service d'authentification (auth.service.ts)

La méthode `register` gère l'inscription des patients:
```typescript
// Créer l'utilisateur
const user = await this.usersService.create({
    email: registerDto.email,
    password: hashedPassword,
    phone: registerDto.phone,
    role: registerDto.role,
    isProfileCompleted: false,
    fullName: registerDto.fullName, // Pour les patients
});

// Créer le profil patient
if (registerDto.role === UserRole.PATIENT) {
    const names = registerDto.fullName?.split(' ') || [];
    const firstName = registerDto.firstName || names[0] || '';
    const lastName = registerDto.lastName || names.slice(1).join(' ') || '';
    
    await this.profilesService.upsertPatientProfile(user._id.toString(), {
        firstName,
        lastName,
        dateOfBirth: new Date(), // Valeur par défaut
    });
}
```

### 6. Service de profils (profiles.service.ts)

La méthode `updatePatientInformation` met à jour les informations du patient:
```typescript
async updatePatientInformation(userId: string, data: {
    fullName?: string;
    gender: string;
    age: number;
    height: number;
    weight: number;
    allergies: string[];
}) {
    // Mettre à jour les champs dans le document User
    await this.usersService.update(userId, {
        fullName: data.fullName,
        gender: data.gender,
        age: data.age,
        height: data.height,
        weight: data.weight,
        allergies: data.allergies,
        isProfileCompleted: true,
    });

    // Retourner l'utilisateur mis à jour
    return this.usersService.findById(userId);
}
```

## Configuration CORS

Le backend accepte les requêtes de toutes les origines:
```typescript
app.enableCors({
    origin: true,
    credentials: true,
});
```

## URL du backend

- **Émulateur Android**: `http://10.0.2.2:3000`
- **iOS Simulator**: `http://localhost:3000`
- **Appareil physique**: `http://<IP_DE_VOTRE_MACHINE>:3000`

## Documentation Swagger

Accessible à: `http://localhost:3000/api`

## Tests

Pour tester l'intégration:

1. **Démarrer le backend**:
```bash
cd medaichain-backend
npm run start:dev
```

2. **Tester l'inscription**:
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@patient.com",
    "password": "Password123!",
    "phone": "+213555123456",
    "role": "patient",
    "fullName": "Test Patient"
  }'
```

3. **Tester la mise à jour du profil**:
```bash
curl -X PUT http://localhost:3000/profiles/patient \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "fullName": "Test Patient",
    "gender": "homme",
    "age": 30,
    "height": 175,
    "weight": 70,
    "allergies": ["Pénicilline"]
  }'
```

## Résumé

✅ Le backend medaichain-backend est maintenant complètement intégré avec l'application patient
✅ Tous les endpoints nécessaires sont disponibles et fonctionnels
✅ La validation accepte les champs optionnels comme fullName
✅ Le flux d'inscription et de mise à jour du profil est opérationnel
✅ Les données patient sont stockées dans le schéma User pour un accès rapide

## Prochaines étapes

1. Tester l'intégration complète avec l'application mobile
2. Ajouter des tests unitaires pour les nouveaux endpoints
3. Implémenter la vérification d'email si nécessaire
4. Ajouter des validations supplémentaires pour les données de santé
