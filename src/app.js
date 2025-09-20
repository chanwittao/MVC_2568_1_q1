/**
 * File: src/app.js
 * Role: Application bootstrap (เริ่มต้นเซิร์ฟเวอร์ Express)
 * Pattern: MVC – กำหนด View Engine (EJS + Layouts), Static, Session, Middleware, Routes
 * Why: เป็นจุดรวมการตั้งค่าระบบทั้งหมด แล้วโยนงานไปที่ Controller ตามเส้นทางของเว็บ
 */

import express from "express";
import path from "path";
import morgan from "morgan";
import session from "express-session";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import expressLayouts from "express-ejs-layouts"; // ใช้ layout กลางสำหรับทุกหน้า

// โหลดค่าจาก .env (PORT, DB_PATH, SESSION_SECRET)
dotenv.config();

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* -----------------------------
 * 1) View Engine (EJS + Layouts)
 * -----------------------------
 * - ใช้ EJS เป็นเทมเพลต
 * - เปิดใช้งาน express-ejs-layouts เพื่อให้ทุกหน้าใช้ layout กลาง `views/layouts/main.ejs`
 * - หมายเหตุ: เมื่อเปิดใช้งาน layout กลางแล้ว หน้า child views ไม่ต้องเขียน <% layout('...') %> เอง
 */
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "layouts/main"); // โฟลเดอร์ `src/views/layouts/main.ejs`

/* -----------------------------
 * 2) Middleware พื้นฐาน
 * -----------------------------
 * - parse body (form/json), log request, จัดการ session แบบง่าย ๆ
 */
app.use(express.urlencoded({ extended: true })); // รับข้อมูลจาก <form>
app.use(express.json());                          // รับ JSON body
app.use(morgan("dev"));                           // แสดง log ใน terminal ตอนพัฒนา
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret", // คีย์เข้ารหัส session
    resave: false,
    saveUninitialized: false
  })
);

/* -----------------------------------------------------
 * 3) Static Files (CSS/JS รูปภาพ) จากโฟลเดอร์ /public
 * -----------------------------------------------------
 * - ทำให้ไฟล์ใน `public/` เปิดผ่านเว็บได้ เช่น /css/main.css
 */
app.use(express.static(path.join(__dirname, "..", "public")));

/* -------------------------------------------------------------------
 * 4) Flash message แบบง่าย (เก็บข้อความใน session แสดงครั้งเดียว)
 * -------------------------------------------------------------------
 * - ใช้แสดงแจ้งเตือน เช่น “เพิ่มรายวิชาเรียบร้อย”, “เกิน 22 หน่วยกิต”
 * - ตัวแปร res.locals.flash จะถูกใช้ใน layout เพื่อโชว์ข้อความ
 */
app.use((req, res, next) => {
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  res.locals.user = req.session.user || null; // ส่ง user ปัจจุบันเข้า view ทุกหน้า
  next();
});

/* ------------------------------------
 * 5) Routes (Controller layer เข้ารับงาน)
 * ------------------------------------
 * - indexRoutes: หน้าแรก + login/logout
 * - studentRoutes: หน้านักเรียน (โปรไฟล์ + ลงทะเบียน)
 * - adminRoutes: หน้าผู้ดูแล (รวมนักเรียน + กรอกเกรด)
 */
import studentRoutes from "./routes/student.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import indexRoutes from "./routes/index.routes.js";
import registerRoutes from "./routes/register.routes.js";     
import curriculumRoutes from "./routes/curriculum.routes.js"; 

app.use("/", indexRoutes);
app.use("/", registerRoutes);           // /register (guest)
app.use("/", curriculumRoutes);         // /curriculum/:id (ทุกคนดูได้)
app.use("/student", studentRoutes);
app.use("/admin", adminRoutes);

/* -----------------------------
 * 6) Start Server (PORT จาก .env)
 * -----------------------------
 */
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});