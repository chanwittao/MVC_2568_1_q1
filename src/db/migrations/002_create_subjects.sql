CREATE TABLE IF NOT EXISTS Subjects (
  subject_id CHAR(8) PRIMARY KEY,        -- 0550**** = สาขา, 9064**** = GenEd
  name_th TEXT NOT NULL,
  name_en TEXT,
  credits INTEGER NOT NULL CHECK (credits > 0),
  instructor TEXT,
  prereq_subject_id CHAR(8),
  grade_mode TEXT NOT NULL CHECK (grade_mode IN ('LETTER','SU')),
  offered_term INTEGER NOT NULL CHECK (offered_term IN (1,2))
);