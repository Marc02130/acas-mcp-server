FROM node:22-alpine

WORKDIR /usr/src/app

# Add build arguments for sensitive data
ARG OPENAI_API_KEY
ENV OPENAI_API_KEY=$OPENAI_API_KEY
ARG OPENAI_MODEL
ENV OPENAI_MODEL=$OPENAI_MODEL

# Copy package files first for better caching
COPY package*.json ./

# Install all dependencies including devDependencies
# Adding --no-cache to ensure fresh install
RUN npm install --include=dev --no-cache

# Explicitly install uuid package to ensure it's available
RUN npm install uuid

# Copy environment files
COPY .env* ./

# Copy all source files
COPY . .

# Create logs directory
RUN mkdir -p logs

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 3002

# Use dotenv to load environment variables
CMD ["node", "-r", "dotenv/config", "src/index.js"]