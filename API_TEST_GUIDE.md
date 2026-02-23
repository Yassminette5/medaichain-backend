# API Test Guide

## Backend Status
✅ Backend is running on `http://localhost:3000`
✅ Swagger docs available at `http://localhost:3000/api`

## Test Credentials

### Pharmacy Account
- Email: `pharmacy@test.com`
- Password: `password123`
- Role: PHARMACIE

### Doctor Account
- Email: `doctor@test.com`
- Password: `password123`
- Role: MEDECIN

### Admin Account
- Email: `admin@test.com`
- Password: `password123`
- Role: ADMIN

---

## Testing the New Features

### 1. Login and Get Token

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "pharmacy@test.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "message": "Connexion réussie",
  "user": {
    "id": "...",
    "email": "pharmacy@test.com",
    "role": "PHARMACIE"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

Save the `accessToken` for the following requests.

---

### 2. Change Password

```bash
curl -X POST http://localhost:3000/auth/change-password \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "password123",
    "newPassword": "newPassword123"
  }'
```

**Response:**
```json
{
  "message": "Mot de passe changé avec succès"
}
```

---

### 3. Enable Delivery Service in Pharmacy

```bash
curl -X PUT http://localhost:3000/profiles/pharmacy \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "pharmacyName": "Pharmacie Test",
    "ownerName": "Owner Name",
    "licenseNumber": "LIC123456",
    "address": "123 Rue Test",
    "city": "Alger",
    "wilaya": "Alger",
    "hasDelivery": true,
    "deliveryRadius": 5,
    "deliveryFee": 500,
    "notificationsEnabled": true,
    "emailNotifications": true,
    "smsNotifications": true,
    "deliveryNotifications": true,
    "prescriptionNotifications": true
  }'
```

---

### 4. Create a Delivery

```bash
curl -X POST http://localhost:3000/deliveries \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "medicationRequestId": "507f1f77bcf86cd799439011",
    "patientId": "507f1f77bcf86cd799439012",
    "deliveryAddress": "123 Patient Street",
    "deliveryCity": "Alger",
    "deliveryPostalCode": "16000",
    "gpsLatitude": 36.7372,
    "gpsLongitude": 3.0869,
    "estimatedDeliveryTime": "2024-02-23T14:00:00Z",
    "deliveryFee": 500,
    "notes": "Leave at door"
  }'
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "trackingCode": "DEL-A1B2C3D4",
  "status": "pending",
  "medicationRequestId": "507f1f77bcf86cd799439011",
  "pharmacyId": "...",
  "patientId": "507f1f77bcf86cd799439012",
  "deliveryAddress": "123 Patient Street",
  "deliveryCity": "Alger",
  "deliveryPostalCode": "16000",
  "gpsLatitude": 36.7372,
  "gpsLongitude": 3.0869,
  "estimatedDeliveryTime": "2024-02-23T14:00:00Z",
  "deliveryFee": 500,
  "notes": "Leave at door",
  "createdAt": "2024-02-22T23:34:36Z",
  "updatedAt": "2024-02-22T23:34:36Z"
}
```

Save the `_id` and `trackingCode` for tracking.

---

### 5. Track Delivery

```bash
curl -X GET http://localhost:3000/deliveries/tracking/DEL-A1B2C3D4 \
  -H "Authorization: Bearer {accessToken}"
```

---

### 6. Update Delivery Status

```bash
curl -X PUT http://localhost:3000/deliveries/507f1f77bcf86cd799439013/status \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_transit",
    "driverInfo": {
      "driverId": "driver123",
      "driverName": "Ahmed Ben Ali",
      "driverPhone": "+213612345678"
    }
  }'
```

**Status Flow:**
- `pending` → `accepted` → `in_transit` → `delivered`
- Any status → `cancelled`

---

### 7. Get Pharmacy Deliveries

```bash
curl -X GET http://localhost:3000/deliveries/pharmacy/list \
  -H "Authorization: Bearer {accessToken}"
```

---

### 8. Create Notification (Internal)

```bash
curl -X POST http://localhost:3000/notifications \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439012",
    "type": "DELIVERY_STATUS",
    "title": "Votre livraison est en route",
    "message": "Votre commande sera livrée dans 30 minutes",
    "relatedId": "507f1f77bcf86cd799439013",
    "data": {
      "trackingCode": "DEL-A1B2C3D4",
      "estimatedTime": "2024-02-23T14:30:00Z"
    }
  }'
```

---

### 9. Get Notifications

```bash
curl -X GET "http://localhost:3000/notifications?limit=20&skip=0" \
  -H "Authorization: Bearer {accessToken}"
```

---

### 10. Get Unread Notifications Count

```bash
curl -X GET http://localhost:3000/notifications/unread/count \
  -H "Authorization: Bearer {accessToken}"
```

**Response:**
```json
{
  "unreadCount": 5
}
```

---

### 11. Mark Notification as Read

```bash
curl -X PUT http://localhost:3000/notifications/507f1f77bcf86cd799439014/read \
  -H "Authorization: Bearer {accessToken}"
```

---

### 12. Mark All Notifications as Read

```bash
curl -X PUT http://localhost:3000/notifications/read-all \
  -H "Authorization: Bearer {accessToken}"
```

---

## Postman Collection

You can import these requests into Postman for easier testing. Create a new collection and add the requests above.

### Environment Variables
```json
{
  "baseUrl": "http://localhost:3000",
  "accessToken": "{{token_from_login}}"
}
```

---

## Common Errors

### 401 Unauthorized
- Token is missing or expired
- Solution: Login again and get a new token

### 403 Forbidden
- User role doesn't have permission
- Solution: Use correct role (PHARMACIE for delivery endpoints)

### 400 Bad Request
- Invalid request body
- Solution: Check field names and types

### 404 Not Found
- Resource doesn't exist
- Solution: Check if ID is correct

---

## Next Steps

1. **Frontend Integration**: Connect Flutter app to these endpoints
2. **Real-time Updates**: Add WebSocket for live delivery tracking
3. **Email Notifications**: Integrate email service
4. **SMS Notifications**: Integrate SMS provider
5. **Analytics**: Add delivery metrics dashboard

---

## Support

For issues, check the logs:
```bash
# View backend logs
npm run start
```

For API documentation, visit: `http://localhost:3000/api`
