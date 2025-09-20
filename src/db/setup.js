/**
 * File: src/db/setup.js
 * Role: Utilities สำหรับตั้งค่าฐานข้อมูลในโปรเซสเดียว (ใช้กับปุ่ม Reset)
 * Usage:
 *   import { migrateAll, seedAll, migrateAndSeed } from "../db/setup.js"
 *   await migrateAndSeed();
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { run, db } from "./connection.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** สร้างตารางทั้งหมด (เทียบเท่า scripts/migrate.js) */
export async function migrateAll() {
  await run(`PRAGMA foreign_keys = ON;`);

  // ดรอปก่อน
  await run(`DROP TABLE IF EXISTS RegisteredSubject;`);
  await run(`DROP TABLE IF EXISTS TermCreditSummary;`);
  await run(`DROP TABLE IF EXISTS SubjectStructure;`);
  await run(`DROP TABLE IF EXISTS Subjects;`);
  await run(`DROP TABLE IF EXISTS Students;`);

  // Students
  await run(`
    CREATE TABLE Students (
      student_id      TEXT PRIMARY KEY,
      prefix          TEXT NOT NULL,
      first_name      TEXT NOT NULL,
      last_name       TEXT NOT NULL,
      birth_date      TEXT NOT NULL,
      current_school  TEXT NOT NULL,
      email           TEXT,
      curriculum_id   TEXT NOT NULL
    );
  `);

  // Subjects
  await run(`
    CREATE TABLE Subjects (
      subject_id        TEXT PRIMARY KEY,
      name_th           TEXT NOT NULL,
      credits           INTEGER NOT NULL CHECK (credits > 0),
      instructor        TEXT,
      prereq_subject_id TEXT,
      offered_term      INTEGER NOT NULL CHECK (offered_term IN (1,2)),
      grade_mode        TEXT NOT NULL CHECK (grade_mode IN ('LETTER','SU')),
      FOREIGN KEY (prereq_subject_id) REFERENCES Subjects(subject_id)
    );
  `);

  // SubjectStructure
  await run(`
    CREATE TABLE SubjectStructure (
      curriculum_id   TEXT NOT NULL,
      curriculum_name TEXT NOT NULL,
      department      TEXT NOT NULL,
      subject_id      TEXT NOT NULL,
      term_no         INTEGER NOT NULL CHECK (term_no IN (1,2)),
      PRIMARY KEY (curriculum_id, subject_id),
      FOREIGN KEY (subject_id) REFERENCES Subjects(subject_id)
    );
  `);

  // RegisteredSubject
  await run(`
    CREATE TABLE RegisteredSubject (
      student_id   TEXT NOT NULL,
      subject_id   TEXT NOT NULL,
      grade        TEXT,
      PRIMARY KEY (student_id, subject_id),
      FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES Subjects(subject_id) ON DELETE CASCADE
    );
  `);

  // TermCreditSummary
  await run(`
    CREATE TABLE TermCreditSummary (
      student_id    TEXT NOT NULL,
      term_no       INTEGER NOT NULL CHECK (term_no IN (1,2)),
      total_credits INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (student_id, term_no),
      FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE
    );
  `);
}

/** เติมข้อมูลตัวอย่าง (เทียบเท่า scripts/seed.js) */
export async function seedAll() {
  const seedPath = path.join(__dirname, "seed", "199_seed_sample_users.sql");
  const sql = fs.readFileSync(seedPath, "utf8");

  await new Promise((resolve, reject) => {
    db.serialize(() => {
      db.exec(sql, (err) => (err ? reject(err) : resolve()));
    });
  });
}

/** ยกกำลังสอง: ล้าง+สร้างใหม่ แล้ว seed ต่อทันที */
export async function migrateAndSeed() {
  await migrateAll();
  await seedAll();
}