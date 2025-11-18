require('dotenv').config();
const mysql = require('mysql2/promise');

const isOnline = process.env.DB_SSL === 'true';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'edulms_project',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: isOnline ? { rejectUnauthorized: false } : undefined
});

module.exports = pool;

