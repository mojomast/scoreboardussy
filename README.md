# Scoreboardussy 🏆

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)  
[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D18-brightgreen.svg)](https://nodejs.org/)  
[![React](https://img.shields.io/badge/Frontend-React-blue.svg)](https://reactjs.org/)  
[![Express.js](https://img.shields.io/badge/Backend-Express.js-lightgrey.svg)](https://expressjs.com/)
 
[Version Française](#version-française-)

**Scoreboardussy** is a real-time, web-based scoreboard designed specifically for improv shows, providing dynamic score tracking and audience interaction features — with a separate control panel and audience display.

---

## ✨ Features

- Real-time updates via WebSockets (Socket.IO)
- Separate control panel and display views
- Customizable teams, titles, and colors
- Logo upload
- Major/minor penalty tracking
- Crowd voting emoji display
- English and French support
- Fullscreen and responsive design (Tailwind CSS)

---

## 🛠️ Tech Stack

**Frontend:** React, Vite, TypeScript, Tailwind CSS, Shadcn/UI, i18next  
**Backend:** Node.js, Express, Socket.IO, TypeScript

---

## 🚀 Getting Started

### Prerequisites

- **Node.js v18+** ([Download here](https://nodejs.org/))
- **IMPORTANT:** Node.js includes `npm` (Node Package Manager). Both Node.js and `npm` **must** be installed correctly and accessible in your system's PATH for the installation and launch scripts to work.

---

### 1. Install & Launch (Development Mode)

Run the app locally for testing and editing.

```bash
git clone https://github.com/mojomast/scoreboardussy
cd scoreboardussy

# Linux/macOS
chmod +x install_deps.sh launch.sh
*(Note: If Node.js/npm are not found, the scripts will offer to install them using `apt`, suitable for Debian/Ubuntu-based systems. Requires `sudo`.)*
./install_deps.sh
./launch.sh

# Windows
install_deps.bat
launch.bat
```

Then open:

- **Control Panel:** http://localhost:5173/#/control  
- **Scoreboard Display:** http://localhost:5173/  
- **Backend API:** http://localhost:3001/

---

### 2. Deploying on a Local Network

Use this mode to run the scoreboard from one computer and access it from other devices on the same Wi-Fi or Ethernet network.

#### Build and Start (Production Mode)

```bash
# Linux/macOS
chmod +x build.sh start_prod.sh
*(Note: If Node.js/npm are not found, the scripts will offer to install them using `apt`, suitable for Debian/Ubuntu-based systems. Requires `sudo`.)*
./build.sh
./start_prod.sh

# Windows
build.bat
start_prod.bat
```

This starts the server on `http://<your-ip>:3001`

#### Access from Other Devices

1. Find your machine’s local IP (e.g., `192.168.1.42`)
2. Open on other devices:
   - `http://192.168.1.42:3001/` (Display View)
   - `http://192.168.1.42:3001/#/control` (Control Panel)
3. Ensure firewall allows incoming connections on port `3001`

---

### 3. Optional: Accessing Over the Internet

For advanced users, you **can** expose the app to the internet using:

- **Port forwarding** on your router
- A reverse proxy like **NGINX**
- A tunneling tool like **[ngrok](https://ngrok.com/)** or **[Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)**

> ⚠️ We do not recommend direct internet exposure from a personal device. Use a secure hosting provider (like Render, Railway, or a VPS) for public deployment.

---

## 📸 Screenshots

![scoreboard](Screenshot%202025-05-05%20222028.png) ![control interface](Screenshot%202025-05-05%20222019.png) 

---

## 📂 Project Structure

<details>
<summary>Click to expand</summary>

```
scoreboardussy/
├── client/                   # React frontend (Vite)
│   ├── public/               # Static assets (favicons, logos, etc.)
│   ├── src/                  # Source files (TypeScript + React)
│   │   ├── components/       # Reusable React components
│   │   ├── contexts/         # Global state contexts
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utility functions
│   │   ├── styles/           # Tailwind and global styles
│   │   ├── App.tsx           # Main app component with routes
│   │   ├── main.tsx          # Entry point for React app
│   │   └── i18n.ts           # Internationalization setup
│   ├── tailwind.config.js    # Tailwind CSS config
│   ├── vite.config.ts        # Vite configuration
│   └── tsconfig.json         # TypeScript configuration for client
├── server/                   # Node.js backend (Express + Socket.IO)
│   ├── src/
│   │   ├── server.ts         # Express app and Socket.IO logic
│   │   ├── state.ts          # In-memory scoreboard state
│   │   └── types.ts          # Shared type definitions
│   └── tsconfig.json         # TypeScript config for backend
├── scripts/                  # Convenience shell and batch scripts
│   ├── install_deps.sh/bat   # Install all dependencies
│   ├── launch.sh/bat         # Start dev servers
│   ├── build.sh/bat          # Build production files
│   └── start_prod.sh/bat     # Run production server
├── package.json              # Root workspace and script runner
├── package-lock.json         # Dependency lock file
└── README.md                 # Project documentation
```

</details>

---

## 🧪 Notes for Usage

- Live updates are pushed automatically via WebSockets.
- Language can be switched from the control panel.
- Display view supports fullscreen (great for projectors or monitors).
- Fully responsive layout (mobile-friendly for control panel use).

---

## 📜 License

MIT — see the [LICENSE](LICENSE) file.

---

# Version Française 🇫🇷

**Scoreboardussy** est un tableau de pointage web en temps réel conçu spécifiquement pour les spectacles d'improvisation, offrant un suivi dynamique des scores et des fonctionnalités d'interaction avec le public — avec un panneau de contrôle et un affichage public distincts.

---

## ✨ Fonctionnalités

- Mises à jour en temps réel via WebSockets (Socket.IO)
- Panneau de contrôle et affichage public séparés
- Équipes, titres et couleurs personnalisables
- Téléchargement de logo
- Suivi des pénalités majeures/mineures
- Affichage des emojis de vote du public
- Support anglais et français
- Conception plein écran et adaptative (Tailwind CSS)

---

## 🛠️ Pile Technique

**Frontend :** React, Vite, TypeScript, Tailwind CSS, Shadcn/UI, i18next  
**Backend :** Node.js, Express, Socket.IO, TypeScript

---

## 🚀 Démarrage Rapide

### Prérequis

- **Node.js v18+** ([Télécharger ici](https://nodejs.org/))
- **IMPORTANT:** Node.js includes `npm` (Node Package Manager). Both Node.js and `npm` **must** be installed correctly and accessible in your system's PATH for the installation and launch scripts to work.

---

### 1. Installation & Lancement (Mode Développement)

Exécutez l'application localement pour les tests et modifications.

```bash
git clone <repository-url>
cd scoreboardussy

# Linux/macOS
chmod +x install_deps.sh launch.sh
*(Note : Si Node.js/npm ne sont pas trouvés, les scripts proposeront de les installer via `apt`, adapté aux systèmes basés sur Debian/Ubuntu. Nécessite `sudo`.)*
./install_deps.sh
./launch.sh

# Windows
install_deps.bat
launch.bat
```

Ensuite, ouvrez :

- **Panneau de Contrôle :** http://localhost:5173/#/control  
- **Affichage du Scoreboard :** http://localhost:5173/  
- **API Backend :** http://localhost:3001/

---

### 2. Déploiement sur un Réseau Local

Utilisez ce mode pour exécuter le tableau de pointage depuis un ordinateur et y accéder depuis d'autres appareils sur le même réseau Wi-Fi ou Ethernet.

#### Build et Démarrage (Mode Production)

```bash
# Linux/macOS
chmod +x build.sh start_prod.sh
*(Note : Si Node.js/npm ne sont pas trouvés, les scripts proposeront de les installer via `apt`, adapté aux systèmes basés sur Debian/Ubuntu. Nécessite `sudo`.)*
./build.sh
./start_prod.sh

# Windows
build.bat
start_prod.bat
```

Ceci démarre le serveur sur `http://<votre-ip>:3001`

#### Accès depuis d'Autres Appareils

1. Trouvez l'IP locale de votre machine (ex: `192.168.1.42`)
2. Ouvrez sur les autres appareils :
   - `http://192.168.1.42:3001/` (Affichage)
   - `http://192.168.1.42:3001/#/control` (Panneau de Contrôle)
3. Assurez-vous que votre pare-feu autorise les connexions entrantes sur le port `3001`

---

### 3. Optionnel : Accès via Internet

Pour les utilisateurs avancés, vous **pouvez** exposer l'application à Internet en utilisant :

- La **redirection de port** sur votre routeur
- Un proxy inverse comme **NGINX**
- Un outil de tunnel comme **[ngrok](https://ngrok.com/)** ou **[Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)**

> ⚠️ Nous ne recommandons pas l'exposition directe à Internet depuis un appareil personnel. Utilisez un hébergeur sécurisé (comme Render, Railway, ou un VPS) pour un déploiement public.

---

## 🧪 Notes d'Utilisation

- Les mises à jour en direct sont poussées automatiquement via WebSockets.
- La langue peut être changée depuis le panneau de contrôle.
- L'affichage supporte le mode plein écran (idéal pour projecteurs ou moniteurs).
- Disposition entièrement adaptative (conviviale pour l'utilisation du panneau de contrôle sur mobile).

---

## 📜 Licence

MIT — voir le fichier [LICENSE](LICENSE).

---
