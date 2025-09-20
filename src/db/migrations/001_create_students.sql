-- File: src/db/migrations/001_create_students.sql
-- Role: โครงสร้างตาราง Students พร้อมเงื่อนไขตาม Requirement

CREATE TABLE IF NOT EXISTS Students (
  student_id     CHAR(8)  PRIMARY KEY
                  CHECK (length(student_id)=8 AND substr(student_id,1,2)='69'),
  prefix         TEXT     NOT NULL,                 -- คำนำหน้า
  first_name     TEXT     NOT NULL,                 -- ชื่อ
  last_name      TEXT     NOT NULL,                 -- นามสกุล
  birth_date     TEXT     NOT NULL,                 -- YYYY-MM-DD
  current_school TEXT     NOT NULL,                 -- โรงเรียนปัจจุบัน
  email          TEXT     NOT NULL,                 -- อีเมลติดต่อ
  curriculum_id  CHAR(8)  NOT NULL                  -- รหัสหลักสูตร 8 หลัก "ตัวแรกไม่เป็น 0"
                  CHECK (length(curriculum_id)=8 AND substr(curriculum_id,1,1)!='0')
);