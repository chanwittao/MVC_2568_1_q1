/**
 * File: src/utils/validators.js
 * Role: รวมตัวช่วย validate พื้นฐาน (เช่น คำนวณอายุ)
 */

export function calcAge(dateStr) {
  // dateStr: YYYY-MM-DD
  const b = new Date(dateStr + "T00:00:00");
  const t = new Date();
  let age = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--;
  return age;
}