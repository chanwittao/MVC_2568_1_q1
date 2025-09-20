/**
 * File: src/routes/student.routes.js
 * Role: Controller ฝั่งนักศึกษา (โปรไฟล์ + ลงทะเบียน)
 * Focus (อัปเดต):
 *   - ไม่แนะนำ GenEd บังคับ
 *   - บังคับเพดาน 22 หน่วยกิต/เทอม
 */

import { Router } from "express";
import { all, get, run } from "../db/connection.js";
import * as StudentRepo from "../repositories/StudentRepo.js";

const r = Router();

/** middleware: ต้องเป็นนักศึกษา */
function requireStudent(req, res, next) {
  if (!req.session.user || req.session.user.role !== "student") {
    req.session.flash = "กรุณาเข้าสู่ระบบนักศึกษา";
    return res.redirect("/");
  }
  next();
}

/** helper: ดึงข้อมูลนักศึกษาปัจจุบัน */
async function currentStudent(req) {
  const id = req.session.user.id;
  return await StudentRepo.findById(id);
}

/** GET /student/profile : หน้าโปรไฟล์ + รายวิชาที่ลงแล้ว */
r.get("/profile", requireStudent, async (req, res) => {
  const stu = await currentStudent(req);
  const subjects = await all(
    `SELECT s.subject_id, s.name_th, s.credits, s.grade_mode, rs.grade
     FROM RegisteredSubject rs 
     JOIN Subjects s ON s.subject_id = rs.subject_id
     WHERE rs.student_id = ?
     ORDER BY s.subject_id`,
    [stu.student_id]
  );
  res.render("student/profile", { student: stu, subjects });
});

/** GET /student/enroll?term=1|2[&q=0550] : หน้าลงทะเบียน */
r.get("/enroll", requireStudent, async (req, res) => {
  const stu = await currentStudent(req);
  const term = Number(req.query.term || 1);
  const q = (req.query.q || "").trim();

  // รายวิชาที่นักศึกษาลงไปแล้ว (ใช้กันซ้ำ และคัดออกจากลิสต์)
  const enrolledIds = await all(
    `SELECT subject_id FROM RegisteredSubject WHERE student_id = ?`,
    [stu.student_id]
  );
  const taken = new Set(enrolledIds.map(x => x.subject_id));

  // 1) รายวิชาบังคับของหลักสูตร (เฉพาะเทอมนี้) ที่ "ยังไม่ได้ลง"
  const compulsory = await all(
    `SELECT s.* 
     FROM SubjectStructure ss
     JOIN Subjects s ON s.subject_id = ss.subject_id
     WHERE ss.curriculum_id = ? AND ss.term_no = ?
     ORDER BY s.subject_id`,
    [stu.curriculum_id, term]
  );
  const compulsoryToShow = compulsory.filter(s => !taken.has(s.subject_id));

  // 2) GenEd แนะนำ (9064xxxx) เฉพาะเทอมนี้ โดย "ไม่รวม GenEd บังคับ"
  //    - GenEd บังคับที่ต้องตัดออก:
  //        เทอม 1: 90641001 (Charm School), 90644007 (Eng 1)
  //        เทอม 2: 90641002 (DIQ),         90644008 (Eng 2)
  const GENED_COMP_T1 = ["90641001", "90644007"];
  const GENED_COMP_T2 = ["90641002", "90644008"];
  const deny = term === 1 ? GENED_COMP_T1 : GENED_COMP_T2;

  // เงื่อนไขค้นหา (ค้นจาก subject_id)
  const like = q ? `${q}%` : "%";

  const rawGened = await all(
    `SELECT s.* 
     FROM Subjects s
     WHERE s.subject_id LIKE '9064%' 
       AND s.offered_term = ?
       AND s.subject_id LIKE ?
       -- ไม่เสนอ GenEd บังคับ
       AND s.subject_id NOT IN (${deny.map(() => "?").join(",")})
       -- ไม่เสนอวิชาที่ลงแล้ว
       AND s.subject_id NOT IN (
            SELECT subject_id FROM RegisteredSubject WHERE student_id = ?
       )
       -- เผื่ออนาคต ถ้าหลักสูตรมี GenEd บังคับใน SubjectStructure ก็ยังตัดออกด้วย
       AND s.subject_id NOT IN (
            SELECT subject_id 
            FROM SubjectStructure 
            WHERE curriculum_id = ? AND term_no = ?
       )
     ORDER BY s.subject_id`,
    [term, like, ...deny, stu.student_id, stu.curriculum_id, term]
  );

  res.render("student/enroll", {
    term,
    q,
    compulsory: compulsoryToShow,
    gened: rawGened,
  });
});

