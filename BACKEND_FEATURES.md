# Backend Features Documentation

## Overview
This document describes the new features added to the MedAIChain backend to support delivery services, notifications, and password management.

---

## 1. Delivery Service Module

### Overview
The delivery service enables pharmacies to manage medication deliveries to patients.

### Features
- Create delivery orders
- Track deliveries by tracking code
- Update delivery status (pending → accepted → in_transit → delivered)
- Assign drivers to deliveries
- Cancel deliveries with reason
- Get delivery history by pharmacy or patient

### API Endpoints

#### Create Delivery
```
POST /deliveries
Authorization: Bearer {token}
Role: PHARMACIE

Body:
{
  "medicationRequestId": "string",
  "patientId": "string",
  "deliveryAddress": "string",
  "deliveryCity": "string",
  "deliveryPostalCode": "string",
  "gpsLatitude": number,
  "gpsLongitude": number,
  "estimatedDeliveryTime": "2024-02-22T10:00:00Z",
  "deliveryFee": number,
  "notes": "string (optional)"
}

Response:
{
  "_id": "string",
  "trackingCode": "DEL-XXXXXXXX",
  "status": "pending",
  "medicationRequestId": "string",
  "pharmacyId": "string",
  "patientId": "string",
  "deliveryAddress": "string",
  "deliveryCity": "string",
  "deliveryPostalCode": "string",
  "gpsLatitude": number,
  "gpsLongitude": number,
  "estimatedDeliveryTime": "2024-02-22T10:00:00Z",
  "deliveryFee": number,
  "notes": "string",
  "createdAt": "2024-02-22T09:00:00Z",
  "updatedAt": "2024-02-22T09:00:00Z"
}
```

#### Get Delivery Details
```
GET /deliveries/:id
Authorization: Bearer {token}

Response: Delivery object
```

#### Track Delivery by Code
```
GET /deliveries/tracking/:trackingCode
Authorization: Bearer {token}

Response: Delivery object with tracking information
```

#### Get Pharmacy Deliveries
```
GET /deliveries/pharmacy/list
Authorization: Bearer {token}
Role: PHARMACIE

Response: Array of Delivery objects
```

#### Get Patient Deliveries
```
GET /deliveries/patient/list
Authorization: Bearer {token}
Role: PATIENT

Response: Array of Delivery objects
```

#### Update Delivery Status
```
PUT /deliveries/:id/status
Authorization: Bearer {token}
Role: PHARMACIE

Body:
{
  "status": "accepted|in_transit|delivered|cancelled",
  "driverInfo": {
    "driverId": "string",
    "driverName": "string",
    "driverPhone": "string"
  }
}

Response: Updated Delivery object
```

#### Cancel Delivery
```
PUT /deliveries/:id/cancel
Authorization: Bearer {token}
Role: PHARMACIE

Body:
{
  "reason": "string"
}

Response: Cancelled Delivery object
```

### Delivery Status Flow
```
pending → accepted → in_transit → delivered
                  ↓
              cancelled
```

### Database Schema
```typescript
{
  medicationRequestId: ObjectId,
  pharmacyId: ObjectId,
  patientId: ObjectId,
  status: "pending|accepted|in_transit|delivered|cancelled",
  deliveryAddress: string,
  deliveryCity: string,
  deliveryPostalCode: string,
  gpsLatitude: number,
  gpsLongitude: number,
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,
  deliveryFee: number,
  notes: string,
  driverId: string,
  driverName: string,
  driverPhone: string,
  trackingCode: string,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 2. Notification Service Module

### Overview
The notification service manages in-app notifications for all users.

### Features
- Create notifications for users
- Retrieve notifications with pagination
- Mark notifications as read
- Get unread notification count
- Delete notifications
- Filter notifications by type
- Support for multiple notification types

### Notification Types
- `DELIVERY_STATUS` - Delivery status updates
- `PRESCRIPTION_UPDATE` - Prescription status changes
- `PHARMACY_MESSAGE` - Messages from pharmacies
- `SYSTEM_ALERT` - System alerts
- `APPOINTMENT` - Appointment reminders
- `PAYMENT` - Payment notifications

### API Endpoints

#### Get Notifications
```
GET /notifications?limit=20&skip=0
Authorization: Bearer {token}

Response:
[
  {
    "_id": "string",
    "userId": "string",
    "type": "delivery_status|prescription_update|pharmacy_message|system_alert|appointment|payment",
    "title": "string",
    "message": "string",
    "relatedId": "string",
    "isRead": boolean,
    "readAt": Date,
    "data": {},
    "createdAt": Date,
    "updatedAt": Date
  }
]
```

#### Get Unread Notifications
```
GET /notifications/unread
Authorization: Bearer {token}

Response: Array of unread Notification objects
```

#### Get Unread Count
```
GET /notifications/unread/count
Authorization: Bearer {token}

Response:
{
  "unreadCount": number
}
```

#### Mark as Read
```
PUT /notifications/:id/read
Authorization: Bearer {token}

Response: Updated Notification object
```

#### Mark All as Read
```
PUT /notifications/read-all
Authorization: Bearer {token}

Response:
{
  "modifiedCount": number
}
```

#### Delete Notification
```
DELETE /notifications/:id
Authorization: Bearer {token}

Response: Deleted Notification object
```

#### Delete All Notifications
```
DELETE /notifications
Authorization: Bearer {token}

