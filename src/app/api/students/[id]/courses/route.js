/**
 * GET  /api/students/:id/courses   the courses this student is enrolled in
 * POST /api/students/:id/courses   enrol them in one more, body { "courseId": 2 }
 */

import * as db from "@/lib/db";
import {
  conflict,
  created,
  hasErrors,
  invalid,
  notFound,
  ok,
  paginate,
  parseListQuery,
  readBody,
} from "@/lib/http";
import { coursesOfStudent } from "@/lib/relations";
import { validateEnrollment } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export { OPTIONS } from "@/lib/http";

export async function GET(request, { params }) {
  const { id } = await params;

  const { page, limit, search, errors } = parseListQuery(request.nextUrl.searchParams);
  if (hasErrors(errors)) return invalid(errors);

  const student = await db.findById("students", id);
  if (!student) return notFound("student", id);

  let courses = coursesOfStudent(student, await db.list("courses"));

  if (search) {
    courses = courses.filter((course) =>
      `${course.code} ${course.title} ${course.instructor}`.toLowerCase().includes(search),
    );
  }

  const { rows, meta } = paginate(courses, page, limit);
  return ok(rows, meta);
}

export async function POST(request, { params }) {
  const { id } = await params;

  const { body, error } = await readBody(request);
  if (error) return error;

  // Enrolling is read-then-write on one student, so it runs inside a
  // transaction: no other request can change that student in between.
  // Only the read/write handed in here may be used - db.update() would deadlock.
  const result = await db.transaction(async ({ read, write }) => {
    const students = await read("students");
    const student = students.find((row) => String(row.id) === String(id));
    if (!student) return { missing: true };

    const courses = await read("courses");
    const { values, errors } = validateEnrollment(body, {
      courseIds: courses.map((course) => course.id),
    });
    if (hasErrors(errors)) return { errors };

    if (student.courseIds.includes(values.courseId)) {
      return { alreadyEnrolled: values.courseId };
    }

    student.courseIds.push(values.courseId);
    student.updatedAt = new Date().toISOString();
    await write("students", students);

    return { student };
  });

  if (result.missing) return notFound("student", id);
  if (result.errors) return invalid(result.errors);
  if (result.alreadyEnrolled) {
    return conflict(`Student ${id} is already enrolled in course ${result.alreadyEnrolled}.`);
  }

  return created(result.student);
}
