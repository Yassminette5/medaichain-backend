# Intégration Mobile Patient - Backend

## Modifications apportées

### Backend (medaichain-backend)

#### 1. Schéma User (`src/users/schemas/user.schema.ts`)
Ajout de champs supplémentaires pour faciliter l'accès aux données patient sans jointure:
- `fullName`: Nom complet du patient
- `gender`: Genre (male/female)
- `age`: Âge
- `height`: Taille en cm
- `weight`: Poids en kg
- `allergies`: Liste des allergies

#### 2. DTO d'inscription (`src/auth/dto/auth.dto.ts`)
Ajout du champ `fullName` dans `RegisterDto` pour permettre l'inscription avec le nom complet.

#### 3. Service d'authentification (`src/auth/auth.service.ts`)
- Modification de la méthode `register()` pour accepter et stocker le `fullName`
- Amélioration de la création du profil patient pour gérer le `fullName`
- Mise à jour de `sanitizeUser()` pour retourner les nouveaux champs

#### 4. Service Profiles (`src/profiles/profiles.service.ts`)
Ajout de la méthode `updatePatientInformation()` qui:
- Met à jour les informations patient dans le document User
- Marque le profil comme complété
- Retourne l'utilisateur mis à jour

#### 5. Contrôleur Profiles (`src/profiles/profiles.controller.ts`)
Modification de l'endpoint `PUT /profiles/patient` pour accepter:
```typescript
{
  fullName?: string;
  gender: string;      // "male" ou "female"
  age: number;
  height: number;      // en cm
  weight: number;      // en kg
  allergies: string[]; // liste des allergies
}
```

### Applications Flutter

#### medaichain-mobile-patient
✅ Application source - Le signup de cette application a été utilisé comme référence

#### medecin_app
Modifications apportées:

1. **screens/auth/signup_screen.dart**
   - ✅ Remplacé par le signup de medaichain-mobile-patient
   - Interface moderne en 2 étapes
   - Inscription uniquement pour les patients
   - Navigation vers InformationsFlow après inscription

2. **models/user_model.dart**
   - Ajout du champ `fullName` optionnel
   - Renommage du getter `fullName` en `displayName` pour éviter les conflits
   - Le getter `displayName` utilise `fullName` en priorité, puis firstName/lastName

3. **models/doctor_profile_model.dart**
   - Ajout du getter `displayName` comme alias de `fullName`

4. **services/api_service.dart**
   - Ajout du paramètre `fullName` dans la méthode `register()`
   - Ajout de la méthode `updatePatientInformation()` qui retourne un User
   - Mise à jour de `_saveUser()` pour inclure les nouveaux champs

5. **providers/auth_provider.dart**
   - Support du paramètre `fullName` dans la méthode `register()`
   - Méthode `updatePatientInformation()` pour mettre à jour les infos patient

6. **screens/dashboard/dashboard_screen.dart**
   - Utilisation de `displayName` au lieu de `fullName`

7. **screens/profile/doctor_profile_screen.dart**
   - Utilisation de `displayName` au lieu de `fullName`

#### temp_patient_branch
✅ Déjà à jour - Utilise correctement le paramètre `fullName`

## Flux d'inscription mobile patient (identique pour toutes les apps)

1. **Inscription initiale** (`POST /auth/register`)
   ```json
   {
     "email": "patient@example.com",
     "password": "password123",
     "phone": "+213555123456",
     "role": "patient",
     "fullName": "Jean Dupont"
   }
   ```
   Retourne: `{ user, accessToken, refreshToken }`

2. **Complétion du profil** (`PUT /profiles/patient`)
   ```json
   {
     "gender": "male",
     "age": 30,
     "height": 175,
     "weight": 70,
     "allergies": ["Pénicilline", "Arachides"]
   }
   ```
   Retourne: L'objet User complet avec tous les champs

3. **Récupération du profil** (`GET /auth/me`)
   Retourne l'utilisateur avec tous les champs incluant:
   - fullName
   - gender
   - age
   - height
   - weight
   - allergies

## Interface d'inscription

L'écran d'inscription est maintenant unifié entre toutes les applications Flutter:

### Étape 1: Informations personnelles
- Nom complet
- Email
- Téléphone

### Étape 2: Sécurité du compte
- Mot de passe (avec indicateur de force)
- Confirmation du mot de passe
- Acceptation des conditions d'utilisation

### Après inscription
Navigation automatique vers le flux d'informations patient (InformationsFlow) qui collecte:
- Genre
- Âge
- Taille
- Poids
- Allergies

## Compatibilité

✅ L'intégration est rétrocompatible:
- Les anciens utilisateurs sans ces champs continueront de fonctionner
- Les champs sont optionnels dans le schéma
- Le mobile peut envoyer ces informations progressivement

## Tests recommandés

1. ✅ Tester l'inscription avec fullName
2. ✅ Tester la mise à jour des informations patient
3. ✅ Vérifier que GET /auth/me retourne tous les champs
4. ✅ Tester avec et sans les nouveaux champs (rétrocompatibilité)
5. ✅ Vérifier que toutes les applications Flutter compilent sans erreur
6. ✅ Vérifier que le signup est identique dans toutes les apps