Response:
{
  "modifiedCount": number
}
```

### Database Schema
```typescript
{
  userId: ObjectId,
  type: "delivery_status|prescription_update|pharmacy_message|system_alert|appointment|payment",
  title: string,
  message: string,
  relatedId: string,
  isRead: boolean,
  readAt: Date,
  data: Record<string, any>,
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 3. Change Password Feature

### Overview
Users can change their password from the profile page.

### API Endpoint

#### Change Password
```
POST /auth/change-password
Authorization: Bearer {token}

Body:
{
  "currentPassword": "string",
  "newPassword": "string"
}

Response:
{
  "message": "Mot de passe changé avec succès"
}

Errors:
- 401: Mot de passe actuel incorrect
- 400: Le nouveau mot de passe doit être différent du mot de passe actuel
```

### Validation Rules
1. Current password must be correct
2. New password must be different from current password
3. New password must meet security requirements (handled by frontend)

---

## 4. Pharmacy Profile Enhancements

### New Fields Added
The pharmacy profile schema now includes notification preferences:

```typescript
{
  // Existing fields...
  
  // New delivery-related fields
  deliveryFee: number,           // Default delivery fee
  
  // New notification preferences
  notificationsEnabled: boolean,
  emailNotifications: boolean,
  smsNotifications: boolean,
  deliveryNotifications: boolean,
  prescriptionNotifications: boolean
}
```

### Update Pharmacy Profile
```
PUT /profiles/pharmacy
Authorization: Bearer {token}
Role: PHARMACIE

Body:
{
  "pharmacyName": "string",
  "ownerName": "string",
  "licenseNumber": "string",
  "address": "string",
  "city": "string",
  "wilaya": "string",
  "hasDelivery": boolean,
  "deliveryRadius": number,
  "deliveryFee": number,
  "notificationsEnabled": boolean,
  "emailNotifications": boolean,
  "smsNotifications": boolean,
  "deliveryNotifications": boolean,
  "prescriptionNotifications": boolean
}

Response: Updated PharmacyProfile object
```

---

## Integration Guide

### 1. Enable Delivery Service in Pharmacy
When a pharmacy wants to enable delivery service:

```javascript
// Frontend call
PUT /profiles/pharmacy
{
  "hasDelivery": true,
  "deliveryRadius": 5,  // km
  "deliveryFee": 500    // in local currency
}
```

### 2. Create Delivery Order
When a prescription is ready for delivery:

```javascript
// Backend call
POST /deliveries
{
  "medicationRequestId": "prescription_id",
  "patientId": "patient_id",
  "deliveryAddress": "patient_address",
  "deliveryCity": "city",
  "deliveryPostalCode": "postal_code",
  "gpsLatitude": 36.7372,
  "gpsLongitude": 3.0869,
  "estimatedDeliveryTime": "2024-02-22T14:00:00Z",
  "deliveryFee": 500
}
```

### 3. Send Notification
When delivery status changes:

```javascript
// Backend call (internal)
POST /notifications (internal service)
{
  "userId": "patient_id",
  "type": "DELIVERY_STATUS",
  "title": "Votre livraison est en route",
  "message": "Votre commande sera livrée dans 30 minutes",
  "relatedId": "delivery_id",
  "data": {
    "trackingCode": "DEL-XXXXXXXX",
    "estimatedTime": "2024-02-22T14:30:00Z"
  }
}
```

### 4. Change Password
User changes password from profile page:

```javascript
// Frontend call
POST /auth/change-password
{
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

---

## Error Handling

### Common Errors

#### 401 Unauthorized
- Invalid or expired token
- Incorrect current password
- User not found

#### 400 Bad Request
- Invalid delivery status
- New password same as current password
- Missing required fields

#### 404 Not Found
- Delivery not found
- Notification not found
- User not found

#### 409 Conflict
- Duplicate email or phone during registration

---

## Security Considerations

1. **Password Hashing**: All passwords are hashed using bcryptjs with 10 salt rounds
2. **JWT Authentication**: All endpoints require valid JWT token
3. **Role-Based Access**: Delivery and notification endpoints check user roles
4. **Data Validation**: All inputs are validated before processing
5. **Sensitive Data**: Passwords and tokens are never returned in responses

---

## Testing

### Test Delivery Service
```bash
# Create delivery
curl -X POST http://localhost:3000/deliveries \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{...}'

# Track delivery
curl -X GET http://localhost:3000/deliveries/tracking/DEL-XXXXXXXX \
  -H "Authorization: Bearer {token}"

# Update status
curl -X PUT http://localhost:3000/deliveries/{id}/status \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"status": "in_transit"}'
```

### Test Notification Service
```bash
# Get notifications
curl -X GET http://localhost:3000/notifications \
  -H "Authorization: Bearer {token}"

# Mark as read
curl -X PUT http://localhost:3000/notifications/{id}/read \
  -H "Authorization: Bearer {token}"

# Get unread count
curl -X GET http://localhost:3000/notifications/unread/count \
  -H "Authorization: Bearer {token}"
```

### Test Change Password
```bash
# Change password
curl -X POST http://localhost:3000/auth/change-password \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "old_password",
    "newPassword": "new_password"
  }'
```

---

## Future Enhancements

1. **Real-time Notifications**: WebSocket integration for real-time delivery updates
2. **SMS Notifications**: Integration with SMS provider
3. **Email Notifications**: Enhanced email templates
4. **Delivery Analytics**: Dashboard for delivery metrics
5. **Driver Management**: Full driver management system
6. **Payment Integration**: Online payment for delivery fees
7. **Rating System**: Customer ratings for deliveries
8. **Scheduled Deliveries**: Allow customers to schedule delivery times

---

## Support

For issues or questions, please contact the development team.
