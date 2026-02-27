# 🔥 Valeurs à Ajouter dans .env pour Firebase

## 📝 Variables d'Environnement Firebase

Ajoutez ces lignes à la fin de votre fichier `.env` :

```env
# Firebase Cloud Messaging
FCM_PROJECT_ID=medaichain
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEuwIBADANBgkqhkiG9w0BAQEFAASCBKUwggShAgEAAoIBAQCjd2kDjfoN73QD\nYw7a3XQ4TYZZ9qvAkX9f7jRx137L9QX7rVv1K85DlZoflIq6RXXtwnbwx5Ajpj5u\nopH4YZhOwjEyZqHLyNF9+u+oaBEKt2HGbNOCwUXsftvS8CFmad6p8ba2YSGUxIlD\n+tBhITzYMY74NQ9IFh/gLC2VbHO1utD5ZEh7J6YoHyb6q0UW4r1x4Dwy0omrCXnL\nxHDWrsSY2f9zZzm/i3zGHiaJ8KfkfMrj9EsB+X9gBIxfNvyb+EaR7l8n5DaWO0o3\nZ37a4L/Oyv4jXgLk0pIhTGURvG8VSPo5S+/f/4UA7X/Qtz5MDzwaPVsMA42Ub6IE\nsvtGi4XDAgMBAAECgf8U9eHEGHuTpukBsrH9SDup8WhI0vQ+ITJVaJoZTMtZnov5\nVW3kfIz2ShcrQ2ZZ9qRrR5p+UHy7vHQCKwLlqfcKOI5vbZgwJRWAEe/3ATSSYtsQ\ndRBnOVYL5up1kR1TGsXAUsPB7PVLHistzxzS6EOiPYDrGxpJ1h0e2T1uZf84pxgA\nHfYtHDLcy4nCLU2Yv4QbRK9ac7gaqpgnYcAyjo753NxAzW0rU0hkIEO6zKS/87MD\nqAyOYzwIuZ1/Utc2nzi/ORwp65dKVVh2b3U0p1AUQaU+tILj+DY/gSFLcXiGjtkh\n4/2q0jG1MjAw51GO0IYvw14zH2/4/3hwxLV9doECgYEA03mhO+QtecqicFZFjK1l\nmFnOlGBdzfKxL61uk/C32nZDhTEjAEG7fir+ofY22aLLDMu2qDXNWddja+zkk/bX\n2hqvNAXk1cfWQ5Na43kLz8K0dkWC2Gh2Ey/8lai+eZMpM8nRij2meSwGGuLHedHH\nisO4Ceyj/9Vk66igNF3HrwMCgYEAxeIk/3PVANaVu3rhAF2Pl9EwcSFoo7dfY0Fy\nElydRJSfNo7QYxRDJRkfJsMJSiSjDQXeimvcZrzSp1u9+KHblwZB+q4jMr61g1Cm\nfPPIFAoFsLbXTYMfV5u0R1AtOToEG5V1BxcZXSdOmt//Hs1U9Hc0XJoFI4za1osJ\neUe4skECgYEAtNSEspni6QoE7NpYjnqXLTdeFjJxA/JK4OIEdCyaigwmoHXr4ARV\nNwW8xvGq5V73EfIANsYK2o/7TAY9Tuj8mlvHBU0k6EkBRrdyOKEBIJ71gUzfHf31\nOWMHMVIhzgOwb8BblUIyX9rtPYA94kUnw9ioPpRDiDgJHBoNI7otTdECgYBXSctC\nN+k0pnOEMM8Bp0PJF0jEDpWm6iOUl/Dmsp3Y+6pDmbnIis6Xlb5NDemSIBkgjH8/\nFhcx5ocRtgFVpKhFtUfzeU8jekZ9N11JbwvJ8yXRbsYIdhekQJXEg1R/ktzvAf2O\ndB0HH2ioHrjd8HtSHyck1fgAV4jM7KXwLrgFQQKBgC97o8JL+Y0WhUAFzmltInFo\nKY9Zj/oDvffzKrtNs4SgnZV0Gtqe/py2JfvRwDQrydvSD+w4hP01bCwlfuY0qRAE\nXJmgpFQ+k/HqolGf1lvOaonGWYE8ja0s1OE1Ar+GUdLNOWhWoOCbmE8o1JNBXwKw\ngeMnVOwuNSASIPOdq09i\n-----END PRIVATE KEY-----\n"
FCM_CLIENT_EMAIL=firebase-adminsdk-fbsvc@medaichain.iam.gserviceaccount.com
```

## ⚠️ Instructions Importantes

1. **Copier exactement** ces valeurs dans votre fichier `.env`
2. **Ne pas modifier** la clé privée (garder les `\n` et les guillemets)
3. **Vérifier** que le fichier `.env` est bien à la racine du projet
4. **Redémarrer** le serveur après avoir ajouté ces variables

## ✅ Vérification

Après avoir ajouté ces variables, redémarrez le serveur et vérifiez les logs :

```
[PushNotificationService] Firebase Admin SDK initialisé avec succès
```

Si vous voyez cette ligne, Firebase est correctement configuré ! 🎉

---

**Note de sécurité :** Ne jamais partager ce fichier ou ces credentials publiquement. Le fichier `.env` est déjà dans `.gitignore`.
