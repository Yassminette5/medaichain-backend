# 🔔 Système de Notifications - Documentation Frontend

## 📋 Résumé Exécutif

Le backend NestJS dispose maintenant d'un **système de notifications en temps réel complet** qui permet :

✅ **Notifications WebSocket** pour l'application web  
✅ **Notifications Push Mobiles** (iOS & Android) via Firebase  
✅ **API REST** pour la gestion complète  
✅ **Intégration automatique** avec les appointments

---

## 🎯 Ce qui fonctionne automatiquement

### Scénarios Implémentés

1. **Patient crée un appointment**
   ```
   → Notification envoyée au centre d'analyse
   → Via WebSocket (si connecté) + Push (si token enregistré)
   → Sauvegardée en base de données
   ```

2. **Centre accepte un appointment**
   ```
   → Notification envoyée au patient
   → Via WebSocket (si connecté) + Push (si token enregistré)
   → Sauvegardée en base de données
   ```

3. **Centre refuse un appointment**
   ```
   → Notification envoyée au patient
   → Via WebSocket (si connecté) + Push (si token enregistré)
   → Sauvegardée en base de données
   ```

---

## 🔌 Connexion WebSocket

### URL
```
ws://localhost:3000/notifications
```

### Authentification
```javascript
const socket = io('http://localhost:3000/notifications', {
  auth: { token: 'VOTRE_JWT_TOKEN' }
});
```

### Événements

**Reçus :**
- `connect` - Connexion établie
- `connected` - Confirmation avec userId
- `newNotification` - Nouvelle notification reçue
- `initialNotifications` - Notifications non lues au démarrage
- `notificationUpdated` - Notification mise à jour (marquée comme lue)
- `allNotificationsMarkedAsRead` - Toutes marquées comme lues

**Envoyés :**
- `markAsRead` - Marquer une notification comme lue
- `markAllAsRead` - Marquer toutes comme lues

---

## 📡 API REST

### Base URL
```
http://localhost:3000
```

### Headers Requis
```javascript
{
  'Authorization': 'Bearer VOTRE_JWT_TOKEN',
  'Content-Type': 'application/json'
}
```

### Endpoints Principaux

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/notifications` | Liste des notifications (pagination) |
| GET | `/notifications/unread` | Notifications non lues |
| GET | `/notifications/unread/count` | Nombre de non lues |
| PUT | `/notifications/:id/read` | Marquer comme lue |
| PUT | `/notifications/read/all` | Tout marquer comme lu |
| DELETE | `/notifications/:id` | Supprimer une notification |
| POST | `/notifications/device/register` | Enregistrer token FCM (mobile) |
| POST | `/notifications/device/unregister` | Désactiver token FCM |

---

## 📱 Pour Mobile (React Native / Flutter)

### Étapes

1. **Configurer Firebase** dans votre projet mobile
2. **Obtenir le token FCM** après le login
3. **Enregistrer le token** au backend :
   ```javascript
   POST /notifications/device/register
   {
     "token": "FCM_TOKEN_ICI",
     "platform": "android", // ou "ios"
     "deviceInfo": "Samsung Galaxy S21" // optionnel
   }
   ```
4. **Écouter les notifications** dans l'app

---

## 💻 Exemple de Code Minimal

### Web (React/Vue/Angular)

```javascript
// 1. Connexion WebSocket
import { io } from 'socket.io-client';

const token = localStorage.getItem('token');
const socket = io('http://localhost:3000/notifications', {
  auth: { token }
});

// 2. Écouter les nouvelles notifications
socket.on('newNotification', (notification) => {
  console.log('Nouvelle notification:', notification);
  // Afficher dans l'UI
  showNotification(notification);
});

// 3. Récupérer les notifications non lues
socket.on('initialNotifications', (notifications) => {
  console.log('Notifications non lues:', notifications);
  updateNotificationList(notifications);
});
```

### Mobile (React Native)

```javascript
import messaging from '@react-native-firebase/messaging';

// Après le login
async function setupNotifications(userToken) {
  // 1. Obtenir le token FCM
  const fcmToken = await messaging().getToken();
  
  // 2. Enregistrer au backend
  await fetch('http://localhost:3000/notifications/device/register', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token: fcmToken,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    }),
  });
  
  // 3. Écouter les notifications
  messaging().onMessage(handleNotification);
}
```

---

## 📚 Documentation Complète

Pour plus de détails, consultez :
- **`FRONTEND_NOTIFICATIONS_GUIDE.md`** - Guide complet avec exemples
- **`src/notifications/FRONTEND_INTEGRATION.md`** - Documentation technique détaillée
- **Swagger UI** : `http://localhost:3000/api` (si activé)

---

## ✅ Checklist Rapide

- [ ] Installer `socket.io-client` (web)
- [ ] Configurer Firebase (mobile)
- [ ] Se connecter au WebSocket avec JWT
- [ ] Écouter `newNotification`
- [ ] Afficher les notifications dans l'UI
- [ ] Implémenter le compteur de non lues
- [ ] Enregistrer le token FCM (mobile)

---

**Le backend est 100% prêt. Il ne reste plus qu'à connecter le frontend ! 🚀**
