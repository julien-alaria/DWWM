# App Overview

Trader Tracker is a web platform that allows individual investors to track financial assets (stocks, currencies, commodities) 
and view recommendations published by specialized analysts.

## Technologies Used

## Front-end
- **HTML 5**
- **CSS 3**
- **ApexCharts**

## Back-end
- **node.js**
- **express.js**
- **jsonwebtoken**
- **bcrypt**
- **massive API**
- **cors**
- **express-rate-limit**
- **multer**
- **nodemon**
- **dotenv**

# Project architecture

The application follows the MVC pattern by separating:
- **models:** business logic and interactions with the MySQL database
- **views:** HTML pages
- **controllers:** handling of user requests
- **router:** management of actions via URLs

# App screenshots

![presentation](img/trader_tracker-screencapture.png)

# Technical stack and application modules

![presentation](img/trader_tracker-stack.png)


# Alternative Backend: PHP

A native PHP reimplementation of the backend is available in a separate repository: 

[trader_tracker-back-php](https://github.com/julien-alaria/trader_tracker-back-php). 

It exposes the same routes and uses the same MySQL database — a drop-in replacement for the Node.js backend.

## Technologies used (PHP backend)
- **PHP 8.2+**
- **Composer**
- **firebase/php-jwt**
- **vlucas/phpdotenv**
- **PDO** (MySQL)

## Switching to the PHP backend

1. Clone and set up the PHP backend — see its own README for full instructions (Composer install, `.env` configuration, database import).
2. Start it:
```bash
   php -S localhost:8000 -t public
```
   (or `docker compose up --build` for a fully isolated environment with its own database)
3. Point the frontend to it, in `front/src/config/api.js`:
```javascript
   export const API_BASE_URL = "http://localhost:8000"
```
4. Make sure the CORS allowed origin in the PHP backend's `public/index.php` matches the exact URL the frontend is served from — the check is strict, character for character.

# Licence
This project is under a proprietary license.
  
