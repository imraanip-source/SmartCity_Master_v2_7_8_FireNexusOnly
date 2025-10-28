FROM node:18-alpine
WORKDIR /app
COPY utils/dev-suite/package.json utils/dev-suite/package-lock.json* ./utils/dev-suite/
RUN cd utils/dev-suite && (npm ci --omit=dev || npm i --omit=dev)
COPY . .
EXPOSE 8088
CMD ["node","utils/dev-suite/server.js"]
