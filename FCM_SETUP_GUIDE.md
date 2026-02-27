# 🔥 Configuration Firebase Cloud Messaging (FCM)

## 📋 Prérequis

1. Un compte Google (Gmail)
2. Accès à [Firebase Console](https://console.firebase.google.com/)

---

## 🚀 Étapes de Configuration

### 1. Créer un Projet Firebase

1. Aller sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquer sur **"Ajouter un projet"** ou **"Add project"**
3. Entrer le nom du projet (ex: `medaichain-notifications`)
4. Suivre les étapes (Google Analytics optionnel)
5. Cliquer sur **"Créer le projet"**

### 2. Générer une Clé de Compte de Service

1. Dans Firebase Console, aller dans **Paramètres du projet** (icône ⚙️)
2. Aller dans l'onglet **"Comptes de service"** ou **"Service accounts"**
3. Cliquer sur **"Générer une nouvelle clé privée"** ou **"Generate new private key"**
4. Un fichier JSON sera téléchargé (ex: `medaichain-notifications-firebase-adminsdk-xxxxx.json`)

### 3. Extraire les Informations du Fichier JSON

Ouvrir le fichier JSON téléchargé. Il contient :

```json
{
  "type": "service_account",
  "project_id": "medaichain-notifications",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@medaichain-notifications.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

### 4. Ajouter les Variables d'Environnement

Ajouter ces variables dans votre fichier `.env` :

```env
# Firebase Cloud Messaging
FCM_PROJECT_ID=medaichain-notifications
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FCM_CLIENT_EMAIL=firebase-adminsdk-xxxxx@medaichain-notifications.iam.gserviceaccount.com
```

**⚠️ Important :**
- `FCM_PRIVATE_KEY` doit être entre guillemets et contenir les `\n` (retours à la ligne)
- Copier la valeur exacte de `private_key` depuis le JSON
- Ne pas partager ce fichier `.env` publiquement (il est déjà dans `.gitignore`)

---

## 📱 Configuration pour les Applications Mobiles

### Pour React Native

1. Installer les dépendances :
```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
```

2. Suivre la documentation : [React Native Firebase - Messaging](https://rnfirebase.io/messaging/usage)

### Pour Flutter

1. Ajouter les dépendances dans `pubspec.yaml` :
```yaml
dependencies:
  firebase_messaging: ^14.0.0
  firebase_core: ^2.0.0
```

2. Suivre la documentation : [Flutter Firebase - Messaging](https://firebase.flutter.dev/docs/messaging/overview)

---

## ✅ Vérification

### Vérifier que Firebase est Initialisé

Regardez les logs du serveur au démarrage :

```
[PushNotificationService] Firebase Admin SDK initialisé avec succès
```

Si vous voyez :
```
[PushNotificationService] Firebase credentials non configurées
```

Vérifiez que les variables d'environnement sont correctement définies dans `.env`.

### Tester l'Envoi de Notification

1. Enregistrer un token de device via l'API :
```bash
POST http://localhost:3000/notifications/device/register
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "token": "FCM_TOKEN_DU_DEVICE",
  "platform": "android",
  "deviceInfo": "Samsung Galaxy S21"
}
```

2. Créer une notification de test :
```bash
POST http://localhost:3000/notifications/test
Authorization: Bearer JWT_TOKEN
```

3. Vérifier les logs :
```
[NotificationService] Push notification: 1 succès, 0 échecs
```

---

## 🔒 Sécurité

- ⚠️ **Ne jamais commiter** le fichier JSON de Firebase dans Git
- ⚠️ **Ne jamais partager** les clés privées publiquement
- ✅ Le fichier `.env` est déjà dans `.gitignore`
- ✅ Les tokens FCM sont stockés en base de données de manière sécurisée

---

## 📚 Ressources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [React Native Firebase](https://rnfirebase.io/)
- [Flutter Firebase](https://firebase.flutter.dev/)

---

## 🆘 Dépannage

### Erreur : "Firebase credentials non configurées"

**Solution :** Vérifiez que les 3 variables sont définies dans `.env` :
- `FCM_PROJECT_ID`
- `FCM_PRIVATE_KEY`
- `FCM_CLIENT_EMAIL`

### Erreur : "Invalid private key"

**Solution :** Vérifiez que `FCM_PRIVATE_KEY` contient bien les `\n` et est entre guillemets.

### Les notifications ne sont pas reçues

**Vérifications :**
1. Le token FCM est-il enregistré ? (`GET /notifications/device/tokens`)
2. Le token est-il actif ? (`isActive: true`)
3. Les logs montrent-ils des erreurs lors de l'envoi ?
4. L'application mobile a-t-elle les permissions de notification ?

---

**Une fois configuré, les notifications push seront automatiquement envoyées en plus des notifications WebSocket !** 🎉
