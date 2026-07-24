# Docker — Setup and Launch

This document explains how to run Trader Tracker with Docker, without manually installing MySQL, Node.js, or a web server.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- The project cloned locally (`git clone ...`)

## 1. Configuration

Create the `back/.env` file from the provided template:

```bash
cp back/.env.example back/.env
```

Then fill in the values:

```
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_DATABASE=

FRONTEND_URL=

APP_PORT=
JWT_SECRET=
POLY_API_KEY=
```

> `DB_HOST` and `FRONTEND_URL` are already set automatically by `docker-compose.yml` (`db` and `http://localhost:8080`) — no need to duplicate them in `.env`, but leaving them there is not a problem (`environment:` takes precedence over `env_file`).

## 2. Launch

From the project root:

```bash
docker compose up
```

This command:
1. builds the `back` and `front` images from their `Dockerfile`
2. pulls the official `mysql:8.0` image
3. starts the 3 containers
4. connects them automatically on a shared Docker network

To run in the background (without keeping the terminal busy):

```bash
docker compose up -d
```

## 3. Automatic database initialization

On the **very first startup** (empty `mysql_data` volume), two scripts run automatically, with no manual command required:

| Script | Role |
|---|---|
| `docker/mysql/init/01-schema.sql` | Creates the tables |
| `docker/mysql/init/02-seed.sql` | Inserts test data (admin / user / analyst accounts) |

They do not run again on subsequent startups as long as the volume exists.

## 4. Accessing the services

| Service | Address |
|---|---|
| Front (website) | http://localhost:8080 |
| Back (API) | http://localhost:3000 |
| Database (MySQL) | `localhost:3307` |

> Port `3307` is used on the host side (instead of `3306`) to avoid a conflict with a local MySQL instance that might already be installed on the machine.

## 5. Importing financial assets (manual step)

Financial assets (stocks, currencies, commodities) are imported once, after the containers' first startup:

```bash
docker exec -it dwwm-back-1 npm run import
```

This import does not need to be re-run on every startup — only at initialization, or after a full database reset.

## 6. Development (hot-reload)

The `back` and `front` folders are mounted as volumes into their respective containers: any change to the source code is picked up automatically.

- **back**: `nodemon` restarts the server on every change
- **front**: files are served directly by nginx, a simple browser refresh is enough

## 7. Useful commands

| Command | Effect |
|---|---|
| `docker compose up` | Starts (or restarts) the containers |
| `docker compose up -d --force-recreate` | Forces recreation of all containers (useful after editing `docker-compose.yml`) |
| `docker compose down` | Stops and removes the containers (data is kept) |
| `docker compose down -v` | Stops everything **and removes the volumes** — the database starts from scratch |
| `docker compose logs -f back` | Follows the back container's logs live |
| `docker compose exec back env` | Shows the environment variables actually used by the container |
| `docker exec -it your_database_name mysql -u your_user_name -p` | Opens a MySQL shell inside the database container |

## 8. Quick troubleshooting

**`port is already allocated` / `address already in use` error**
Another program is already using that port. Two options:
- change the host port in `docker-compose.yml` (only the left side of the `"HOST:CONTAINER"` mapping)
- free up the port: `lsof -i :3000` (Linux/Mac) or `netstat -ano | findstr :3000` (Windows), then close the relevant process

**CORS error in the browser**
Check that `FRONTEND_URL` (back) exactly matches the front's origin (`http://localhost:8080`), and that `API_BASE_URL` (front, in `instanceHttp.js`) matches the port actually exposed by the `back` container.

**The database seems empty after a `docker compose down -v`**
That's expected — this flag removes the `mysql_data` volume. Running `docker compose up` again re-runs the initialization scripts, then re-run the import (step 5).

## Architecture

```
Trader Tracker
├── db     (mysql:8.0)      → database
├── back   (node:24-alpine) → Express API
└── front  (nginx:alpine)   → static website
```

All three services are defined in a single file: `docker-compose.yml`, at the project root.
