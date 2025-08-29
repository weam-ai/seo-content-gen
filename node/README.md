# Project Setup Guide

## 1. Database Setup

### Tool: PgAdmin

#### Setting Up PostgreSQL

1. **Install PostgreSQL:**
   ```sh
   brew install postgresql
   ```
2. **Start PostgreSQL service:**
   ```sh
   brew services start postgresql
   ```
3. **Set up database credentials** (Replace `postgres` with your username):
   ```sh
   psql postgres
   ALTER USER postgres WITH PASSWORD 'your_secure_password';
   \q
   ```
4. **Configure and create a server in PgAdmin** and connect to your database.

## 2. Project Setup

1. **Install NestJS CLI globally:**
   ```sh
   npm install -g @nestjs/cli
   ```
2. **Clone the project and install dependencies:**
   ```sh
   git clone https://github.com/aayush-e2m/razorcopy-nest.git
   cd razorcopy-nest
   npm install
   ```
3. **Create an environment configuration file (`.env`) with database credentials.**
4. **Run the project:**
   ```sh
   npm run dev
   ```

## 3. Database Migrations

After setting up the project, apply database migrations to ensure the schema is up to date:

```sh
npm run typeorm migration:run
```

This command will execute all pending migrations and synchronize the database schema.

### Optional:

- To revert the last migration:
  ```sh
  npm run typeorm migration:revert
  ```
- To generate a new migration:
  ```sh
  npm run typeorm migration:generate -- -n MigrationName
  ```

  

Following these steps will ensure your database and project are correctly set up and running smoothly.
