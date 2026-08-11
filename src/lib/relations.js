/**
 * A student stores only the ids of the courses they are enrolled in:
 *
 *   { "id": 1, "firstName": "Amina", "courseIds": [1, 3] }
 *
 * Asking for ?include=courses swaps nothing out - it adds a `courses` array
 * with the full course objects alongside the ids, so a client that was already
 * reading `courseIds` keeps working.
 */

export function attachCourses(student, courses) {
  return {
    ...student,
    courses: student.courseIds
      .map((courseId) => courses.find((course) => course.id === courseId))
      .filter(Boolean),
  };
}

/** Every course a student is enrolled in. */
export function coursesOfStudent(student, courses) {
  return courses.filter((course) => student.courseIds.includes(course.id));
}

/** Every student enrolled in a course - the same relationship read backwards. */
export function studentsInCourse(course, students) {
  return students.filter((student) => student.courseIds.includes(course.id));
}
