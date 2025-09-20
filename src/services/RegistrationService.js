/**
 * File: src/services/RegistrationService.js
 * Role: Business Logic (Service Layer) สำหรับ "ลงทะเบียนรายวิชา"
 * Covers (ตาม Requirement):
 *  - อายุผู้สมัคร ≥ 15 ปี
 *  - รายวิชาต้อง "เปิดในเทอม" ที่ลง (offered_term)
 *  - ตรวจวิชาบังคับก่อน (prerequisite): ต้อง "มีเกรด" และ "ผ่าน"
 *      * โหมด LETTER: ผ่านคือ {A,B+,B,C+,C,D+,D} (F ไม่ผ่าน)
 *      * โหมด S/U   : ผ่านคือ S (U ไม่ผ่าน)
 *  - เพดานหน่วยกิตต่อเทอม ≤ 22 หน่วยกิต
 *  - บันทึกรายวิชาที่ลง + อัปเดตสรุปหน่วยกิต
 *  - ใช้ร่วมกับ Controller: POST /student/enroll  แล้ว Controller จะ redirect ไปหน้า Profile
 */

import * as StudentRepo from "../repositories/StudentRepo.js";
import * as SubjectRepo from "../repositories/SubjectRepo.js";
import * as RegRepo from "../repositories/RegistrationRepo.js";
import { calcAge } from "../utils/validators.js";

const CREDIT_CAP = 22;

/** helper: ตีความว่าเกรดนี้ "ผ่าน" หรือไม่ ตามโหมดเกรดของ "วิชาที่เป็น prereq" */
function isPassedGrade(grade, prereqGradeMode) {
  if (!grade) return false; // "ยังไม่มีเกรด" ⇒ ถือว่าไม่ผ่าน (ตาม Requirement)
  if (prereqGradeMode === "SU") return grade === "S";
  // LETTER
  return !["F"].includes(grade);
}

/**
 * ลงทะเบียนรายวิชา 1 ตัวให้กับนักเรียน
 * @param {string} studentId - รหัสนักเรียน 8 หลัก (ขึ้นต้น 69)
 * @param {string} subjectId - รหัสวิชา 8 หลัก (0550**** หรือ 9064****)
 * @param {number} term      - เทอมที่ลง (1 หรือ 2)
 */
export async function register(studentId, subjectId, term) {
  // 1) ตรวจว่านักเรียนมีอยู่จริง + อายุ ≥ 15
  const stu = await StudentRepo.findById(studentId);
  if (!stu) throw new Error("ไม่พบนักเรียน");
  if (calcAge(stu.birth_date) < 15) throw new Error("นักเรียนต้องมีอายุอย่างน้อย 15 ปี");

  // 2) ตรวจว่ามีรายวิชานี้จริง + เปิดในเทอมนี้
  const sub = await SubjectRepo.findById(subjectId);
  if (!sub) throw new Error("ไม่พบรายวิชา");
  if (Number(sub.offered_term) !== Number(term)) {
    throw new Error("วิชานี้ไม่ได้เปิดในเทอมที่เลือก");
  }

  // 3) ป้องกันลงซ้ำเดิม
  const already = await RegRepo.isRegistered(studentId, subjectId);
  if (already) throw new Error("คุณลงวิชานี้ไปแล้ว");

  // 4) ถ้ามีวิชาบังคับก่อน (prereq) ⇒ ต้อง "มีเกรด" และ "ผ่าน"
  if (sub.prereq_subject_id) {
    const prereqSub = await SubjectRepo.findById(sub.prereq_subject_id);
    const prereqResult = await RegRepo.getGrade(studentId, sub.prereq_subject_id); // อาจเป็น null ถ้ายังไม่เคยลง
    const ok = isPassedGrade(prereqResult?.grade, prereqSub?.grade_mode || "LETTER");
    if (!ok) throw new Error("ยังไม่ผ่านวิชาบังคับก่อน");
  }

  // 5) ตรวจเพดานหน่วยกิต (≤ 22 หน่วยกิต/เทอม)
  const cur = await RegRepo.getTermCredits(studentId, term);
  const currentCredits = cur?.c || 0;
  const newCredits = currentCredits + Number(sub.credits);
  if (newCredits > CREDIT_CAP) throw new Error("เกินเพดาน 22 หน่วยกิตต่อเทอม");

  // 6) บันทึกลงทะเบียน + อัปเดตยอดหน่วยกิตเทอม
  await RegRepo.register(studentId, subjectId);
  await RegRepo.setTermCredits(studentId, term, newCredits);

  // เสร็จสิ้น (Controller จะทำการ redirect ไปหน้า Profile ตาม Requirement ข้อ 4)
  return { ok: true, total_credits: newCredits };
}