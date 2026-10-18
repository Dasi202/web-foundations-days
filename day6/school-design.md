# School Database Design

## Tables

**students** stores one row per person studying at the school: `student_id` (primary key), first and last name, and `email`. The email is `UNIQUE` so two students can never share an address, and every column is `NOT NULL` because a student record is meaningless without them.

**courses** stores one row per course offered: `course_id` (primary key), `title` and `credits`. A `CHECK` ensures credits are positive.

**enrolments** records the fact that a particular student is taking a particular course. It holds its own primary key (`enrolment_id`), two foreign keys (`student_id` references `students`, `course_id` references `courses`), the `enrolled_on` date and the `grade`. The grade is nullable because a student has no grade until they are assessed. A `UNIQUE (student_id, course_id)` constraint stops the same student enrolling on the same course twice.

## Relationships

- **students to enrolments: one-to-many.** One student can have many enrolments, but each enrolment belongs to exactly one student.
- **courses to enrolments: one-to-many.** One course can have many enrolments, but each enrolment belongs to exactly one course.
- **students to courses: many-to-many.** A student can take many courses, and a course has many students. This is the result of the two one-to-many relationships above.

A **join table** (`enrolments`) is needed because a relational column holds a single value. We cannot put a list of course ids inside a student row, or a list of student ids inside a course row, without breaking first normal form and losing the ability to enforce foreign keys. The join table turns the many-to-many into two simple one-to-many relationships, and it is also the natural place to store data that belongs to the *pairing* itself, such as the grade and enrolment date.

## Index

I would add an index on `enrolments(course_id)`:

```sql
CREATE INDEX idx_enrolments_course_id ON enrolments (course_id);
```

The existing `UNIQUE (student_id, course_id)` constraint already creates an index that speeds up searches by student, but it cannot efficiently serve queries that filter or group by `course_id` alone, such as "all students on one course" or "number of students per course". Foreign key columns are also joined on constantly, so without this index the database would scan the whole `enrolments` table as it grows.

## SQL or NoSQL?

I would choose a SQL (relational) database for this system. The data is highly structured and its shape is stable: students, courses and enrolments all have well-defined fields. The relationships between them are central, and the queries we need (joins across tables, counts per course, finding students with no enrolments) are exactly what SQL is built for. A relational database also enforces integrity for us: foreign keys prevent enrolments for students or courses that do not exist, and unique constraints prevent duplicate emails and double enrolments, and transactions keep updates such as grade changes consistent. A NoSQL document store would be tempting if we needed a flexible schema or massive horizontal scale, but a school's data is small, relational and needs strong consistency, so those benefits would not outweigh the loss of joins and built-in constraints.