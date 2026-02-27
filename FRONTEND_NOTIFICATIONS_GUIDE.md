# 📱 Guide d'Intégration Frontend - Système de Notifications

## 🎯 Ce qui a été fait côté Backend

### ✅ Système de Notifications Complet Implémenté

Le backend NestJS dispose maintenant d'un **système de notifications en temps réel** complet avec :

1. **Notifications WebSocket** (Socket.io)
   - Connexion en temps réel pour l'application web
   - Notifications instantanées sans rechargement de page
   - Authentification JWT pour les connexions WebSocket

2. **Notifications Push Mobiles** (Firebase Cloud Messaging)
   - Support iOS et Android
   - Notifications même quand l'app est fermée
   - Gestion automatique des tokens de devices

3. **API REST Complète**
   - Récupération de l'historique des notifications
   - Marquage comme lu/non lu
   - Gestion des tokens de devices

4. **Intégration Automatique**
   - **Patient crée un appointment** → Centre reçoit notification (WebSocket + Push)
   - **Centre accepte/refuse** → Patient reçoit notification (WebSocket + Push)
   - Toutes les notifications sont sauvegardées en base de données

---

## 🔌 Endpoints Disponibles

### WebSocket
```
ws://localhost:3000/notifications
```

### API REST

#### Notifications
- `GET /notifications` - Obtenir toutes les notifications (pagination)
- `GET /notifications/unread` - Notifications non lues
- `GET /notifications/unread/count` - Nombre de notifications non lues
- `PUT /notifications/:id/read` - Marquer une notification comme lue
- `PUT /notifications/read/all` - Marquer toutes comme lues
- `DELETE /notifications/:id` - Supprimer une notification

#### Gestion des Tokens (Mobile)
- `POST /notifications/device/register` - Enregistrer un token FCM
- `POST /notifications/device/unregister` - Désactiver un token
- `GET /notifications/device/tokens` - Liste des tokens de l'utilisateur

---

## 📋 Structure des Données

### Notification Object
```typescript
interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'appointment_status' | 'analysis_result_uploaded' | 'message' | 'reminder' | 'system' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  readAt?: Date;
  actionUrl?: string;
  data: {
    appointmentId?: string;
    status?: string;
    patientId?: string;
    // ... autres données contextuelles
  };
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🚀 Intégration Frontend

### 1. Connexion WebSocket (Application Web)

```typescript
import { io } from 'socket.io-client';

// Récupérer le token JWT depuis le localStorage ou le contexte d'authentification
const token = localStorage.getItem('accessToken'); // ou votre méthode de stockage

// Se connecter au WebSocket
const socket = io('http://localhost:3000/notifications', {
  auth: { token },
  transports: ['websocket'],
});

// Écouter la connexion
socket.on('connect', () => {
  console.log('✅ Connecté au système de notifications');
});

// Écouter les notifications en temps réel
socket.on('newNotification', (notification: Notification) => {
  console.log('🔔 Nouvelle notification:', notification);
  
  // Afficher la notification dans l'UI
  showNotificationToast(notification);
  
  // Mettre à jour le compteur de notifications
  updateNotificationCount();
  
  // Si l'utilisateur est sur la page des notifications, rafraîchir la liste
  if (isOnNotificationsPage) {
    refreshNotificationsList();
  }
});

// Écouter les notifications initiales (non lues)
socket.on('initialNotifications', (notifications: Notification[]) => {
  console.log('📬 Notifications non lues:', notifications);
  setUnreadNotifications(notifications);
});

// Marquer une notification comme lue
socket.emit('markAsRead', notificationId);

// Marquer toutes comme lues
socket.emit('markAllAsRead');
```

### 2. Récupération des Notifications (API REST)

```typescript
// Obtenir toutes les notifications
async function getNotifications(page = 1, limit = 10) {
  const response = await fetch(`http://localhost:3000/notifications?page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}

// Obtenir le compteur de notifications non lues
async function getUnreadCount() {
  const response = await fetch('http://localhost:3000/notifications/unread/count', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await response.json();
  return data.count;
}

// Marquer une notification comme lue
async function markAsRead(notificationId: string) {
  await fetch(`http://localhost:3000/notifications/${notificationId}/read`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
}
```

### 3. Intégration Mobile (React Native / Flutter)

#### React Native avec Firebase

```typescript
import messaging from '@react-native-firebase/messaging';

// Demander la permission
async function requestNotificationPermission() {
  const authStatus = await messaging().requestPermission();
  return authStatus === messaging.AuthorizationStatus.AUTHORIZED;
}

// Obtenir le token FCM
async function getFCMToken() {
  const token = await messaging().getToken();
  return token;
}

// Enregistrer le token au backend
async function registerDeviceToken(token: string, userToken: string) {
  await fetch('http://localhost:3000/notifications/device/register', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      deviceInfo: Device.modelName,
    }),
  });
}

// Écouter les notifications
messaging().onMessage(async remoteMessage => {
  console.log('Notification reçue:', remoteMessage);
  // Afficher la notification dans l'app
});

