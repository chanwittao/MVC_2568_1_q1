/**
 * File: src/repositories/StudentRepo.js
 * Role: Repository (Model Layer) สำหรับเข้าถึงข้อมูล "Students" และข้อมูลแวดล้อมของนักเรียน
 * Pattern: Data Access Layer – แยกคำสั่ง SQL ออกจาก Controller/Service
 * Used by:
 *  - index.routes.js (ตรวจว่ามีนักเรียนจริงตอน login)
 *  - student.routes.js (ดึงรายวิชาที่นักเรียนลงไว้เพื่อโชว์ในหน้า Profile)
 *  - admin.routes.js  (หน้ารวมนักเรียน: ค้นหา/กรอง/เรียง)
 */

import { get, all } from "../db/connection.js";

/** อ่านข้อมูลนักเรียน 1 คนตาม ID (ใช้ตอน Login ตรวจว่ามีอยู่จริง) */
export const findById = (id) =>
  get(`SELECT * FROM Students WHERE student_id = ?`, [id]);

/** รายการนักเรียนทั้งหมด (ใช้กรณีทั่วไป/ทดสอบ) */
export const listAll = () =>
  all(`
    SELECT student_id, first_name, last_name, current_school, birth_date
    FROM Students
    ORDER BY student_id
  `);

/**
 * ค้นหารายชื่อนักเรียน + กรองตามโรงเรียน + เรียงลำดับ (ชื่อ/อายุ)
 * - q: ค้นหาใน first_name/last_name/student_id
 * - school: กรองโรงเรียนปัจจุบัน (ตรงตัว)
 * - sort: 'name' (ชื่อ-นามสกุล), 'age' (อายุมาก→น้อย)
 * ใช้ในหน้า Admin → "หน้ารวมนักเรียน"
 */
export const searchList = ({ q = "", school = "", sort = "name" } = {}) => {
  const where = [];
  const params = [];

  if (q) {
    where.push(`(first_name LIKE ? OR last_name LIKE ? OR student_id LIKE ?)`);
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (school) {
    where.push(`current_school = ?`);
    params.push(school);
  }

  const cond = where.length ? `WHERE ${where.join(" AND ")}` : "";

  // หมายเหตุ: SQLite ไม่มี AGE() จึงคำนวณอายุแบบคร่าว ๆ จากปี (พอสำหรับงานนี้)
  const order =
    sort === "age"
      ? `ORDER BY (strftime('%Y','now') - strftime('%Y',birth_date)) DESC, last_name ASC`
      : `ORDER BY last_name ASC, first_name ASC`;

  const sql = `
    SELECT student_id, first_name, last_name, current_school, birth_date
    FROM Students
    ${cond}
    ${order}
  `;
  return all(sql, params);
};

/**
 * ดึง "รายวิชาที่ลงแล้ว + เกรด" ของนักเรียน (โชว์ในหน้า Profile)
 * - JOIN RegisteredSubject กับ Subjects เพื่อเอาชื่อวิชา/หน่วยกิต/โหมดเกรด
 */
export const subjectsWithGrade = (studentId) =>
  all(
    `
  SELECT
    s.subject_id,
    s.name_th,
    s.credits,
    s.grade_mode,
    rs.grade
  FROM RegisteredSubject rs
  JOIN Subjects s ON s.subject_id = rs.subject_id
  WHERE rs.student_id = ?
  ORDER BY s.subject_id
`,
    [studentId]
  );