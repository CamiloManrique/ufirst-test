FROM php:8.1-apache

RUN apt-get update \
    && apt-get install -y zip unzip git

RUN a2enmod rewrite

COPY src/ /var/www/html/
COPY install-composer.sh /usr/local/install-composer.sh

# Install composer
RUN chmod +x /usr/local/install-composer.sh
RUN /usr/local/install-composer.sh

# Install packages
RUN php /usr/local/bin/composer install

EXPOSE 80
