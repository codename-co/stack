FROM php:8.3-fpm as builder
ENV COMPOSER_VERSION=2.8.4
RUN apt-get update && apt-get install -y git wget libzip-dev libxml2-dev \
  && CFLAGS="-I/usr/src/php" docker-php-ext-install zip xmlreader intl \
  && pecl install apcu && docker-php-ext-enable apcu

WORKDIR /app
RUN wget https://getcomposer.org/installer -O composer-setup.php \
  && wget https://composer.github.io/installer.sig -O composer-setup.sig \
  && php -r "exit(hash('SHA384', file_get_contents('composer-setup.php'))===trim(file_get_contents('composer-setup.sig'))?0:1);" \
  && php composer-setup.php --version=$COMPOSER_VERSION --install-dir=/usr/local/bin --filename=composer \
  && rm composer-setup.php composer-setup.sig

RUN git config --global url."https://".insteadOf git:// \
  && git config --global url."https://github.com/".insteadOf git@github.com: \
  && git clone https://github.com/cachethq/cachet /build

WORKDIR /build
RUN git reset --hard --quiet 4ebeba11597f06fc38f30f8ff5992764fb6a2744 \
  && composer install --no-dev -o \
  && composer update cachethq/core


FROM php:8.3-fpm-alpine
RUN apk add --update --no-cache supervisor nginx libpq-dev postgresql-client \
  && docker-php-ext-install pdo pdo_pgsql \
  && apk del libpq-dev \
  && rm -rf /var/cache/apk/*

COPY --from=builder /build /var/www/html
RUN chown -R www-data:root /var/www/html \
  && mkdir /var/cache/nginx && chmod 777 /var/cache/nginx

COPY conf/supervisord.conf /etc/supervisor/supervisord.conf
COPY conf/nginx.conf /etc/nginx/nginx.conf
COPY conf/nginx-site.conf /etc/nginx/conf.d/default.conf
COPY entrypoint.sh /sbin/entrypoint.sh

WORKDIR /var/www/html
RUN touch database/database.sqlite && \
  chown www-data:root /var/www/html/database/database.sqlite
RUN cp .env.example .env

EXPOSE 8000
CMD ["/sbin/entrypoint.sh"]
