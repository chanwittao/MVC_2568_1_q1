/**
 * File: src/repositories/SubjectRepo.js
 * Role: Repository (Model Layer) สำหรับเข้าถึงข้อมูล "Subjects" (รายวิชา)
 * Focus: ใช้ในหน้า Enroll เพื่อตอบโจทย์
 *   - แสดง "รายวิชาบังคับปี 1" ของเทอมที่เลือก "เฉพาะวิชาที่ยังไม่ได้ลง"
 *   - แสดง "GenEd แนะนำ" ของเทอมนั้น "เฉพาะวิชาที่ยังไม่ได้ลง"
 * Note:
 *   - โครงสร้างปี 1 อ้างอิงจากตาราง SubjectStructure (curriculum_id = 'CSY1CUR')
 *   - offered_term ใน Subjects ใช้ตรวจว่าเปิดเทอมไหน (1/2)
 */

import { all, get } from "../db/connection.js";

/**
 * ดึง "รายวิชาบังคับปี 1" ของเทอมที่กำหนด
 * กรองเฉพาะ "ที่นักเรียนยังไม่ได้ลง" โดยเช็คจาก RegisteredSubject
 * ใช้ในหน้า: student/enroll.ejs (โซนบน)
 */
export const findCompulsoryByTerm = async (term, studentId) => {
  const sql = `
    SELECT s.*
    FROM Subjects s
    JOIN SubjectStructure st ON st.subject_id = s.subject_id
    WHERE st.term_no = ?
      AND st.curriculum_id = 'CSY1CUR'        -- โครงหลักสูตรปี 1 ของ CS
      AND s.subject_id NOT IN (                -- กรองวิชาที่เคยลงไปแล้ว
        SELECT subject_id
        FROM RegisteredSubject
        WHERE student_id = ?
      )
    ORDER BY s.subject_id
  `;
  return all(sql, [term, studentId]);
};

/**
 * ดึง "GenEd แนะนำ" ของเทอมที่กำหนด
 * เลือกจากรหัส 9064**** (GenEd) และ offered_term ตรงกับเทอม
 * กรองเฉพาะ "ที่ยังไม่ได้ลง"
 * ใช้ในหน้า: student/enroll.ejs (โซนล่าง)
 */
export const findGenEdByTerm = async (term, studentId) => {
  const sql = `
    SELECT s.*
    FROM Subjects s
    WHERE s.subject_id LIKE '9064%'           -- GenEd prefix
      AND s.offered_term = ?
      AND s.subject_id NOT IN (
        SELECT subject_id
        FROM RegisteredSubject
        WHERE student_id = ?
      )
    ORDER BY s.subject_id
  `;
  return all(sql, [term, studentId]);
};

/** อ่านรายวิชา 1 ตัวตามรหัส (ใช้ใน RegistrationService ตอนตรวจ/สมัคร) */
export const findById = (id) =>
  get(`SELECT * FROM Subjects WHERE subject_id = ?`, [id]);

/**
 * (ตัวเลือก) แจ้งรวมหน่วยกิตจากรายการรหัสวิชา – เผื่อใช้คำนวณก่อนลง
 * ยังไม่ถูกเรียกใช้อย่างเป็นทางการ แต่เก็บไว้เป็น util
 */
export const creditsOf = async (ids) => {
  if (!ids || !ids.length) return 0;
  const placeholders = ids.map(() => "?").join(",");
  const row = await get(
    `SELECT SUM(credits) AS sumc FROM Subjects WHERE subject_id IN (${placeholders})`,
    ids
  );
  return row?.sumc || 0;
};