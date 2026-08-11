/**
 * GET  /api/students   list students, with ?page ?limit ?search ?include=courses
 * POST /api/students   create a student
 */

import * as db from "@/lib/db";
import {
  conflict,
  created,
  hasErrors,
  invalid,
  ok,
  paginate,
  parseListQuery,
  readBody,
} from "@/lib/http";
import { attachCourses } from "@/lib/relations";
import { validateStudent } from "@/lib/validation";

export const runtime = "nodejs"; // this route reads and writes files, so it needs Node
export const dynamic = "force-dynamic"; // never bake a snapshot of the data into the build
export { OPTIONS } from "@/lib/http"; // answers the browser's CORS preflight

export async function GET(request) {
  const { page, limit, search, include, errors } = parseListQuery(request.nextUrl.searchParams);
  if (hasErrors(errors)) return invalid(errors);

  let students = await db.list("students");

  if (search) {
    students = students.filter((student) =>
      `${student.firstName} ${student.lastName} ${student.email}`.toLowerCase().includes(search),
    );
  }

  // Page first, then expand: only the students actually being returned need
  // their courses looked up.
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

export async function POST(request) {
  const { body, error } = await readBody(request);
  if (error) return error;

  // The validator needs the list of real course ids so it can reject an
  // enrolment in a course that does not exist.
  const courses = await db.list("courses");
  const { values, errors } = validateStudent(body, {
    courseIds: courses.map((course) => course.id),
  });
  if (hasErrors(errors)) return invalid(errors);

  const students = await db.list("students");
  if (students.some((student) => student.email === values.email)) {
    return conflict(`A student with the email ${values.email} already exists.`);
  }

  return created(await db.create("students", values));
}
