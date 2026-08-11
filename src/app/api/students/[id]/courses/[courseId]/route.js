/**
 * DELETE /api/students/:id/courses/:courseId   unenrol a student from a course
 *
 * The course itself is untouched - only this student's enrolment goes away.
 * To delete the course for everyone, use DELETE /api/courses/:courseId.
 */

import * as db from "@/lib/db";
import { fail, notFound, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export { OPTIONS } from "@/lib/http";

export async function DELETE(request, { params }) {
  const { id, courseId } = await params;

  const result = await db.transaction(async ({ read, write }) => {
    const students = await read("students");
    const student = students.find((row) => String(row.id) === String(id));
    if (!student) return { missing: true };

    const enrolled = student.courseIds.find(
      (enrolledId) => String(enrolledId) === String(courseId),
    );
    if (enrolled === undefined) return { notEnrolled: true };

    student.courseIds = student.courseIds.filter((enrolledId) => enrolledId !== enrolled);
    student.updatedAt = new Date().toISOString();
    await write("students", students);

    return { student };
  });

  if (result.missing) return notFound("student", id);
  if (result.notEnrolled) {
    return fail(404, "NOT_FOUND", `Student ${id} is not enrolled in course ${courseId}.`);
  }

  return ok(result.student);
}
