# Scoreboardussy

A real-time, web-based scoreboard application designed for improv shows, sports events, or any scenario requiring dynamic score tracking.

## Features

*   Real-time updates via WebSockets (Socket.IO).
*   Separate control panel and display views.
*   Customizable team names and colors.
*   Customizable title and footer text, color, and size.
*   Logo upload and display.
*   Penalty tracking (Major/Minor).
*   Internationalization support (English/French).
*   Responsive design with Tailwind CSS.
*   Fullscreen mode for the display.

## Tech Stack

*   **Frontend:** React, TypeScript, Vite, Tailwind CSS, Shadcn/UI, i18next
*   **Backend:** Node.js, TypeScript, Express, Socket.IO

## Project Structure

```
/client       # React Frontend (Vite)
  /public
  /src
    /components
    /contexts
    /hooks
    /lib
    /styles
    App.tsx
    main.tsx
    i18n.ts
/server       # Node.js Backend (Express + Socket.IO)
  /src
    server.ts
    state.ts
package.json  # Root package file (runs client/server concurrently)
README.md     # This file
tsconfig.json
```

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd improvscoreboard
    ```

2.  **Install dependencies:**
    This project uses npm workspaces. Install dependencies from the root directory:
    ```bash
    npm install
    ```

3.  **Run the application:**
    Start both the client (Vite dev server) and the server (Node) concurrently:
    ```bash
    npm run dev
    ```

4.  **Access the application:**
    *   **Control Panel:** Open your browser to `http://localhost:5173/control` (or the port specified by Vite)
    *   **Scoreboard Display:** Open another browser tab/window to `http://localhost:5173/`

## Usage

*   Use the Control Panel to update team names, colors, scores, penalties, title/footer text, and upload a logo.
*   Changes are reflected in real-time on the Scoreboard Display view.
*   Switch languages using the buttons on the Control Panel.
*   Use the fullscreen button on the Display view for presentations.
