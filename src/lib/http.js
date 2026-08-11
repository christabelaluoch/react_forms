/**
 * Shared helpers for building API responses.
 *
 * Every response in this API has the same shape, so a client only ever has to
 * learn two rules:
 *
 *   success   { "data": ... }                  and sometimes  "meta"
 *   failure   { "error": { "code", "message" } }  and on a 400, "fields"
 */

import { NextResponse } from "next/server";

/**
 * CORS lets a page served from another address (a React app on :5173, a plain
 * HTML file, an online sandbox) call this API from the browser. "*" means any
 * origin is allowed.
 *
 * Note: "*" cannot be combined with credentials. If cookies or
 * `credentials: "include"` are ever added, this has to echo back the caller's
 * Origin header instead of using a wildcard.
 */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function send(body, status) {
  return NextResponse.json(body, { status, headers: CORS_HEADERS });
}

/* ---------------------------- successes ---------------------------- */

/** 200. Pass `meta` for a list response (pagination info). */
export function ok(data, meta) {
  return send(meta ? { data, meta } : { data }, 200);
}

/** 201, for a resource that was just created. */
export function created(data) {
  return send({ data }, 201);
}

/* ----------------------------- failures ---------------------------- */

export function fail(status, code, message, fields) {
  return send({ error: { code, message, ...(fields ? { fields } : {}) } }, status);
}

/** 400 - the values sent are wrong. `fields` says which ones and why. */
export function invalid(fields, message = "Some fields are invalid.") {
  return fail(400, "VALIDATION_ERROR", message, fields);
}

/** 404 - no such resource. */
export function notFound(what, id) {
  return fail(404, "NOT_FOUND", `No ${what} found with id ${id}.`);
}

/** 409 - the value is fine, but it clashes with data that already exists. */
export function conflict(message) {
  return fail(409, "CONFLICT", message);
}

/* ------------------------------ CORS ------------------------------- */

/**
 * Browsers send an OPTIONS request ("preflight") before any POST, PUT, PATCH
 * or DELETE that carries JSON. Next.js answers OPTIONS automatically but
 * without CORS headers, so every route file re-exports this one instead:
 *
 *   export { OPTIONS } from "@/lib/http";
 */
export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/* --------------------------- request body -------------------------- */

/**
 * Reads and checks the JSON body. Returns `{ body }` on success or
 * `{ error }` - an already-built 400 response - on failure.
 *
 * request.json() throws on an empty or malformed body (for example
 * `curl -X POST` with no -d), which would otherwise become a 500.
 */
export async function readBody(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return { error: fail(400, "INVALID_JSON", "The request body is not valid JSON.") };
  }

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { error: fail(400, "INVALID_BODY", "The request body must be a JSON object.") };
  }

  return { body };
}

/* -------------------------- query strings -------------------------- */

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/**
 * Reads ?page, ?limit, ?search and ?include off a URL.
 *
 * Bad numbers are reported as errors rather than quietly corrected, so that a
 * typo in a query string is visible instead of silently ignored.
 */
export function parseListQuery(searchParams) {
  const errors = {};

  let page = DEFAULT_PAGE;
  const rawPage = searchParams.get("page");
  if (rawPage !== null) {
    page = Number(rawPage);
    if (rawPage.trim() === "" || !Number.isInteger(page) || page < 1) {
      errors.page = ["page must be a whole number of 1 or more."];
    }
  }

  let limit = DEFAULT_LIMIT;
  const rawLimit = searchParams.get("limit");
  if (rawLimit !== null) {
    limit = Number(rawLimit);
    if (rawLimit.trim() === "" || !Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
      errors.limit = [`limit must be a whole number between 1 and ${MAX_LIMIT}.`];
    }
  }

  const search = (searchParams.get("search") ?? "").trim().toLowerCase();

  const include = (searchParams.get("include") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return { page, limit, search, include, errors };
}

/** Cuts a list down to one page and describes where that page sits. */
export function paginate(rows, page, limit) {
  const total = rows.length;
  const start = (page - 1) * limit;

  return {
    rows: rows.slice(start, start + limit),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

/** True when a validator or query parser reported at least one problem. */
export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}
