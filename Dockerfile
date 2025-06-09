# Stage 1: Build Angular app
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
#builds the angular app 
RUN npm run build -- --configuration=production --project=kyc

# Stage 2: Serve with nginx
FROM nginx:stable-alpine

COPY --from=build /app/dist/kyc/browser /usr/share/nginx/html

# replaces default nginx config  with custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
