# 📱 Panda Mobile Vault (iOS & Android)

A native mobile client for **Panda Digital Vault** built with **React Native**, **Expo Router**, and **NativeWind (Tailwind CSS)**.

---

## 🔒 Security & Architecture

* **Identical Backend Pipeline:** The mobile app communicates strictly via HTTPS with your hosted Next.js backend (`/api/*`). It never connects directly to PostgreSQL.
* **Hardware-Backed Session Storage:** Tokens are securely stored using `expo-secure-store` (**Apple Keychain** on iOS and **Android Keystore** on Android).
* **Biometric Lock:** Unlock your vault instantly with **Face ID**, **Touch ID**, or **Android Fingerprint**.
* **Zero-Knowledge AES-256-GCM:** Password and secret payloads are encrypted on the client device before transmission.

---

## 🚀 Quick Start (Testing on Your Phone in 60 Seconds)

### 1. Install Dependencies
Open terminal in this `PandaMobile` directory:
```bash
npm install
```

### 2. Download the Expo Go App on Your Phone
* **Android:** Download [Expo Go on Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
* **iPhone:** Download [Expo Go on App Store](https://apps.apple.com/app/expo-go/id982107779)

### 3. Start the Development Server
```bash
npx expo start
```

### 4. Scan & Run
* On **Android**: Open the **Expo Go** app and tap **"Scan QR Code"**.
* On **iPhone**: Open the default **Camera** app and tap the prompt to open in Expo Go.

The app will load on your physical phone with **live instant reloading**!

---

## ⚙️ Connecting to Your Backend

1. When you open the app, tap **"Backend Server Settings"** on the login screen (or navigate to **Settings &rarr; Backend API Host**).
2. Enter your hosted Next.js URL (e.g., `https://your-backend.vercel.app` or your local WiFi IP `http://192.168.x.x:3000`).
3. Log in with your Panda account credentials.

---

## 📁 Directory Layout

```
PandaMobile/
├── app/
│   ├── _layout.jsx          # Root layout with AuthProvider & Biometric Lock
│   ├── index.jsx            # Entry router
│   ├── (auth)/
│   │   └── login.jsx        # Login & Vault Creation Screen
│   └── (tabs)/
│       ├── _layout.jsx      # High-gloss translucent bottom tab bar
│       ├── dashboard.jsx    # Overview, Storage Meter, Quick Actions
│       ├── vault.jsx        # Passwords, Credit Cards, Secure Notes (AES Decryption)
│       ├── media.jsx        # Encrypted Media Library
│       ├── storage.jsx      # Multi-Cloud Storage Hub (S3, B2, R2, Wasabi)
│       └── settings.jsx     # Face ID Toggle, Backend Host, Sign Out
├── components/
│   ├── ui/                  # Button, Input, Card, Progress, PandaLogo
│   └── layout/              # ScreenWrapper (Safe area insets)
├── context/
│   └── AuthContext.jsx      # State, tokens, & biometric security
├── services/
│   ├── api.js               # Centralized backend HTTP client
│   ├── biometrics.js        # Face ID / Fingerprint handler
│   └── secureStore.js       # Hardware Keystore helper
├── tailwind.config.js       # NativeWind Tailwind styles
└── app.json                 # Expo configuration & permissions
```
