#!/bin/bash
echo "Installing root dependencies..."
npm install

echo "Installing client dependencies..."
(cd client && npm install)

echo "Installing server dependencies..."
(cd server && npm install)

echo "Dependency installation complete."
