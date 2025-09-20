/**
 * File: src/db/connection.js
 * Role: DB helper (SQLite connection + promisified run/get/all)
 * Why: รวมวิธีเรียก DB ให้สั้นและอ่านง่ายในทุก Repository/Service
 */

import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** เลือก path ของฐานข้อมูลจาก .env ถ้าไม่ตั้ง จะ fallback เป็น src/db/app.db */
const DB_PATH =
  process.env.DB_PATH || path.join(__dirname, "app.db");

sqlite3.verbose();
export const db = new sqlite3.Database(DB_PATH);

/** run: ใช้กับคำสั่ง INSERT/UPDATE/DELETE/DDL */
export const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });

/** get: ดึงแถวเดียว */
export const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });

/** all: ดึงหลายแถว */
export const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });