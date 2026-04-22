# Scoreboardussy 🏆

Version 0.5.6-beta

[0.5-beta Release Notes and Deployment](README-0.5beta.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)  
[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D18-brightgreen.svg)](https://nodejs.org/)  
[![React](https://img.shields.io/badge/Frontend-React-blue.svg)](https://reactjs.org/)  
[![Express.js](https://img.shields.io/badge/Backend-Express.js-lightgrey.svg)](https://expressjs.com/)  
[![CI](https://github.com/mojomast/scoreboardussy/actions/workflows/ci.yml/badge.svg)](https://github.com/mojomast/scoreboardussy/actions/workflows/ci.yml)
 
[Version Française](#version-française-)

## 🌐 Hosted Demo

A public demo is coming soon. URL TBD.

---

**Scoreboardussy** is a real-time, web-based scoreboard designed specifically for improv shows, providing dynamic score tracking and audience interaction features — with a separate control panel and audience display.

---

## ✨ Features

0.5-beta highlights
- Mon-Pacing integration with QR-based linking and interop endpoints (/qr, /match, /timer)
- Real-time match timers with server-authoritative updates (100ms)
- LAN-friendly startup scripts and a Windows standalone launcher
- Control UI toggle for showing the Mon-Pacing QR overlay on the display

- Real-time updates via WebSockets (Socket.IO)
- Separate control panel and display views
- Customizable teams, titles, and colors
- Logo upload
- Major/minor penalty tracking
- Audience voting (start/stop votes, cast via API; optional auto-award to winner)
- Crowd voting emoji display
- English and French support
- Fullscreen and responsive design (Tailwind CSS)

---

## 🛠️ Tech Stack

**Frontend:** React, Vite, TypeScript, Tailwind CSS, Shadcn/UI, i18next  
**Backend:** Node.js, Express, Socket.IO, TypeScript

---

## 🚀 Quick Deploy

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed instructions on self-hosting with Docker, Railway, Fly.io, and SSL/Caddy setup.

---

## 💰 Free vs Pro

| Feature | Free | Pro |
|---------|------|-----|
| Active rooms | Up to 3 | Unlimited |
| Spectators per room | 20 | 500 |
| Room TTL | 2 hours | 24 hours |
| Custom branding | — | Yes |

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

Standalone (Windows)
- Download the latest 0.5.4-beta release assets: ImprovScoreboard.exe and Start-Scoreboard.ps1
- Keep both files together, then run Start-Scoreboard.ps1 (right-click → Run with PowerShell)
  - Auto-detects your LAN IP and starts the server bound to it
  - Opens Control UI in your browser
  - Optional params: -Ip 192.168.1.68 -Port 3001 -NoBrowser

Manual (Node production)

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

![scoreboard](docs/screenshots/Screenshot%202025-05-05%20222028.png) ![control interface](docs/screenshots/Screenshot%202025-05-05%20222019.png) 

---

## 📂 Project Structure

<details>
<summary>Click to expand</summary>

```
scoreboardussy/
├── client/                         # React frontend (Vite + TS)
│   ├── public/                     # Static assets
│   ├── src/
│   │   ├── components/             # UI split by domain
│   │   │   ├── rounds/
│   │   │   ├── teams/
│   │   │   ├── scoreboard/
│   │   │   └── ui/
│   │   ├── contexts/               # Global state (with tests in __tests__/)
│   │   ├── utils/                   # Client utilities (e.g., socket manager)
│   │   ├── App.tsx                  # Routes and layout
│   │   └── main.tsx                 # React entrypoint
│   ├── jest.config.cjs              # Jest config (JS)
│   ├── vite.config.ts               # Vite config
│   └── tsconfig.json                # Client TS config
├── server/                         # Node backend (Express + Socket.IO + TS)
│   ├── data/                        # Persisted scoreboard data (JSON)
│   │   └── scoreboard.json
│   ├── src/
│   │   ├── modules/                 # Modularized server logic
│   │   │   ├── api/                 # Express routes
│   │   │   ├── export/              # Reports/exports
│   │   │   └── state/               # App state (rounds/, team.ts, ui.ts)
│   │   │       └── rounds/
│   │   ├── types/                   # Typed events and payloads
│   │   └── server.ts                # App entry (wires modules)
│   └── tsconfig.json                # Server TS config
├── test_all.ps1                     # Convenience test runner (Windows)
├── test_api.ps1                     # API tests (Windows)
├── test_websocket.ps1               # WebSocket tests (Windows)
├── install_deps.sh / .bat           # Install dependencies
├── launch.sh / .bat                 # Start dev servers
├── build.sh / .bat                  # Build production files
├── start_prod.sh / .bat             # Run production server
├── package.json                     # Root scripts/workspace
├── package-lock.json                # Dependency lock
└── README.md                        # Project documentation
```

</details>

### 🧰 What Changed (0.5-beta)

- Mon-Pacing interop: QR overlay, /api/interop/mon-pacing/qr → { url, id, token }, and endpoints /match, /timer (legacy /event kept)
- Server serves client/dist in production and binds to 0.0.0.0 for LAN access
- New Windows standalone launcher (ImprovScoreboard.exe + Start-Scoreboard.ps1)
- LAN-aware production start script (scripts/start-server-prod.ps1) with auto-open browser
- Real-time match scaffolding (state manager, timers, socket handlers)
- Design docs and Referee Quickstart for setup and usage

- New dockable Settings panel with toggle in header; can view Settings side-by-side with Teams/Rounds
- Modular Settings includes Scoring Mode (Round/Manual) and Restart Match, and excludes lifecycle controls
- CurrentRound planning: Enqueue and Next Round Draft. New Round ad‑hoc form is now only visible in Manual mode
- Auto-advance backend logic: after End Round in Round mode, server dequeues the next upcoming round (if any) and starts it; falls back to saved draft
- Build-check banner added to server startup logs to verify you’re running the new build
- Various UI fixes: team name Update button moved below input, equal-width team panels, minor layout polish
- Bugfixes and robustness improvements across client and server

### 🧰 What Changed (Modularization)

- Client components split by domain: components/rounds, components/teams, components/scoreboard, components/ui
- Added client tests and setup: client/src/contexts/__tests__/, client/src/components/**/__tests__/, client/jest.config.cjs, client/src/setupTests.ts
- Server reorganized into modules: server/src/modules/{api,export,state} with server/src/types for events/payloads
- Basic persistence added via server/data/scoreboard.json
- New helper scripts for testing: test_all.ps1, test_api.ps1, test_websocket.ps1

---

## 🔐 Environment configuration (server)

Create server/.env from server/.env.example. Important keys:
- PORT: default 3001
- NODE_ENV: production in production
- PUBLIC_URL: e.g., https://yourdomain.com (used for generating links)
- JWT_SECRET: set a strong secret in production
- DATABASE_URL (M2+): Postgres connection string
- REDIS_URL (M2+): Redis connection string

To generate Prisma client after setting DATABASE_URL:
- From server/: npx prisma generate
- Run migrations (to be added in M2): npx prisma migrate deploy

### Dev stack (Postgres + Redis)
- docker compose -f docker-compose.dev.yml up -d
- .env example values:
  - DATABASE_URL=postgresql://app:example@localhost:5432/improvscoreboard?schema=public
  - REDIS_URL=redis://localhost:6379
- Then: from server/: npx prisma generate

---

## 🗳️ Audience Voting (experimental)

The server exposes simple endpoints to run audience votes between Team 1 and Team 2.

- Enable/disable voting globally
  - POST /api/voting/enable { "enabled": boolean }
- Start a voting session
  - POST /api/voting/start { "matchId"?: string }
- Cast a vote for a team (while active)
  - POST /api/voting/vote/team1
  - POST /api/voting/vote/team2
- End the voting session, optionally auto-award a point to the winner
  - POST /api/voting/end { "matchId"?: string, "autoAward"?: boolean }
- Get current voting state
  - GET /api/voting/state

Notes
- Votes are kept in-memory; they reset each time you start a session.
- If autoAward=true when ending and there is a winner, the server increments that team’s score.
- You can surface a QR or short link to your audience that hits the vote endpoints from phones (implementation up to you).

For detailed request/response examples, see docs/Voting.md.

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
