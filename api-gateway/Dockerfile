FROM node:18
RUN echo "API Gateway"
WORKDIR /app
COPY api-gateway/package*.json ./
RUN npm install
COPY api-gateway/ ./
COPY shared/ ./shared/
EXPOSE 8080
CMD ["npm", "start"] 