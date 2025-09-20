/**
 * File: scripts/migrate.js
 * Role: สร้างตารางทั้งหมด (Schema) สำหรับระบบลงทะเบียน
 * Run:  node scripts/migrate.js
 */

import { run } from "../src/db/connection.js";

async function main() {
  // เปิดใช้งาน Foreign Keys
  await run(`PRAGMA foreign_keys = ON;`);

  // ลบตารางเก่า (หากมี) — เพื่อความสะอาดเวลาพัฒนา
  await run(`DROP TABLE IF EXISTS RegisteredSubject;`);
  await run(`DROP TABLE IF EXISTS TermCreditSummary;`);
  await run(`DROP TABLE IF EXISTS SubjectStructure;`);
  await run(`DROP TABLE IF EXISTS Subjects;`);
  await run(`DROP TABLE IF EXISTS Students;`);

  // Students (นักเรียน)
  await run(`
    CREATE TABLE Students (
      student_id      TEXT PRIMARY KEY,                  -- 69xxxxxx (8 หลัก)
      prefix          TEXT NOT NULL,
      first_name      TEXT NOT NULL,
      last_name       TEXT NOT NULL,
      birth_date      TEXT NOT NULL,                     -- YYYY-MM-DD
      current_school  TEXT NOT NULL,
      email           TEXT,
      curriculum_id   TEXT NOT NULL                      -- รหัสหลักสูตรที่ลงทะเบียน
    );
  `);

  // Subjects (รายวิชา)
  await run(`
    CREATE TABLE Subjects (
      subject_id        TEXT PRIMARY KEY,                -- 0550xxxx หรือ 9064xxxx
      name_th           TEXT NOT NULL,
      credits           INTEGER NOT NULL CHECK (credits > 0),
      instructor        TEXT,                            -- ชื่ออาจารย์ผู้สอน
      prereq_subject_id TEXT,                            -- รหัสวิชาบังคับก่อน (ถ้ามี)
      offered_term      INTEGER NOT NULL CHECK (offered_term IN (1,2)),
      grade_mode        TEXT NOT NULL CHECK (grade_mode IN ('LETTER','SU')),
      FOREIGN KEY (prereq_subject_id) REFERENCES Subjects(subject_id)
    );
  `);

  // SubjectStructure (โครงสร้างหลักสูตรปี 1)
  await run(`
    CREATE TABLE SubjectStructure (
      curriculum_id   TEXT NOT NULL,                    -- เช่น CSY1CUR
      curriculum_name TEXT NOT NULL,
      department      TEXT NOT NULL,
      subject_id      TEXT NOT NULL,
      term_no         INTEGER NOT NULL CHECK (term_no IN (1,2)),
      PRIMARY KEY (curriculum_id, subject_id),
      FOREIGN KEY (subject_id) REFERENCES Subjects(subject_id)
    );
  `);

  // RegisteredSubject (วิชาที่นักเรียนลง + เกรด)
  await run(`
    CREATE TABLE RegisteredSubject (
      student_id   TEXT NOT NULL,
      subject_id   TEXT NOT NULL,
      grade        TEXT,                                -- A,B+,...,F หรือ S/U
      PRIMARY KEY (student_id, subject_id),
      FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES Subjects(subject_id) ON DELETE CASCADE
    );
  `);

  // TermCreditSummary (ยอดหน่วยกิตต่อเทอมเพื่อเช็คเพดาน 22 นก.)
  await run(`
    CREATE TABLE TermCreditSummary (
      student_id    TEXT NOT NULL,
      term_no       INTEGER NOT NULL CHECK (term_no IN (1,2)),
      total_credits INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (student_id, term_no),
      FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE
    );
  `);

  console.log("✅ migrate: สร้างตารางเรียบร้อย");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});