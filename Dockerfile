FROM node:18-slim

# Install wireguard-tools
RUN apt-get update && apt-get install -y wireguard iproute2 && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install

# Copy source and WireGuard config
COPY . .

# Make entrypoint executable
RUN chmod +x entrypoint.sh
