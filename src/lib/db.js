/**
 * A tiny "database" backed by JSON files in the `data` folder.
 *
 * Every route in this project talks to the seven functions exported at the
 * bottom of this file and nothing else. That means swapping this for a real
 * database later (Postgres, MongoDB, Prisma...) is a change to this one file.
 */

import fs from "node:fs/promises";
import path from "node:path";

import { seedCourses, seedStudents } from "@/lib/seed";

const DATA_DIR = path.join(process.cwd(), "data");

const COLLECTIONS = {
  students: { file: path.join(DATA_DIR, "students.json"), seed: seedStudents },
  courses: { file: path.join(DATA_DIR, "courses.json"), seed: seedCourses },
};

/* ------------------------------------------------------------------ *
 * Internals. These do NOT take the lock, so never call them from a
 * route. Routes use the exported functions further down.
 * ------------------------------------------------------------------ */

async function readRaw(name) {
  const { file, seed } = COLLECTIONS[name];

  try {
    // turbopackIgnore: the path is always inside `data`, but the bundler cannot
    // see that and would otherwise trace the whole project into the build.
    return JSON.parse(await fs.readFile(/* turbopackIgnore: true */ file, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;

    // First ever read: copy the seed data onto disk and hand it back.
    // structuredClone so nothing can accidentally mutate the seed module.
    const initial = structuredClone(seed);
    await writeRaw(name, initial);
    return initial;
  }
}

async function writeRaw(name, rows) {
  const { file } = COLLECTIONS[name];
  await fs.mkdir(DATA_DIR, { recursive: true });

  // Write to a temporary file and rename it into place. Renaming is atomic,
  // so a crash mid-write can never leave behind a half-written JSON file.
  const temporaryFile = `${file}.tmp`;
  await fs.writeFile(temporaryFile, JSON.stringify(rows, null, 2), "utf8");
  await fs.rename(temporaryFile, file);
}

/* ------------------------------------------------------------------ *
 * The lock.
 *
 * Reading a file, changing the data, and writing it back is three steps.
 * If two requests interleave those steps, one of them overwrites the
 * other. So every exported function below queues up behind the previous
 * one and runs on its own.
 *
 * WARNING: the lock is not reentrant. A locked function must never call
 * another locked function - it would wait forever for a lock it already
 * holds, and the request would hang with no error. For work that spans
 * several steps or both collections, use transaction() instead.
 *
 * Note this only serialises requests inside a single Node process. Two
 * dev servers writing the same `data` folder can still overwrite each
 * other. That is fine here, but it is not a real database transaction.
 * ------------------------------------------------------------------ */

let lock = Promise.resolve();

function withLock(job) {
  // `job` runs whether the previous job resolved or rejected...
  const result = lock.then(job, job);
  // ...and a failure must not poison the queue for everyone after it.
  lock = result.then(ignore, ignore);
  return result;
}

function ignore() {}

function nextId(rows) {
  return rows.reduce((biggest, row) => Math.max(biggest, row.id), 0) + 1;
}

// Ids arrive from the URL as strings ("/api/students/3"), so compare as strings.
function indexOfId(rows, id) {
  return rows.findIndex((row) => String(row.id) === String(id));
}

/* ------------------------------------------------------------------ *
 * The public API.
 * ------------------------------------------------------------------ */

/** Every row in a collection. */
export function list(name) {
  return withLock(() => readRaw(name));
}

/** One row, or null when nothing matches that id. */
export function findById(name, id) {
  return withLock(async () => {
    const rows = await readRaw(name);
    const index = indexOfId(rows, id);
    return index === -1 ? null : rows[index];
  });
}

/** Adds a row, filling in id, createdAt and updatedAt. Returns the new row. */
export function create(name, values) {
  return withLock(async () => {
    const rows = await readRaw(name);
    const now = new Date().toISOString();
    const row = { id: nextId(rows), ...values, createdAt: now, updatedAt: now };

    rows.push(row);
    await writeRaw(name, rows);
    return row;
  });
}

/** Merges `changes` into a row. Returns the updated row, or null if not found. */
export function update(name, id, changes) {
  return withLock(async () => {
    const rows = await readRaw(name);
    const index = indexOfId(rows, id);
    if (index === -1) return null;

    rows[index] = {
      ...rows[index],
      ...changes,
      id: rows[index].id, // the id is never changeable
      updatedAt: new Date().toISOString(),
    };

    await writeRaw(name, rows);
    return rows[index];
  });
}

/** Deletes a row. Returns the deleted row, or null if not found. */
export function remove(name, id) {
  return withLock(async () => {
    const rows = await readRaw(name);
    const index = indexOfId(rows, id);
    if (index === -1) return null;

    const [removed] = rows.splice(index, 1);
    await writeRaw(name, rows);
    return removed;
  });
}

/**
 * Runs several reads and writes while holding the lock once - needed when a
 * change touches more than one collection, like deleting a course and
 * unenrolling everyone from it.
 *
 * The callback receives `{ read, write }` and MUST use them. Calling
 * list()/create()/update()/remove() in here deadlocks (see the note above).
 */
export function transaction(job) {
  return withLock(() => job({ read: readRaw, write: writeRaw }));
}
