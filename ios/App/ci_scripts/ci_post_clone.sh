#!/usr/bin/env bash

# Use nvm to install specific Node.js version (if needed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 18
nvm use 18

# Install dependencies
npm config set maxsockets 3
npm ci
npm run build
npx cap sync ios --deployment