# Evently

## Run Evently in development mode

First, copy the `.env.template.development` file to `.env.development`.

- Change permissions for Postgres script: `chmod +x databases/drizzle/sql/postgres-init-user-db.sh`
- Start the database Docker containers: `docker compose up -d`
- Initialize the database (migrations + fixtures): `yarn db:reset`
- Run the API: `yarn start:api`

## The API is available on https://localhost:4000.

## How to migrate the database

After some changes have been made to the database you need to create a migration and apply it

### Create a migration

Launch the following command to generate a new migration

```bash
yarn migrate:gen
```

### Apply the migration

After the migration has been generated you can apply it to the different database based on your needs

**Development database**

```bash
yarn pg:migrate
```

**Test database**

```bash
yarn pg:migrate:test
```

**Production database**

```bash
DATABASE_URL="<url to connect to postgres>" yarn migrate:db:prod
```

## How to rollback the migration

If you need to rollback the migration you can use the following command

**Development database**

```bash
yarn migrate:drop:local
```

**Test database**

```bash
yarn migrate:drop:test
```

**Production database**

```bash
DATABASE_URL="<url to connect to postgres>" yarn migrate:drop:prod
```
