/**
 * GET    /api/courses/:id   one course
 * PUT    /api/courses/:id   replace it - every field required
 * PATCH  /api/courses/:id   update some fields - send only what changes
 * DELETE /api/courses/:id   delete it, and unenrol every student from it
 */

import * as db from "@/lib/db";
import { conflict, hasErrors, invalid, notFound, ok, readBody } from "@/lib/http";
import { validateCourse } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export { OPTIONS } from "@/lib/http";

export async function GET(request, { params }) {
  const { id } = await params; // params is a Promise in Next.js - it must be awaited

  const course = await db.findById("courses", id);
  if (!course) return notFound("course", id);

  return ok(course);
}

export function PUT(request, context) {
  return save(request, context, { partial: false });
}

export function PATCH(request, context) {
  return save(request, context, { partial: true });
}

async function save(request, { params }, { partial }) {
  const { id } = await params;

  const existing = await db.findById("courses", id);
  if (!existing) return notFound("course", id);

  const { body, error } = await readBody(request);
  if (error) return error;

  const { values, errors } = validateCourse(body, { partial });
  if (hasErrors(errors)) return invalid(errors);

  if (partial && Object.keys(values).length === 0) {
    return invalid({}, "Provide at least one field to update.");
  }

  if (values.code) {
    const courses = await db.list("courses");
    const clash = courses.some(
      (course) => course.code === values.code && course.id !== existing.id,
    );
    if (clash) return conflict(`A course with the code ${values.code} already exists.`);
  }

  return ok(await db.update("courses", id, values));
}

export async function DELETE(request, { params }) {
  const { id } = await params;

  // Deleting a course touches both collections: the course goes, and its id has
  // to come off every student's courseIds - otherwise students would point at a
  // course that no longer exists. Both writes happen under one lock.
  //
  // Only the `read` and `write` handed in here may be used. Calling db.remove()
  // or db.update() inside a transaction deadlocks.
  const result = await db.transaction(async ({ read, write }) => {
    const courses = await read("courses");
    const index = courses.findIndex((course) => String(course.id) === String(id));
    if (index === -1) return null;

    const [removed] = courses.splice(index, 1);

    const students = await read("students");
    let unenrolledStudents = 0;

    for (const student of students) {
      if (student.courseIds.includes(removed.id)) {
        student.courseIds = student.courseIds.filter((courseId) => courseId !== removed.id);
        student.updatedAt = new Date().toISOString();
        unenrolledStudents += 1;
      }
    }

    await write("courses", courses);
    await write("students", students);

    return { removed, unenrolledStudents };
  });

  if (!result) return notFound("course", id);

  // 200 with the deleted course rather than an empty 204, so that
  // `await response.json()` works the same way as on every other endpoint.
  return ok(result.removed, { unenrolledStudents: result.unenrolledStudents });
}
