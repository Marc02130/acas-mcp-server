FROM node:22-alpine

WORKDIR /usr/src/app

# Copy package files first for better caching
COPY package*.json ./

# Install all dependencies including devDependencies
# Adding --no-cache to ensure fresh install
RUN npm install --include=dev --no-cache

# Explicitly install uuid package to ensure it's available
RUN npm install uuid

# Copy all source files
COPY . .

# Create logs directory
RUN mkdir -p logs

EXPOSE 3002

CMD ["node", "src/index.js"]