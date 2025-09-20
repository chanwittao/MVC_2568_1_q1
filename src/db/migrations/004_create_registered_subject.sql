CREATE TABLE IF NOT EXISTS RegisteredSubject (
  student_id CHAR(8) NOT NULL,
  subject_id CHAR(8) NOT NULL,
  grade TEXT CHECK (grade IN ('A','B+','B','C+','C','D+','D','F','S','U')),
  PRIMARY KEY (student_id, subject_id),
  FOREIGN KEY (student_id) REFERENCES Students(student_id),
  FOREIGN KEY (subject_id) REFERENCES Subjects(subject_id)
);