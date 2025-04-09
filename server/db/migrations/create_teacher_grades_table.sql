-- Create teacher_grades table if it doesn't exist
CREATE TABLE IF NOT EXISTS teacher_grades (
  id SERIAL PRIMARY KEY,
  teacher_id VARCHAR(255) NOT NULL UNIQUE,
  grade NUMERIC(5,2) NOT NULL,
  qa_evaluator VARCHAR(255) NOT NULL,
  evaluation_ids INTEGER[] DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on teacher_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_teacher_grades_teacher_id ON teacher_grades(teacher_id);

-- Insert sample data for testing if table is empty
INSERT INTO teacher_grades (teacher_id, grade, qa_evaluator)
SELECT 't.pearl@little-champions.com', 4, 't.daniel'
WHERE NOT EXISTS (SELECT 1 FROM teacher_grades LIMIT 1);

INSERT INTO teacher_grades (teacher_id, grade, qa_evaluator)
SELECT 't.ronna@little-champions.com', 3.28, 't.daniel'
WHERE NOT EXISTS (SELECT 1 FROM teacher_grades WHERE teacher_id = 't.ronna@little-champions.com');

INSERT INTO teacher_grades (teacher_id, grade, qa_evaluator)
SELECT 't.yvette@little-champions.com', 3.8, 't.daniel'
WHERE NOT EXISTS (SELECT 1 FROM teacher_grades WHERE teacher_id = 't.yvette@little-champions.com'); 