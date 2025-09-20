CREATE TABLE IF NOT EXISTS TermCreditSummary (
  student_id CHAR(8) NOT NULL,
  term_no INTEGER NOT NULL CHECK (term_no IN (1,2)),
  total_credits INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (student_id, term_no)
);