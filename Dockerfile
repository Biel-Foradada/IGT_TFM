# Build the initial image with all the npm packages needed by the app
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Build the base for the save server
FROM nginx:stable-alpine
RUN apk add --no-cache nodejs npm

# Install the save server depencies
WORKDIR /app
RUN npm install express cors

# Copy React files to Nginx
COPY --from=build /app/dist /usr/share/nginx/html
COPY save-server.js /app/save-server.js

# Setup Entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
RUN mkdir -p /app/results

EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]