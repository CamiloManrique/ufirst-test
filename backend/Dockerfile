FROM php:8.1-apache

ARG PORT

EXPOSE $PORT

RUN apt-get update \
    && apt-get install -y zip unzip git

COPY src/ /var/www/html/
COPY install-composer.sh /usr/local/install-composer.sh

RUN chmod -R 777 /var/www/html

RUN chmod +x /usr/local/install-composer.sh
RUN /usr/local/install-composer.sh

# Install packages
RUN php /usr/local/bin/composer install

RUN a2enmod rewrite
RUN sed -i "s/80/$PORT/g" /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf
