try {
  require("dotenv").config();
} catch {
  // Dependencies may not be installed during repository skeleton checks.
  // node-pg-migrate will still read DATABASE_URL from the process environment.
}

module.exports = {
  databaseUrl: process.env.DATABASE_URL,
  dir: "database/migrations",
  direction: "up",
  migrationsTable: "schema_migrations",
  count: Infinity,
  ignorePattern: ".*\\.map$"
};
