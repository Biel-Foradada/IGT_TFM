#!/bin/sh
# Script to inject variables into the docker image and start the nodejs server to save the results

# Load the env variables
echo "window._env_ = {" > /usr/share/nginx/html/env-config.js
env | grep VITE_ | awk -F '=' '{print "  " $1 ": \"" $2 "\","}' >> /usr/share/nginx/html/env-config.js
echo "};" >> /usr/share/nginx/html/env-config.js

# Start the nodejs server
node /app/save-server.js &

# Start the nginx server
exec "$@"