CREATE TABLE IF NOT EXISTS SubjectStructure (
  curriculum_id CHAR(8) NOT NULL,
  curriculum_name TEXT NOT NULL,
  department_name TEXT NOT NULL,
  subject_id CHAR(8) NOT NULL,
  term_no INTEGER NOT NULL CHECK (term_no IN (1,2)),
  PRIMARY KEY (curriculum_id, subject_id),
  FOREIGN KEY (subject_id) REFERENCES Subjects(subject_id)
);