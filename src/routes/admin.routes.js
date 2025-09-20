/**
 * File: src/routes/admin.routes.js
 * Role: ฝั่ง Admin — login/logout + หน้าจอที่ต้องเป็นแอดมิน
 */

import { Router } from "express";
import * as StudentRepo from "../repositories/StudentRepo.js";
import * as SubjectRepo from "../repositories/SubjectRepo.js";
import * as RegRepo from "../repositories/RegistrationRepo.js";
import { all, run } from "../db/connection.js";
import { migrateAndSeed } from "../db/setup.js";

const r = Router();

/* ========== A) Admin Login / Logout ========== */

// GET: ฟอร์ม login แอดมิน
r.get("/login", (req, res) => {
  if (req.session.user?.role === "admin") return res.redirect("/admin/students");
  return res.render("admin/login"); // ต้องมี name="username" และ name="password"
});

// POST: ตรวจรหัส (เดโม่แบบตายตัว)
r.post("/login", (req, res) => {
  console.log("[ADMIN LOGIN] body =", req.body); // ⬅️ ดูว่าฟอร์มส่งค่ามาไหม

  const { username, password } = req.body || {};

  // เดโม่: admin01 / admin
  if (username === "admin01" && password === "admin") {
    req.session.user = { role: "admin", id: "admin01" };
    req.session.flash = "เข้าสู่ระบบแอดมินสำเร็จ";
    return res.redirect("/admin/students");
  }

  req.session.flash = "เข้าสู่ระบบแอดมินไม่สำเร็จ (ลอง admin01 / admin)";
  return res.redirect("/admin/login");
});

// GET: dev-login (ทางลัดชั่วคราวเพื่อพิสูจน์ session — ลบออกได้ภายหลัง)
r.get("/dev-login", (_req, res) => {
  res.req.session.user = { role: "admin", id: "admin01" };
  res.req.session.flash = "เข้าสู่ระบบแอดมินแบบ dev-login";
  return res.redirect("/admin/students");
});

// GET: logout แอดมิน
r.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/admin/login"));
});

/* ========== B) middleware: ต้องเป็นแอดมิน ========= */
function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== "admin") {
    req.session.flash = "ต้องเป็นผู้ดูแลระบบ";
    return res.redirect("/admin/login");
  }
  next();
}

/* ========== C) หน้ารวมนักศึกษา ========= */
r.get("/students", requireAdmin, async (req, res) => {
  const { q = "", school = "", sort = "name" } = req.query;
  const list = await StudentRepo.searchList({ q, school, sort });

  const schools = await all(
    `SELECT DISTINCT current_school AS s
     FROM Students
     WHERE student_id <> 'admin01'
     ORDER BY s`
  );

  return res.render("admin/students", {
    list,
    q,
    school,
    sort,
    schools: schools.map((x) => x.s),
  });
});

/* ========== D) หน้าประวัตินักศึกษา ========= */
r.get("/students/:id", requireAdmin, async (req, res) => {
  const stu = await StudentRepo.findById(req.params.id);
  if (!stu) {
    req.session.flash = "ไม่พบนักศึกษา";
    return res.redirect("/admin/students");
  }
  const enrolled = await StudentRepo.subjectsWithGrade(stu.student_id);
  return res.render("admin/student_detail", { student: stu, enrolled });
});

/* ========== E) หน้ากรอกเกรด ========= */
r.get("/grades/:subjectId", requireAdmin, async (req, res) => {
  const subjectId = req.params.subjectId;
  const subject = await SubjectRepo.findById(subjectId);
  if (!subject) {
    req.session.flash = "ไม่พบรายวิชา";
    return res.redirect("/admin/students");
  }
  const list = await all(
    `SELECT rs.student_id, st.first_name, st.last_name, rs.grade
     FROM RegisteredSubject rs
     JOIN Students st ON st.student_id = rs.student_id
     WHERE rs.subject_id = ?
     ORDER BY st.last_name, st.first_name`,
    [subjectId]
  );
  const count = await RegRepo.countEnrolled(subjectId);
  return res.render("admin/grade_form", { subject, list, count: count?.cnt || 0 });
});

r.post("/grades/:subjectId", requireAdmin, async (req, res) => {
  const subjectId = req.params.subjectId;
  const { grades = {} } = req.body;
  for (const sid of Object.keys(grades)) {
    const g = (grades[sid] || "").trim();
    const ok = /^A|B\+?|C\+?|D\+?|F|S|U$/.test(g);
    if (!ok && g !== "") continue;
    await run(
      `UPDATE RegisteredSubject SET grade = ? WHERE student_id = ? AND subject_id = ?`,
      [g || null, sid, subjectId]
    );
  }
  req.session.flash = "บันทึกเกรดเรียบร้อย";
  return res.redirect(`/admin/grades/${subjectId}`);
});

/* ========== F) Reset DB ========= */
r.get("/tools/reset", requireAdmin, async (_req, res) => {
  try {
    await migrateAndSeed();
    res.req.session.flash = "รีเซ็ตฐานข้อมูลกลับค่าเริ่มต้นเรียบร้อย";
  } catch (e) {
    console.error(e);
    res.req.session.flash = "รีเซ็ตฐานข้อมูลไม่สำเร็จ";
  }
  return res.redirect("/admin/students");
});

export default r;