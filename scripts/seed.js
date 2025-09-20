/**
 * File: scripts/seed.js
 * Role: โหลดไฟล์ SQL seed แล้วรันใส่ฐานข้อมูล
 * Run:  node scripts/seed.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "../src/db/connection.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.join(__dirname, "..", "src", "db", "seed", "199_seed_sample_users.sql");

async function main() {
  const sql = fs.readFileSync(seedPath, "utf8");

  // ใช้ serialize เพื่อให้คำสั่งวิ่งตามลำดับ
  db.serialize(() => {
    db.exec(sql, (err) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      console.log("✅ seed: เติมข้อมูลตัวอย่างเรียบร้อย");
      process.exit(0);
    });
  });
}

main();