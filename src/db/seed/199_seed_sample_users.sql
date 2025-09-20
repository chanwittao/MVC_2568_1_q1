-- File: src/db/seed/199_seed_sample_users.sql
-- Purpose:
--   - ใส่ข้อมูลตัวอย่างครบตาม Requirement
--   - curriculum_id เป็นเลข 8 หลักและตัวแรกไม่ใช่ 0
--   - ผูก "GenEd บังคับ" ลง SubjectStructure เพื่อให้ไปแสดงใน "รายวิชาบังคับ"
--   - เพิ่มหลักสูตรใหม่ 1 อัน รวมเป็น 3 หลักสูตร

DELETE FROM RegisteredSubject;
DELETE FROM TermCreditSummary;
DELETE FROM SubjectStructure;
DELETE FROM Subjects;
DELETE FROM Students;

-- ========================
-- หลักสูตร (ใช้เฉพาะรหัส 8 หลัก ไม่ขึ้นต้น 0)
-- ========================
-- 11 000 001 = CS Year 1
-- 11 000 002 = Engineering Year 1
-- 11 000 003 = Data Science Year 1   (หลักสูตรใหม่)
-- * เราเก็บข้อมูลชื่อ/ภาคใน SubjectStructure เลย จึงไม่มีตาราง Curriculums แยก
--   แค่ใช้รหัส curriculum_id ให้สอดคล้อง

-- ========================
-- Students (10 คน + admin)
-- ========================
INSERT INTO Students VALUES
('69000001','Mr.','Student','One','2006-01-01','HighSchool A','s1@example.com','11000001'),
('69000002','Ms.','Student','Two','2006-02-02','HighSchool A','s2@example.com','11000001'),
('69000003','Mr.','Student','Three','2006-03-03','HighSchool B','s3@example.com','11000001'),
('69000004','Ms.','Student','Four','2006-04-04','HighSchool B','s4@example.com','11000001'),
('69000005','Mr.','Student','Five','2006-05-05','HighSchool C','s5@example.com','11000002'),
('69000006','Ms.','Student','Six','2006-06-06','HighSchool C','s6@example.com','11000002'),
('69000007','Mr.','Student','Seven','2006-07-07','HighSchool D','s7@example.com','11000003'), -- ย้ายมาหลักสูตรใหม่
('69000008','Ms.','Student','Eight','2006-08-08','HighSchool D','s8@example.com','11000003'),
('69000009','Mr.','Student','Nine','2006-09-09','HighSchool E','s9@example.com','11000001'),
('69000010','Ms.','Student','Ten','2006-10-10','HighSchool E','s10@example.com','11000001'),
('admin01','Dr.','Admin','User','1990-01-01','System','admin@example.com','11000001');

-- ==========================================
-- Subjects
--  - วิชาบังคับคณะ ปี 1 (เทอม 1/2)
--  - GenEd "บังคับ" (9064xxxx) 2 เทอม
--  - GenEd "เลือกเสรี" (สำหรับแนะนำ)
-- ==========================================

-- เทอม 1 (บังคับคณะ)
INSERT INTO Subjects VALUES
('05506003','การเขียนโปรแกรมขั้นพื้นฐาน',3,'อ.สันธนะ',NULL,1,'LETTER'),
('05506005','วิทยาการคอมพิวเตอร์',3,'อ.สันธนะ',NULL,1,'LETTER'),
('05506231','สถิติและความน่าจะเป็น',3,'อ.จีรพร',NULL,1,'LETTER'),
('05506232','คณิตศาสตร์สำหรับวิทยาการคอมพิวเตอร์',3,'อ.กนกณัฏฐช์',NULL,1,'LETTER');

-- เทอม 2 (บังคับคณะ + มีวิชาบังคับก่อน)
INSERT INTO Subjects VALUES
('05506004','การเขียนโปรแกรมเชิงวัตถุ',3,'อ.สันธนะ','05506003',2,'LETTER'),
('05506001','คณิตศาสตร์ไม่ต่อเนื่อง',3,'อ.วิสันต์','05506232',2,'LETTER'),
('05506233','แคลคูลัสสำหรับวิทยาการคอมพิวเตอร์',3,'อ.ธีรวัตร์','05506232',2,'LETTER'),
('05506008','องค์ประกอบและสถาปัตยกรรมคอมพิวเตอร์',3,'อ.จีรพร',NULL,2,'LETTER');

