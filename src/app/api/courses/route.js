/**
 * GET  /api/courses   list courses, with ?page ?limit ?search
 * POST /api/courses   create a course
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
import { validateCourse } from "@/lib/validation";

export const runtime = "nodejs"; // this route reads and writes files, so it needs Node
export const dynamic = "force-dynamic"; // never bake a snapshot of the data into the build
export { OPTIONS } from "@/lib/http"; // answers the browser's CORS preflight

export async function GET(request) {
  const { page, limit, search, errors } = parseListQuery(request.nextUrl.searchParams);
  if (hasErrors(errors)) return invalid(errors);

  let courses = await db.list("courses");

  if (search) {
    courses = courses.filter((course) =>
      `${course.code} ${course.title} ${course.instructor}`.toLowerCase().includes(search),
    );
  }

  const { rows, meta } = paginate(courses, page, limit);
  return ok(rows, meta);
}

export async function POST(request) {
  const { body, error } = await readBody(request);
  if (error) return error;

  const { values, errors } = validateCourse(body);
  if (hasErrors(errors)) return invalid(errors);

  // Two courses may not share a code. The value itself is valid, it just
  // collides with something already stored - that is a 409, not a 400.
  const courses = await db.list("courses");
  if (courses.some((course) => course.code === values.code)) {
    return conflict(`A course with the code ${values.code} already exists.`);
  }

  return created(await db.create("courses", values));
}
