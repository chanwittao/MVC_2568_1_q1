/**
 * File: src/routes/register.routes.js
 * Role: สมัครนักศึกษาใหม่ (อายุ >= 15 ปี)
 * View: views/student/register.ejs
 */

import { Router } from "express";
import { run, get } from "../db/connection.js";

const r = Router();

/** GET: ฟอร์มสมัครใหม่ */
r.get("/register", (req, res) => {
  res.render("student/register");
});

/** helper: คำนวณอายุแบบง่าย ๆ จาก YYYY-MM-DD */
function ageFrom(birth) {
  const b = new Date(birth + "T00:00:00");
  const t = new Date();
  let age = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--;
  return age;
}

/** POST: รับสมัครใหม่ */
r.post("/register", async (req, res) => {
  try {
    const { student_id, prefix, first_name, last_name, birth_date, current_school, email, curriculum_id } = req.body;

    // ตรวจรูปแบบรหัสนักศึกษา 69xxxxxx
    if (!/^69\d{6}$/.test(student_id || "")) {
      req.session.flash = "รหัสนักศึกษาต้องเป็นเลข 8 หลัก และขึ้นต้นด้วย 69";
      return res.redirect("/register");
    }
    // ตรวจรูปแบบหลักสูตร 8 หลัก ตัวแรกไม่ใช่ 0
    if (!/^[1-9]\d{7}$/.test(curriculum_id || "")) {
      req.session.flash = "รหัสหลักสูตรต้องเป็นเลข 8 หลัก และตัวแรกไม่เป็น 0";
      return res.redirect("/register");
    }
    // อายุ >= 15
    if (ageFrom(birth_date) < 15) {
      req.session.flash = "นักศึกษาต้องมีอายุอย่างน้อย 15 ปี";
      return res.redirect("/register");
    }
    // ห้ามซ้ำ
    const exist = await get(`SELECT 1 FROM Students WHERE student_id=?`, [student_id]);
    if (exist) {
      req.session.flash = "รหัสนักศึกษานี้ถูกใช้แล้ว";
      return res.redirect("/register");
    }

    await run(
      `INSERT INTO Students(student_id,prefix,first_name,last_name,birth_date,current_school,email,curriculum_id)
       VALUES (?,?,?,?,?,?,?,?)`,
      [student_id, prefix, first_name, last_name, birth_date, current_school, email, curriculum_id]
    );

    req.session.flash = "สมัครสำเร็จ! กรุณาล็อกอินด้วยรหัสที่สมัครไว้";
    return res.redirect("/");
  } catch (e) {
    console.error(e);
    req.session.flash = "สมัครไม่สำเร็จ";
    return res.redirect("/register");
  }
});

export default r;