/**
 * GET    /api/students/:id   one student, with ?include=courses
 * PUT    /api/students/:id   replace them - every field required
 * PATCH  /api/students/:id   update some fields - send only what changes
 * DELETE /api/students/:id   delete them
 */

import * as db from "@/lib/db";
import {
  conflict,
  hasErrors,
  invalid,
  notFound,
  ok,
  parseListQuery,
  readBody,
} from "@/lib/http";
import { attachCourses } from "@/lib/relations";
import { validateStudent } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export { OPTIONS } from "@/lib/http";

export async function GET(request, { params }) {
  const { id } = await params; // params is a Promise in Next.js - it must be awaited

  const student = await db.findById("students", id);
  if (!student) return notFound("student", id);

  const { include } = parseListQuery(request.nextUrl.searchParams);
  if (include.includes("courses")) {
    return ok(attachCourses(student, await db.list("courses")));
  }

  return ok(student);
}

export function PUT(request, context) {
  return save(request, context, { partial: false });
}

export function PATCH(request, context) {
  return save(request, context, { partial: true });
}

async function save(request, { params }, { partial }) {
  const { id } = await params;

  const existing = await db.findById("students", id);
  if (!existing) return notFound("student", id);

  const { body, error } = await readBody(request);
  if (error) return error;

  const courses = await db.list("courses");
  const { values, errors } = validateStudent(body, {
    partial,
    courseIds: courses.map((course) => course.id),
  });
  if (hasErrors(errors)) return invalid(errors);

  if (partial && Object.keys(values).length === 0) {
    return invalid({}, "Provide at least one field to update.");
  }

  // Emails stay unique - but a student keeping their own email is not a clash.
  if (values.email) {
    const students = await db.list("students");
    const clash = students.some(
      (student) => student.email === values.email && student.id !== existing.id,
    );
    if (clash) return conflict(`A student with the email ${values.email} already exists.`);
  }

  return ok(await db.update("students", id, values));
}

export async function DELETE(request, { params }) {
  const { id } = await params;

  // Nothing else in the data refers to a student, so this is a plain delete -
  // unlike deleting a course, which has to unenrol people first.
  const removed = await db.remove("students", id);
  if (!removed) return notFound("student", id);

  return ok(removed);
}