-- GenEd "บังคับ"
INSERT INTO Subjects VALUES
('90641001','โรงเรียนสร้างเสน่ห์',3,'อ.ชาร์ม',NULL,1,'SU'),
('90644007','ภาษาอังกฤษพื้นฐาน 1',3,'อ.อังกฤษ1',NULL,1,'SU'),
('90641002','ดิจิทัลไอคิว',3,'อ.ดิจิทัล',NULL,2,'SU'),
('90644008','ภาษาอังกฤษพื้นฐาน 2',3,'อ.อังกฤษ2',NULL,2,'SU');

-- GenEd "เลือกเสรี" (ใช้แนะนำ)
-- เทอม 1
INSERT INTO Subjects VALUES
('90641012','การสื่อสารเชิงสร้างสรรค์',3,'อ.นิเทศ',NULL,1,'SU'),
('90641013','สังคมไทยร่วมสมัย',3,'อ.สังคม',NULL,1,'SU');
-- เทอม 2
INSERT INTO Subjects VALUES
('90641021','การคิดเชิงระบบ',3,'อ.ชาญ',NULL,2,'SU'),
('90641022','จิตวิทยาเชิงบวก',3,'อ.สุขภาพจิต',NULL,2,'SU');

-- =====================================================
-- SubjectStructure (บังคับคณะ + GenEd บังคับ ปี 1)
-- =====================================================

-- CS Year 1 -> 11000001
INSERT INTO SubjectStructure VALUES
('11000001','CS Year 1','Computer Science','05506003',1),
('11000001','CS Year 1','Computer Science','05506005',1),
('11000001','CS Year 1','Computer Science','05506231',1),
('11000001','CS Year 1','Computer Science','05506232',1),
('11000001','CS Year 1','Computer Science','05506004',2),
('11000001','CS Year 1','Computer Science','05506001',2),
('11000001','CS Year 1','Computer Science','05506233',2),
('11000001','CS Year 1','Computer Science','05506008',2),
-- GenEd บังคับ
('11000001','CS Year 1','General Education','90641001',1),
('11000001','CS Year 1','General Education','90644007',1),
('11000001','CS Year 1','General Education','90641002',2),
('11000001','CS Year 1','General Education','90644008',2);

-- Engineering Year 1 -> 11000002
INSERT INTO SubjectStructure VALUES
('11000002','Engineering Year 1','Engineering','05506003',1),
('11000002','Engineering Year 1','Engineering','05506231',1),
('11000002','Engineering Year 1','Engineering','05506232',1),
('11000002','Engineering Year 1','Engineering','05506004',2),
('11000002','Engineering Year 1','Engineering','05506001',2),
('11000002','Engineering Year 1','Engineering','05506233',2),
-- GenEd บังคับ
('11000002','Engineering Year 1','General Education','90641001',1),
('11000002','Engineering Year 1','General Education','90644007',1),
('11000002','Engineering Year 1','General Education','90641002',2),
('11000002','Engineering Year 1','General Education','90644008',2);

-- Data Science Year 1 (หลักสูตรใหม่) -> 11000003
INSERT INTO SubjectStructure VALUES
('11000003','Data Science Year 1','Data Science','05506003',1),
('11000003','Data Science Year 1','Data Science','05506231',1),
('11000003','Data Science Year 1','Data Science','05506232',1),
('11000003','Data Science Year 1','Data Science','05506004',2),
('11000003','Data Science Year 1','Data Science','05506001',2),
('11000003','Data Science Year 1','Data Science','05506233',2),
-- GenEd บังคับ
('11000003','Data Science Year 1','General Education','90641001',1),
('11000003','Data Science Year 1','General Education','90644007',1),
('11000003','Data Science Year 1','General Education','90641002',2),
('11000003','Data Science Year 1','General Education','90644008',2);

-- ==========================================
-- TermCreditSummary (init 0 สำหรับขึ้นต้น 69)
-- ==========================================
INSERT INTO TermCreditSummary (student_id, term_no, total_credits)
SELECT student_id, 1, 0 FROM Students WHERE student_id LIKE '69%';
INSERT INTO TermCreditSummary (student_id, term_no, total_credits)
SELECT student_id, 2, 0 FROM Students WHERE student_id LIKE '69%';