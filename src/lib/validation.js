/**
 * Input checking, written by hand so the project has no dependencies to
 * install. (A real project would usually reach for a library like Zod.)
 *
 * Both validators have the same shape:
 *
 *   validateStudent(body, options) -> { values, errors }
 *   validateCourse(body, options)  -> { values, errors }
 *
 *   values  the cleaned-up fields to save - trimmed, lowercased, and with
 *           anything the API does not recognise dropped
 *   errors  { fieldName: ["what is wrong"] }, empty when everything is fine
 *
 * `options.partial` is for PATCH: a field that is not in the body is simply
 * left alone rather than reported as missing.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COURSE_CODE_PATTERN = /^[A-Z]{2,6}[0-9]{2,4}$/;

/**
 * Checks one required text field and adds it to `values` when it is usable.
 * Returns nothing - it writes into the `values` and `errors` objects it is given.
 */
function checkText(field, raw, { values, errors, min, max }) {
  if (raw === undefined) {
    errors[field] = [`${field} is required.`];
    return;
  }

  if (typeof raw !== "string") {
    errors[field] = [`${field} must be text.`];
    return;
  }

  const trimmed = raw.trim();
  if (trimmed.length < min || trimmed.length > max) {
    errors[field] = [`${field} must be between ${min} and ${max} characters.`];
    return;
  }

  values[field] = trimmed;
}

/** True when a field should be checked: always on POST/PUT, only if sent on PATCH. */
function isPresent(body, field, partial) {
  return partial ? Object.hasOwn(body, field) : true;
}

/* ------------------------------ students ------------------------------ */

export function validateStudent(body, { partial = false, courseIds = [] } = {}) {
  const values = {};
  const errors = {};

  if (isPresent(body, "firstName", partial)) {
    checkText("firstName", body.firstName, { values, errors, min: 2, max: 50 });
  }

  if (isPresent(body, "lastName", partial)) {
    checkText("lastName", body.lastName, { values, errors, min: 2, max: 50 });
  }

  if (isPresent(body, "email", partial)) {
    if (body.email === undefined) {
      errors.email = ["email is required."];
    } else if (typeof body.email !== "string") {
      errors.email = ["email must be text."];
    } else {
      const email = body.email.trim().toLowerCase();
      if (!EMAIL_PATTERN.test(email)) {
        errors.email = ["email must look like name@example.com."];
      } else {
        values.email = email;
      }
    }
  }

  // courseIds is optional everywhere. A new student with no courseIds simply
  // starts out enrolled in nothing.
  if (Object.hasOwn(body, "courseIds")) {
    const courseIdErrors = checkCourseIds(body.courseIds, courseIds);
    if (courseIdErrors.length > 0) {
      errors.courseIds = courseIdErrors;
    } else {
      // Enrolling in the same course twice in one request is a typo, not an
      // error - keep the first of each.
      values.courseIds = [...new Set(body.courseIds)];
    }
  } else if (!partial) {
    values.courseIds = [];
  }

  return { values, errors };
}

function checkCourseIds(raw, existingCourseIds) {
  if (!Array.isArray(raw)) {
    return ["courseIds must be an array of course ids, for example [1, 3]."];
  }

  const errors = [];
  for (const courseId of raw) {
    if (!Number.isInteger(courseId)) {
      errors.push(`courseIds must contain whole numbers, but got ${JSON.stringify(courseId)}.`);
    } else if (!existingCourseIds.includes(courseId)) {
      errors.push(`Course ${courseId} does not exist.`);
    }
  }

  return errors;
}

/**
 * Checks the { courseId } body sent to POST /api/students/:id/courses.
 * Kept separate from validateStudent because it is a single value, not a list.
 */
export function validateEnrollment(body, { courseIds = [] } = {}) {
  const values = {};
  const errors = {};

  if (!Number.isInteger(body.courseId)) {
    errors.courseId = ["courseId must be a whole number, for example 2."];
  } else if (!courseIds.includes(body.courseId)) {
    errors.courseId = [`Course ${body.courseId} does not exist.`];
  } else {
    values.courseId = body.courseId;
  }

  return { values, errors };
}

/* ------------------------------- courses ------------------------------ */

export function validateCourse(body, { partial = false } = {}) {
  const values = {};
  const errors = {};

  if (isPresent(body, "code", partial)) {
    if (body.code === undefined) {
      errors.code = ["code is required."];
    } else if (typeof body.code !== "string") {
      errors.code = ["code must be text."];
    } else {
      const code = body.code.trim().toUpperCase();
      if (!COURSE_CODE_PATTERN.test(code)) {
        errors.code = ["code must look like WEB101 - 2 to 6 letters then 2 to 4 numbers."];
      } else {
        values.code = code;
      }
    }
  }

  if (isPresent(body, "title", partial)) {
    checkText("title", body.title, { values, errors, min: 3, max: 100 });
  }

  if (isPresent(body, "instructor", partial)) {
    checkText("instructor", body.instructor, { values, errors, min: 2, max: 60 });
  }

  if (isPresent(body, "credits", partial)) {
    if (body.credits === undefined) {
      errors.credits = ["credits is required."];
    } else if (!Number.isInteger(body.credits) || body.credits < 1 || body.credits > 6) {
      errors.credits = ["credits must be a whole number between 1 and 6."];
    } else {
      values.credits = body.credits;
    }
  }

  return { values, errors };
}
