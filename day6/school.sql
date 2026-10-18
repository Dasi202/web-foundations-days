 PRAGMA foreign_keys = ON:

CREATE TABLE students (
    student_id  INTEGER      PRIMARY KEY,
    first_name  VARCHAR(50)  NOT NULL,
    last_name   VARCHAR(50)  NOT NULL,
    email       VARCHAR(100) NOT NULL UNIQUE          -- no two students share an email
);

CREATE TABLE courses (
    course_id   INTEGER      PRIMARY KEY,
    title       VARCHAR(100) NOT NULL,
    credits     INTEGER      NOT NULL CHECK (credits > 0)
);

-- Join table: resolves the many-to-many between students and courses
CREATE TABLE enrolments (
    enrolment_id INTEGER    PRIMARY KEY,
    student_id   INTEGER    NOT NULL,
    course_id    INTEGER    NOT NULL,
    enrolled_on  DATE       NOT NULL DEFAULT CURRENT_DATE,
    grade        VARCHAR(2),                          -- NULL until the student is graded

    CONSTRAINT fk_enrolments_student
        FOREIGN KEY (student_id) REFERENCES students (student_id),
    CONSTRAINT fk_enrolments_course
        FOREIGN KEY (course_id)  REFERENCES courses (course_id),

    -- a student cannot enrol on the same course twice
    CONSTRAINT uq_student_course UNIQUE (student_id, course_id)
);

-- ---------------------------------------------------------------
-- 2. INSERT statements
-- ---------------------------------------------------------------
INSERT INTO students (student_id, first_name, last_name, email) VALUES
    (1, 'Amina', 'Wanjiku', 'amina.wanjiku@example.com'),
    (2, 'Brian', 'Otieno',  'brian.otieno@example.com'),
    (3, 'Cynthia', 'Mutua', 'cynthia.mutua@example.com'),
    (4, 'David', 'Kamau',   'david.kamau@example.com');   -- deliberately not enrolled yet

INSERT INTO courses (course_id, title, credits) VALUES
    (1, 'Databases',        4),
    (2, 'Web Development',  5),
    (3, 'Algorithms',       4);

INSERT INTO enrolments (enrolment_id, student_id, course_id, enrolled_on, grade) VALUES
    (1, 1, 1, '2026-09-01', 'A'),
    (2, 1, 2, '2026-09-01', 'B'),
    (3, 2, 1, '2026-09-02', 'B'),
    (4, 2, 3, '2026-09-02', NULL),
    (5, 3, 1, '2026-09-03', 'C'),
    (6, 3, 2, '2026-09-03', NULL);

-- ---------------------------------------------------------------
-- 3. Queries
-- ---------------------------------------------------------------

-- Q1: All courses for one student (by name)
SELECT c.course_id, c.title, c.credits, e.grade
FROM students s
JOIN enrolments e ON e.student_id = s.student_id
JOIN courses c    ON c.course_id  = e.course_id
WHERE s.first_name = 'Amina'
  AND s.last_name  = 'Wanjiku'
ORDER BY c.title;

-- Q2: All students on one course
SELECT s.student_id, s.first_name, s.last_name, s.email, e.grade
FROM courses c
JOIN enrolments e ON e.course_id  = c.course_id
JOIN students s   ON s.student_id = e.student_id
WHERE c.title = 'Databases'
ORDER BY s.last_name, s.first_name;

-- Q3: Number of students per course
-- LEFT JOIN so a course with zero students still appears with a count of 0
SELECT c.course_id, c.title, COUNT(e.enrolment_id) AS student_count
FROM courses c
LEFT JOIN enrolments e ON e.course_id = c.course_id
GROUP BY c.course_id, c.title
ORDER BY student_count DESC, c.title;

-- Q4: Students who have no enrolments
SELECT s.student_id, s.first_name, s.last_name, s.email
FROM students s
LEFT JOIN enrolments e ON e.student_id = s.student_id
WHERE e.enrolment_id IS NULL;

-- Q5: Update one enrolment's grade
-- Brian Otieno has just been graded on Algorithms
UPDATE enrolments
SET grade = 'A'
WHERE student_id = (SELECT student_id FROM students WHERE email = 'brian.otieno@example.com')
  AND course_id  = (SELECT course_id  FROM courses  WHERE title = 'Algorithms');

-- Check the update worked
SELECT s.first_name, s.last_name, c.title, e.grade
FROM enrolments e
JOIN students s ON s.student_id = e.student_id
JOIN courses c  ON c.course_id  = e.course_id
WHERE s.email = 'brian.otieno@example.com'
  AND c.title = 'Algorithms';