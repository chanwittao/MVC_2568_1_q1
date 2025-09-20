export const LETTER = new Set(['A','B+','B','C+','C','D+','D','F']);
export const SU = new Set(['S','U']);
export const isValidGrade = (grade, mode) =>
  mode === 'LETTER' ? LETTER.has(grade) : SU.has(grade);