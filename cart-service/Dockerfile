FROM node:18
RUN echo "Cart Service"
WORKDIR /app
COPY cart-service/package*.json ./
RUN npm install
COPY cart-service/ ./
COPY shared/ ./shared/
EXPOSE 5000
CMD ["npm", "start"] 