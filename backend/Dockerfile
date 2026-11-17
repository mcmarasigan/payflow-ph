FROM php:8.3-cli-alpine

# Install system dependencies & PHP extensions required for Laravel 13, SQLite, and DomPDF
RUN apk add --no-cache \
    sqlite-dev \
    libpng-dev \
    libzip-dev \
    zip \
    unzip \
    curl \
    freetype-dev \
    libjpeg-turbo-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_sqlite bcmath gd zip

# Copy Composer binary
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY . .

# Install production dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Create SQLite database and ensure write permissions for storage
RUN mkdir -p database storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs \
    && touch database/database.sqlite \
    && chmod -R 777 storage database bootstrap/cache

ENV APP_ENV=production
ENV APP_DEBUG=false
ENV DB_CONNECTION=sqlite
ENV DB_DATABASE=/app/database/database.sqlite

EXPOSE 8080

CMD php artisan migrate:fresh --seed --force && php artisan serve --host=0.0.0.0 --port=${PORT:-8080}
