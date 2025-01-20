const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: process.env.TEST_DATABASE_HOST,
  user: process.env.TEST_DATABASE_USER,
  password: process.env.TEST_DATABASE_PASSWORD,
  database: process.env.TEST_DATABASE_DB,
});

module.exports = db;