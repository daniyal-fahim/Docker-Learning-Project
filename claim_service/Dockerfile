FROM node:18
WORKDIR /app
COPY package*.json ./
# Explicitly install amqplib first
RUN npm install amqplib --verbose || { echo "Failed to install amqplib"; exit 1; }
RUN npm install 
# Debug: Verify amqplib installation
RUN ls -la /app/node_modules/amqplib || { echo "amqplib not found in node_modules"; exit 1; }
COPY . .
RUN apt-get update && apt-get install -y netcat-openbsd
COPY wait_for_rabbit.sh /wait_for_rabbit.sh
RUN chmod +x /wait_for_rabbit.sh
CMD ["sh", "/wait_for_rabbit.sh", "node", "index.js"]
