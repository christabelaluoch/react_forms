/**
 * GET /api/courses/:id/students   everyone enrolled in this course
 *
 * The relationship is stored on the student (`courseIds`), so reading it from
 * the course side means filtering students by the id in the URL. That filter is
 * what a database would call a join.
 */

import * as db from "@/lib/db";
import { hasErrors, invalid, notFound, ok, paginate, parseListQuery } from "@/lib/http";
import { attachCourses, studentsInCourse } from "@/lib/relations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export { OPTIONS } from "@/lib/http";

export async function GET(request, { params }) {
  const { id } = await params;

  const { page, limit, search, include, errors } = parseListQuery(request.nextUrl.searchParams);
  if (hasErrors(errors)) return invalid(errors);

  const course = await db.findById("courses", id);
  if (!course) return notFound("course", id);

  const allStudents = await db.list("students");
  let students = studentsInCourse(course, allStudents);

  if (search) {
    students = students.filter((student) =>
      `${student.firstName} ${student.lastName} ${student.email}`.toLowerCase().includes(search),
    );
  }

  const { rows, meta } = paginate(students, page, limit);

  if (include.includes("courses")) {
    const courses = await db.list("courses");
    return ok(
      rows.map((student) => attachCourses(student, courses)),
      meta,
    );
  }

  return ok(rows, meta);
}
