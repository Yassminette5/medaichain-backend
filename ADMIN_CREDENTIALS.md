# Admin Account Credentials

## Default Test Accounts

The following test accounts are automatically created when the backend starts:

### Admin Account
- **Email:** `admin@test.com`
- **Password:** `password123`
- **Role:** Admin
- **Phone:** +213555000001

### Pharmacy Account
- **Email:** `pharmacy@test.com`
- **Password:** `password123`
- **Role:** Pharmacie
- **Phone:** +213555000002

### Doctor Account
- **Email:** `doctor@test.com`
- **Password:** `password123`
- **Role:** Medecin
- **Phone:** +213555000003

## How It Works

The `SeedService` automatically creates these test users when the backend starts:
- Located in: `src/auth/seed.service.ts`
- Runs on module initialization (`onModuleInit`)
- Checks if users exist before creating them
- Passwords are hashed using bcrypt

## Usage

### Admin Login (Web Interface)
1. Navigate to the admin login page
2. Enter email: `admin@test.com`
3. Enter password: `password123`
4. Click "Se connecter"

### API Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password123"}'
```

## Security Notes

⚠️ **IMPORTANT:** These are test credentials for development only!

For production:
1. Remove or disable the SeedService
2. Create admin accounts manually with strong passwords
3. Use environment variables for sensitive data
4. Enable 2FA for admin accounts
5. Implement proper role-based access control

## Files Modified

1. `src/users/schemas/user.schema.ts` - Added ADMIN role to UserRole enum
2. `src/auth/seed.service.ts` - Created seed service for test users
3. `src/auth/auth.module.ts` - Added SeedService to providers

## Starting the Backend

```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

The seed service will automatically create the test users on startup.
Check the console for confirmation messages:
- ✅ Test user created: admin@test.com
- ✅ Test user created: pharmacy@test.com
- ✅ Test user created: doctor@test.com

Or if they already exist:
- ℹ️  Test user already exists: admin@test.com
