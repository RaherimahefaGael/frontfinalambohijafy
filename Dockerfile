# Utilise une image Nginx officielle
FROM nginx:alpine

# Supprime la configuration par défaut
RUN rm -rf /usr/share/nginx/html/*

# Copie ton projet dans le dossier HTML de Nginx
COPY . /usr/share/nginx/html

# Expose le port HTTP
EXPOSE 80

# Le conteneur démarre avec Nginx
CMD ["nginx", "-g", "daemon off;"]
