# 🔧 Résolution des Problèmes de Notifications

## 🐛 Problème Actuel

Les notifications ne s'affichent pas dans l'application et sur le téléphone malgré la création d'un appointment.

---

## ✅ Corrections Apportées

### 1. **Amélioration du Guard WebSocket**
- Ajout de logs détaillés pour diagnostiquer les problèmes de connexion
- Meilleure gestion de l'extraction du token
- Support de différents formats de payload JWT (`sub`, `_id`, `id`)

### 2. **Amélioration du Service de Notifications**
- Ajout de logs à chaque étape de création
- Vérification de la connexion WebSocket avant envoi
- Messages de débogage clairs

### 3. **Amélioration du Gateway**
- Logs détaillés lors de la connexion
- Support de différents formats de userId

### 4. **Endpoint de Test**
- `POST /notifications/test` : Créer une notification de test pour vérifier le système

---

## 🔍 Comment Déboguer

### Étape 1 : Vérifier que la notification est créée

**Via les logs du serveur :**
Lorsqu'un patient crée un appointment, vous devriez voir :
```
[AppointmentsService] Envoi notification au centre - labUserId: ...
[NotificationService] Création d'une notification pour userId: ...
[NotificationService] Notification sauvegardée en DB: ...
```

**Via MongoDB :**
```javascript
// Se connecter à MongoDB
mongosh mongodb://localhost:27017/medaichain

// Vérifier les dernières notifications
db.notifications.find().sort({ createdAt: -1 }).limit(5).pretty()
```

**Via l'API REST :**
```bash
GET http://localhost:3000/notifications
Headers: { Authorization: Bearer JWT_TOKEN_DU_CENTRE }
```

### Étape 2 : Vérifier la connexion WebSocket

**Problème :** "Connexion rejetée: pas d'userId"

**Solution :** Le token JWT doit être envoyé correctement :

```javascript
// ✅ CORRECT
const socket = io('http://localhost:3000/notifications', {
  auth: {
    token: 'VOTRE_JWT_TOKEN'
  }
});

// ✅ ALTERNATIVE
const socket = io('http://localhost:3000/notifications?token=VOTRE_JWT_TOKEN');
```

**Vérifier le token :**
- Le token doit être valide et non expiré
- Le token doit contenir `sub` avec l'userId
- Le token doit être celui du centre d'analyse (pas du patient)

### Étape 3 : Tester avec l'endpoint de test

```bash
POST http://localhost:3000/notifications/test
Headers: { 
  Authorization: Bearer JWT_TOKEN_DU_CENTRE,
  Content-Type: application/json
}
Body: {
  "title": "Test",
  "message": "Message de test"
}
```

La réponse indiquera si l'utilisateur est connecté :
```json
{
  "message": "Notification de test créée",
  "notification": { ... },
  "isConnected": true/false,
  "userId": "..."
}
```

---

## 📱 Pour les Notifications sur Téléphone

**Important :** Les notifications push mobiles ne sont pas encore implémentées dans le code.

**Actuellement disponible :**
- ✅ WebSocket (application web)
- ✅ API REST (récupération manuelle)
- ⏳ Push notifications mobiles (voir `PUSH_NOTIFICATIONS_GUIDE.md`)

**Pour avoir les notifications sur téléphone :**
1. Implémenter Firebase Cloud Messaging (FCM) - voir `PUSH_NOTIFICATIONS_GUIDE.md`
2. Enregistrer les tokens de devices
3. Envoyer les notifications push en plus du WebSocket

---

## 🎯 Checklist de Vérification

### Pour que les notifications fonctionnent :

- [ ] **Backend :** Les notifications sont créées en DB (vérifier les logs)
- [ ] **Backend :** Le `labUserId` est correct (vérifier les logs)
- [ ] **WebSocket :** Le centre est connecté au WebSocket (vérifier les logs)
- [ ] **WebSocket :** Le token JWT est valide et contient `sub`
- [ ] **Frontend :** L'application écoute l'événement `newNotification`
- [ ] **Frontend :** Le token JWT est envoyé correctement dans la connexion

### Pour les notifications push mobiles :

- [ ] **Backend :** Implémenter `PushNotificationService` (voir guide)
- [ ] **Backend :** Enregistrer les tokens FCM
- [ ] **Mobile :** Configurer FCM dans l'app
- [ ] **Mobile :** Envoyer le token au backend lors du login

---

## 📊 Logs à Surveiller

### Lors de la création d'un appointment :

```
[AppointmentsService] Envoi notification au centre - labUserId: 69a03c933ed744343659254b
[NotificationService] Création d'une notification pour userId: 69a03c933ed744343659254b
[NotificationService] Notification sauvegardée en DB: 67a1b2c3d4e5f6g7h8i9j0k1
[NotificationService] Utilisateur connecté? true pour userId: 69a03c933ed744343659254b
[NotificationService] Notification envoyée via WebSocket
[NotificationGateway] Notification envoyée à l'utilisateur 69a03c933ed744343659254b
```

### Si l'utilisateur n'est pas connecté :

```
[NotificationService] Utilisateur connecté? false pour userId: 69a03c933ed744343659254b
[NotificationService] Utilisateur non connecté, notification sauvegardée uniquement en DB
```

**Dans ce cas :** La notification est sauvegardée mais pas envoyée en temps réel. L'utilisateur peut la récupérer via l'API REST.

---

## 🚀 Actions Immédiates

1. **Vérifier les logs** lors de la création d'un appointment
2. **Vérifier MongoDB** pour confirmer que les notifications sont créées
3. **Tester la connexion WebSocket** avec le token du centre
4. **Utiliser l'endpoint de test** pour vérifier le système
5. **Vérifier le frontend** : est-ce qu'il écoute bien `newNotification` ?

---

## 📝 Notes Importantes

- Les notifications sont **toujours sauvegardées en base de données**, même si l'utilisateur n'est pas connecté
- Les notifications peuvent être récupérées via l'API REST même sans WebSocket
- Pour les notifications push mobiles, il faut implémenter FCM (voir guide)
- Le WebSocket nécessite que l'utilisateur soit connecté avec un token JWT valide

---

**Consultez `src/notifications/DEBUG_NOTIFICATIONS.md` pour plus de détails sur le débogage.**
