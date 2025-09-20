# ระบบลงทะเบียนนักศึกษา (MVC + Node.js + SQLite)

โปรเจกต์นี้เป็นระบบจำลองการลงทะเบียนเรียนของนักศึกษา โดยใช้ **Node.js + Express + EJS + SQLite3**  
พัฒนาในรูปแบบ **MVC (Model - View - Controller)**

---

## ✨ ฟีเจอร์หลัก

- สมัครนักศึกษาใหม่ (ตรวจสอบอายุ ≥ 15 ปี)
- เข้าสู่ระบบนักศึกษา / แอดมิน
- นักศึกษา
  - ดูโปรไฟล์ตนเอง
  - ตรวจสอบรายวิชาที่ลงทะเบียนแล้ว
  - ลงทะเบียนเรียน (เทอม 1 และ 2)
    - มีการบังคับ **รายวิชาหลักสูตร** + **GenEd บังคับ**
    - จำกัดเพดาน **ไม่เกิน 22 หน่วยกิต/เทอม**
    - ตรวจสอบ prerequisite (ต้องผ่านวิชาก่อนหน้า)
- แอดมิน
  - ดูข้อมูลนักศึกษาทั้งหมด
  - ลบ/รีเซ็ตฐานข้อมูล (Reset Default)

---

## 📂 โครงสร้างโปรเจกต์

src/
├── db/
│    ├── connection.js          # เชื่อมต่อ SQLite
│    └── seed/199_seed_sample_users.sql  # สร้างข้อมูลตัวอย่าง
├── repositories/
│    └── StudentRepo.js         # Query เกี่ยวกับ Student
├── routes/
│    ├── student.routes.js      # Controller ฝั่งนักศึกษา
│    ├── admin.routes.js        # Controller ฝั่งแอดมิน
│    └── auth.routes.js         # Login / Logout / Register
├── views/
│    ├── layouts/main.ejs       # Layout หลัก
│    ├── student/               # หน้านักศึกษา
│    ├── admin/                 # หน้าแอดมิน
│    └── auth/                  # หน้าเข้าสู่ระบบ
└── server.js                   # จุดเริ่มต้นโปรเจกต์

---

## ⚙️ วิธีติดตั้งและรันโค้ด

