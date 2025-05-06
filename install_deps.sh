#!/bin/bash

# Function to check for npm and attempt installation if missing
check_or_install_npm() {
    if command -v npm >/dev/null 2>&1; then
        echo "npm found."
        return 0 # npm is installed
    fi

    echo "Error: npm command not found."

    # Check for apt package manager (common on Debian/Ubuntu)
    if command -v apt >/dev/null 2>&1; then
        read -p "Attempt to install Node.js and npm using 'apt' (requires sudo)? [y/N] " -n 1 -r
        echo # move to a new line
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "Attempting installation via apt..."
            sudo apt update \
                && sudo apt install nodejs npm \
                || { echo >&2 "apt installation failed. Please install Node.js/npm manually from https://nodejs.org/ and ensure it's in your PATH."; exit 1; }

            # Verify installation after attempt
            if command -v npm >/dev/null 2>&1; then
                echo "npm installed successfully via apt."
                return 0
            else
                echo >&2 "Installation via apt completed, but npm still not found. Please check for errors or install manually."
                exit 1
            fi
        else
            echo "Skipping installation attempt."
        fi
    fi

    # If apt wasn't found or user skipped, show final error
    echo >&2 "Please install Node.js (which includes npm) from https://nodejs.org/ and ensure it's added to your PATH."
    exit 1
}

# --- Main Script --- 
check_or_install_npm

echo "Installing root dependencies..."
npm install

echo "Installing client dependencies..."
(cd client && npm install)

echo "Installing server dependencies..."
(cd server && npm install)

echo "Dependency installation complete."
