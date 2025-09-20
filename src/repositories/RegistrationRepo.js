/**
 * File: src/repositories/RegistrationRepo.js
 * Role: Repository สำหรับจัดการข้อมูล "ลงทะเบียน/เกรด" และ "ยอดหน่วยกิตต่อเทอม"
 * Tables: RegisteredSubject, TermCreditSummary
 * Used by: RegistrationService, Admin (ฟอร์มกรอกเกรด), Student (สรุป)
 */

import { all, get, run } from "../db/connection.js";

/** อ่านยอดหน่วยกิตของนักเรียนในเทอม */
export const getTermCredits = (studentId, term) =>
  get(
    `SELECT total_credits AS c
     FROM TermCreditSummary
     WHERE student_id = ? AND term_no = ?`,
    [studentId, term]
  );

/** อัปเดตยอดหน่วยกิตของนักเรียนในเทอม */
export const setTermCredits = (studentId, term, newC) =>
  run(
    `UPDATE TermCreditSummary
     SET total_credits = ?
     WHERE student_id = ? AND term_no = ?`,
    [newC, studentId, term]
  );

/** เช็กว่าลงวิชานี้ไปแล้วหรือยัง */
export const isRegistered = async (studentId, subjectId) => {
  const row = await get(
    `SELECT 1 FROM RegisteredSubject WHERE student_id = ? AND subject_id = ?`,
    [studentId, subjectId]
  );
  return !!row;
};

/** อ่านเกรดของวิชาหนึ่ง ๆ (ใช้ตรวจ prereq) */
export const getGrade = (studentId, subjectId) =>
  get(
    `SELECT grade FROM RegisteredSubject WHERE student_id = ? AND subject_id = ?`,
    [studentId, subjectId]
  );

/** บันทึกการลงทะเบียน (ยังไม่มีเกรด) */
export const register = (studentId, subjectId) =>
  run(
    `INSERT OR IGNORE INTO RegisteredSubject (student_id, subject_id)
     VALUES (?, ?)`,
    [studentId, subjectId]
  );

/** จำนวนคนที่ลงทะเบียนในวิชานี้ (ใช้โชว์ในหน้า Admin/Grade Form) */
export const countEnrolled = (subjectId) =>
  get(
    `SELECT COUNT(*) AS cnt
     FROM RegisteredSubject
     WHERE subject_id = ?`,
    [subjectId]
  );