### 1. ติดตั้งเครื่องมือที่จำเป็น
- [Node.js LTS](https://nodejs.org/)
- npm (มากับ Node แล้ว)
- SQLite3

### 2. Clone โปรเจกต์
```bash
git clone <repo-url>
cd <project-folder>

### 3. ติดตั้ง dependencies
npm install

### 4. migrate + seed ข้อมูล
npm run migrate   # สร้างตาราง
npm run seed      # ใส่ข้อมูลเริ่มต้น

### 5. รันเซิร์ฟเวอร์
npm run dev


💻 วิธีรันบน Windows
	1.	เปิด Command Prompt หรือ PowerShell
	2.	เข้าโฟลเดอร์โปรเจกต์
	3.	รันคำสั่งตามขั้นตอนด้านบน (npm install → npm run migrate → npm run seed → npm run dev)
	4.	เปิดเบราว์เซอร์: http://localhost:3000

⸻

🍏 วิธีรันบน macOS / Linux
	1.	เปิด Terminal
	2.	เข้าโฟลเดอร์โปรเจกต์
	3.	รันคำสั่งเหมือนกัน (npm install → npm run migrate → npm run seed → npm run dev)
	4.	เปิดเบราว์เซอร์: http://localhost:3000



🔑 บัญชีสำหรับทดสอบ

นักศึกษา
	•	รหัส: 69000001
	•	อีเมล: s1@example.com

แอดมิน
	•	รหัส: admin01
	•	อีเมล: admin@example.com



🗄️ โครงสร้างฐานข้อมูล (สำคัญ)
	•	Students
	•	student_id (8 หลัก เริ่มด้วย 69)
	•	prefix, first_name, last_name
	•	birth_date (ต้องอายุ ≥ 15 ปี)
	•	current_school
	•	email
	•	curriculum_id (8 หลัก ไม่ขึ้นต้น 0)
	•	Subjects
	•	subject_id
	•	name_th
	•	credits
	•	teacher
	•	prereq_subject_id (nullable)
	•	offered_term
	•	grade_mode
	•	SubjectStructure
	•	curriculum_id
	•	curriculum_name
	•	department
	•	subject_id
	•	term_no
	•	RegisteredSubject
	•	student_id
	•	subject_id
	•	grade
	•	TermCreditSummary
	•	student_id
	•	term_no
	•	total_credits

⸻

📝 หมายเหตุ
	•	ระบบนี้เป็น mock-up เพื่อทดสอบ การออกแบบ MVC + การเขียน SQL
	•	มีการเพิ่ม GenEd บังคับ ลงในตารางรายวิชาบังคับ (term 1, term 2)
	•	มีระบบสมัครนักศึกษาใหม่ และตรวจสอบอายุอัตโนมัติ



# EXAM_NOTES

## 📝 ภาพรวมระบบ MVC (Model--View--Controller)

-   **Model**
    -   จัดการข้อมูลในฐานข้อมูล SQLite\
    -   ตารางหลัก: Students, Subjects, SubjectStructure,
        RegisteredSubject, TermCreditSummary\
    -   มีการกำหนดความสัมพันธ์ เช่น Student ↔ RegisteredSubject ↔
        Subjects
-   **View (EJS Templates)**
    -   `student/profile.ejs` → แสดงข้อมูลส่วนตัวนักศึกษา +
        วิชาที่ลงทะเบียนแล้ว\
    -   `student/enroll.ejs` → ลงทะเบียนเรียน แบ่งรายวิชาบังคับ และ
        GenEd แนะนำ\
    -   `admin/students.ejs` →
        ผู้ดูแลระบบดูข้อมูลนักศึกษา/รีเซ็ตฐานข้อมูล\
    -   `register.ejs` → สมัครนักศึกษาใหม่ (ตรวจสอบอายุ ≥ 15 ปี)
-   **Controller (Express Routes)**
    -   `student.routes.js`
        -   GET /student/profile → แสดงโปรไฟล์นักศึกษา\
        -   GET /student/enroll → แสดงหน้าลงทะเบียน (บังคับ + GenEd
            แนะนำ)\
        -   POST /student/enroll → ตรวจสอบเงื่อนไข (ไม่ซ้ำ, prereq, ≤ 22
            นก.) แล้วบันทึก\
    -   `admin.routes.js`
        -   GET /admin/students → ดูนักศึกษาทั้งหมด\
        -   GET /admin/tools/reset → รีเซ็ตฐานข้อมูล\
    -   `auth.routes.js`
        -   จัดการเข้าสู่ระบบ/ออกจากระบบ\
    -   `register.routes.js`
        -   จัดการสมัครนักศึกษาใหม่

------------------------------------------------------------------------

## ✅ ฟีเจอร์ที่ทำเสร็จ

1.  ระบบสมัครนักศึกษาใหม่ (อายุ ≥ 15 ปี)\
2.  เข้าสู่ระบบนักศึกษา/ผู้ดูแลระบบ\
3.  โปรไฟล์นักศึกษา + ปุ่มดูโครงสร้างหลักสูตร\
4.  ระบบลงทะเบียนรายวิชา
    -   รายวิชาบังคับ (รวม GenEd บังคับ)\
    -   รายวิชา GenEd แนะนำ (เลือกเสรี)\
    -   ตรวจสอบหน่วยกิตรวม ≤ 22\
    -   ตรวจสอบ prereq ต้องผ่านก่อน\
    -   ห้ามลงซ้ำ\
5.  ระบบผู้ดูแล (Admin)
    -   ดูข้อมูลนักศึกษา\
    -   รีเซ็ตฐานข้อมูล (seed ใหม่)

------------------------------------------------------------------------

## 📌 คำถาม

-   **Schema Design**:
    -   ทำไมแยก SubjectStructure ออกมาต่างหาก → เพื่อรองรับหลายหลักสูตร,
        หลายปีการศึกษา\
    -   ทำไม RegisteredSubject แยก grade ออกมา →
        รองรับการบันทึกผลการเรียนย้อนหลัง
-   **Business Rules**:
    -   ทำไมจำกัด 22 นก./เทอม → ตามเกณฑ์ มาตรฐานมหาวิทยาลัย\
    -   ทำไมบังคับ GenEd → เป็นเงื่อนไขของโครงสร้างหลักสูตร\
    -   การตรวจสอบ prerequisite →
        ป้องกันการลงเรียนวิชาที่พื้นฐานยังไม่ผ่าน
-   **การขยายระบบ**:
    -   ถ้าเพิ่มปี 2, ปี 3 → แค่ใส่ SubjectStructure เพิ่ม
        ไม่ต้องแก้โค้ดหลัก\
    -   ถ้าเพิ่มหลักสูตรใหม่ → แค่เพิ่ม record ใน SubjectStructure และ
        Students

------------------------------------------------------------------------

