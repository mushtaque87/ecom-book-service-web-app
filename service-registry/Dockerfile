FROM node:18
WORKDIR /app
COPY service-registry/package*.json ./
RUN npm install
COPY service-registry/ ./
EXPOSE 5007
CMD ["npm", "start"] 