/**
 * POST /student/enroll
 * body: { subject_id, term }
 *
 * ธุรกิจสำคัญ:
 *  - ห้ามซ้ำ
 *  - เช็กวิชาบังคับก่อน (ต้องมีเกรดแล้ว และไม่ใช่ F/U)
 *  - เช็กเพดาน 22 หน่วยกิต/เทอม (รวมวิชาที่ลงไปแล้ว + วิชาที่กำลังขอเพิ่ม)
 */
r.post("/enroll", requireStudent, async (req, res) => {
  const stu = await currentStudent(req);
  const subjectId = (req.body.subject_id || "").trim();
  const term = Number(req.body.term || 1);

  // ดึงรายละเอียดวิชาที่จะลง
  const sub = await get(`SELECT * FROM Subjects WHERE subject_id = ?`, [subjectId]);
  if (!sub) {
    req.session.flash = "ไม่พบรายวิชา";
    return res.redirect(`/student/enroll?term=${term}`);
  }

  // 1) กันลงซ้ำ
  const exist = await get(
    `SELECT 1 FROM RegisteredSubject WHERE student_id = ? AND subject_id = ?`,
    [stu.student_id, subjectId]
  );
  if (exist) {
    req.session.flash = "คุณลงวิชานี้ไปแล้ว";
    return res.redirect(`/student/enroll?term=${term}`);
  }

  // 2) เช็กวิชาบังคับก่อน (ถ้ามี)
  if (sub.prereq_subject_id) {
    const has = await get(
      `SELECT grade 
       FROM RegisteredSubject 
       WHERE student_id = ? AND subject_id = ?`,
      [stu.student_id, sub.prereq_subject_id]
    );
    // ต้อง "มีเกรด" และไม่ใช่ F/U (ถือว่าผ่าน)
    const pass = has && has.grade && !/^F|U$/i.test(has.grade);
    if (!pass) {
      req.session.flash = `วิชานี้ต้องผ่าน ${sub.prereq_subject_id} ก่อน (ต้องมีเกรดแล้ว)`;
      return res.redirect(`/student/enroll?term=${term}`);
    }
  }

  // 3) เพดาน 22 หน่วยกิต/เทอม
  const row = await get(
    `SELECT COALESCE(SUM(s.credits),0) AS sum_cr
     FROM RegisteredSubject rs
     JOIN Subjects s ON s.subject_id = rs.subject_id
     WHERE rs.student_id = ? AND s.offered_term = ?`,
    [stu.student_id, term]
  );
  const currentCredits = row?.sum_cr || 0;
  const after = currentCredits + sub.credits;
  if (after > 22) {
    req.session.flash = `หน่วยกิตรวมเกิน 22 นก. (ปัจจุบัน ${currentCredits} + วิชานี้ ${sub.credits} = ${after})`;
    return res.redirect(`/student/enroll?term=${term}`);
  }

  // 4) ผ่านทุกเงื่อนไข → ลงทะเบียน
  await run(
    `INSERT INTO RegisteredSubject (student_id, subject_id, grade) VALUES (?, ?, NULL)`,
    [stu.student_id, subjectId]
  );

  req.session.flash = "เพิ่มรายวิชาเรียบร้อย";
  // ตาม requirement: เมื่อลงทะเบียนสำเร็จ กลับไปหน้าประวัตินักศึกษา
  return res.redirect("/student/profile");
});

export default r;