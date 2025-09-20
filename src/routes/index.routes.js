// File: src/routes/index.routes.js
import { Router } from "express";
import * as StudentRepo from "../repositories/StudentRepo.js";

const r = Router();

/** helper: เด้งไปหน้าแรกตามบทบาท */
function gotoHomeByRole(req, res) {
  if (!req.session.user) return res.redirect("/");
  if (req.session.user.role === "admin") return res.redirect("/admin/students");
  return res.redirect("/student/profile");
}

/** GET / : ถ้ายังไม่ล็อกอิน → หน้า login นักศึกษา */
r.get("/", (req, res) => {
  if (req.session.user) return gotoHomeByRole(req, res);
  return res.render("student/login"); // views/student/login.ejs
});

/** POST /login : ล็อกอินนักศึกษาแบบง่าย (รหัสขึ้นต้น 69 ยาว 8) */
r.post("/login", async (req, res) => {
  try {
    const { student_id } = req.body;
    if (!/^69\d{6}$/.test(student_id || "")) {
      req.session.flash = "รหัสนักศึกษา 8 หลัก ต้องขึ้นต้นด้วย 69";
      return res.redirect("/");
    }
    const student = await StudentRepo.findById(student_id);
    if (!student) {
      req.session.flash = "ไม่พบนักศึกษา (ลอง 69000001 จากข้อมูลตัวอย่าง)";
      return res.redirect("/");
    }
    req.session.user = { role: "student", id: student_id };
    return res.redirect("/student/profile");
  } catch (err) {
    console.error(err);
    req.session.flash = "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";
    return res.redirect("/");
  }
});

/** GET /admin/login : แบบฟอร์มแอดมิน */
r.get("/admin/login", (req, res) => {
  if (req.session.user?.role === "admin") return res.redirect("/admin/students");
  return res.render("admin/login");
});

/** POST /admin/login : ล็อกอินแอดมินเดโม่ (admin01 / admin) */
r.post("/admin/login", (req, res) => {
  const { username, password } = req.body || {};
  if (username === "admin01" && password === "admin") {
    req.session.user = { role: "admin", id: username };
    return res.redirect("/admin/students");
  }
  req.session.flash = "เข้าสู่ระบบแอดมินไม่สำเร็จ (ลอง admin01 / admin)";
  return res.redirect("/admin/login");
});

/** GET /logout : ออกจากระบบ (ใช้ได้ทั้ง student/admin) */
r.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

export default r;