// Initialisation complète
async function initializeNotifications(userToken: string) {
  // 1. Demander la permission
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  // 2. Obtenir le token FCM
  const fcmToken = await getFCMToken();
  
  // 3. Enregistrer au backend
  await registerDeviceToken(fcmToken, userToken);
  
  // 4. Écouter les notifications
  messaging().onMessage(handleNotification);
}
```

#### Flutter avec Firebase

```dart
import 'package:firebase_messaging/firebase_messaging.dart';

Future<void> initializeNotifications(String userToken) async {
  // 1. Demander la permission
  NotificationSettings settings = await FirebaseMessaging.instance.requestPermission();
  
  if (settings.authorizationStatus == AuthorizationStatus.authorized) {
    // 2. Obtenir le token FCM
    String? fcmToken = await FirebaseMessaging.instance.getToken();
    
    if (fcmToken != null) {
      // 3. Enregistrer au backend
      await registerDeviceToken(fcmToken, userToken);
    }
    
    // 4. Écouter les notifications
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('Notification reçue: ${message.notification?.title}');
      // Afficher la notification dans l'app
    });
  }
}

Future<void> registerDeviceToken(String fcmToken, String userToken) async {
  final response = await http.post(
    Uri.parse('http://localhost:3000/notifications/device/register'),
    headers: {
      'Authorization': 'Bearer $userToken',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'token': fcmToken,
      'platform': Platform.isIOS ? 'ios' : 'android',
    }),
  );
}
```

---

## 🎨 Exemple d'Interface Utilisateur

### Composant React (Exemple)

```tsx
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    
    // Connexion WebSocket
    const newSocket = io('http://localhost:3000/notifications', {
      auth: { token },
    });

    newSocket.on('newNotification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      // Afficher un toast
      showToast(notification.title, notification.message);
    });

    newSocket.on('initialNotifications', (notifs) => {
      setNotifications(notifs);
      setUnreadCount(notifs.length);
    });

    setSocket(newSocket);

    // Charger le compteur initial
    fetchUnreadCount();

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const fetchUnreadCount = async () => {
    const response = await fetch('http://localhost:3000/notifications/unread/count', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });
    const data = await response.json();
    setUnreadCount(data.count);
  };

  const markAsRead = async (notificationId: string) => {
    await fetch(`http://localhost:3000/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="notification-bell">
      <button onClick={() => setShowDropdown(!showDropdown)}>
        🔔
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>
      
      {showDropdown && (
        <div className="notifications-dropdown">
          {notifications.map(notif => (
            <div 
              key={notif._id} 
              className={notif.isRead ? 'read' : 'unread'}
              onClick={() => markAsRead(notif._id)}
            >
              <h4>{notif.title}</h4>
              <p>{notif.message}</p>
              {notif.actionUrl && (
                <a href={notif.actionUrl}>Voir détails</a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## ✅ Checklist d'Implémentation Frontend

### Application Web
- [ ] Installer `socket.io-client`
- [ ] Créer un service de notifications
- [ ] Se connecter au WebSocket avec le token JWT
- [ ] Écouter l'événement `newNotification`
- [ ] Afficher les notifications dans l'UI
- [ ] Implémenter le compteur de notifications non lues
- [ ] Permettre de marquer comme lu
- [ ] Créer une page/liste des notifications
- [ ] Gérer la navigation vers `actionUrl`

### Application Mobile
- [ ] Configurer Firebase Cloud Messaging
- [ ] Demander les permissions de notification
- [ ] Obtenir le token FCM
- [ ] Enregistrer le token au backend après login
- [ ] Écouter les notifications en premier plan
- [ ] Écouter les notifications en arrière-plan
- [ ] Gérer les clics sur les notifications
- [ ] Désactiver le token lors de la déconnexion

---

## 🔗 URLs de Base

- **Backend API**: `http://localhost:3000`
- **WebSocket**: `ws://localhost:3000/notifications`
- **Swagger Documentation**: `http://localhost:3000/api` (si activé)

---

## 📝 Notes Importantes

1. **Authentification** : Tous les endpoints nécessitent un token JWT dans le header `Authorization: Bearer <token>`

2. **WebSocket** : Le token doit être envoyé dans `auth.token` lors de la connexion

3. **Notifications Push** : Les notifications push ne fonctionnent que si :
   - Firebase est configuré côté backend ✅ (déjà fait)
   - Le token FCM est enregistré au backend
   - L'application mobile a les permissions

4. **Format des Dates** : Les dates sont au format ISO 8601

5. **Pagination** : Les endpoints de liste supportent `?page=1&limit=10`

---

## 🆘 Support

Pour toute question ou problème :
- Consulter la documentation Swagger : `http://localhost:3000/api`
- Vérifier les logs du serveur pour les erreurs
- Tester avec l'endpoint de test : `POST /notifications/test`

---

**Le backend est prêt ! Il ne reste plus qu'à intégrer le frontend. 🚀**
