/**
 * File: src/routes/curriculum.routes.js
 * Role: แสดงโครงสร้างหลักสูตรปี 1 (บังคับคณะ + GenEd บังคับ) แยกตามเทอม
 * View: views/curriculum/structure.ejs
 */

import { Router } from "express";
import { all, get } from "../db/connection.js";

const r = Router();

/** GET /curriculum/:id : ดูโครงสร้างของหลักสูตร */
r.get("/curriculum/:id", async (req, res) => {
  const id = req.params.id;

  // ดึงชื่อหลักสูตร/ภาควิชาแบบง่าย ๆ จาก SubjectStructure
  const meta = await get(
    `SELECT curriculum_id, curriculum_name, department
     FROM SubjectStructure WHERE curriculum_id=? LIMIT 1`,
    [id]
  );
  if (!meta) {
    req.session.flash = "ไม่พบรหัสหลักสูตรที่ระบุ";
    return res.redirect("/");
  }

  // วิชาบังคับ “ทุกตัว” ของปี 1 แยกตามเทอม
  const t1 = await all(
    `SELECT s.subject_id, s.name_th, s.credits, s.instructor
       FROM SubjectStructure ss
       JOIN Subjects s ON s.subject_id = ss.subject_id
      WHERE ss.curriculum_id=? AND ss.term_no=1
      ORDER BY s.subject_id`,
    [id]
  );
  const t2 = await all(
    `SELECT s.subject_id, s.name_th, s.credits, s.instructor
       FROM SubjectStructure ss
       JOIN Subjects s ON s.subject_id = ss.subject_id
      WHERE ss.curriculum_id=? AND ss.term_no=2
      ORDER BY s.subject_id`,
    [id]
  );

  res.render("curriculum/structure", { meta, t1, t2 });
});

export default r;