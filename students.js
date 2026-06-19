/* =========================================================
   routes/students.js
   ---------------------------------------------------------
   This file defines all 5 REST endpoints for "students":

     GET    /api/students        -> read ALL students
     GET    /api/students/:id    -> read ONE student
     POST   /api/students        -> create a new student
     PUT    /api/students/:id    -> update an existing student
     DELETE /api/students/:id    -> delete a student

   STORAGE STRATEGY (important for the viva):
   We keep the student list as a normal JavaScript array in memory
   (this satisfies requirement #6 "Store data temporarily in a
   JavaScript array"). But every time the array changes (create,
   update, delete), we ALSO save it back to data/students.json
   (this satisfies the "OR JSON file" half of requirement #6, and
   means your data survives a server restart -- a pure in-memory-only
   array would reset to the seed data every time you run `npm start`).

   We use the SYNCHRONOUS fs functions (readFileSync/writeFileSync)
   on purpose. They are simpler to read and reason about for a
   college assignment than the async/Promise-based versions, and for
   a tiny JSON file like this the performance difference is
   irrelevant. (In a real production app with many users, you'd use
   a real database instead of a JSON file anyway.)
   ========================================================= */

const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// Path to our "database" file. __dirname = the folder this file is in
// (routes/), so "../data/students.json" steps up one level into data/.
const DATA_FILE = path.join(__dirname, "..", "data", "students.json");


/**
 * readStudents
 * Reads the JSON file from disk and parses it into a real JS array.
 * Called at the start of every route, so each request always sees
 * the latest saved data.
 */
function readStudents() {
  const fileContents = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(fileContents);
}

/**
 * writeStudents
 * Takes a JS array and saves it back to the JSON file, pretty-printed
 * (the ", null, 2" part) so the file stays human-readable if you open
 * it yourself to check the data.
 */
function writeStudents(students) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(students, null, 2));
}


/* ---------------------------------------------------------
   GET /api/students
   READ all students.
   --------------------------------------------------------- */
router.get("/", (req, res) => {
  const students = readStudents();
  res.json(students);
});


/* ---------------------------------------------------------
   GET /api/students/:id
   READ a single student by id.
   ":id" is a ROUTE PARAMETER -- Express captures whatever is in that
   position in the URL and makes it available as req.params.id.
   --------------------------------------------------------- */
router.get("/:id", (req, res) => {
  const students = readStudents();

  // URL params always arrive as strings, so convert to a Number
  // before comparing against the numeric `id` field in our data.
  const id = Number(req.params.id);
  const student = students.find((s) => s.id === id);

  if (!student) {
    // 404 = "Not Found" -- the correct HTTP status for a missing record
    return res.status(404).json({ error: `No student found with id ${id}` });
  }
  res.json(student);
});


/* ---------------------------------------------------------
   POST /api/students
   CREATE a new student.
   The new student's data arrives in req.body as JSON (this only
   works because server.js has app.use(express.json()) turned on --
   that middleware is what parses the incoming JSON text into a real
   JS object for us).
   --------------------------------------------------------- */
router.post("/", (req, res) => {
  const { name, rollNo, email, department, year } = req.body;

  // ---- Basic server-side validation ----
  // Never trust the front-end alone! Even though our script.js
  // validates the form, a malicious or buggy client could send
  // anything directly to this endpoint, so we double-check here too.
  if (!name || !rollNo || !email) {
    return res.status(400).json({ error: "name, rollNo and email are required." });
  }

  const students = readStudents();

  // Generate a new id that's always one higher than the current
  // highest id. (Simple and fine for a college project; a real
  // database would auto-generate this for you.)
  const newId = students.length > 0
    ? Math.max(...students.map((s) => s.id)) + 1
    : 1;

  const newStudent = {
    id: newId,
    name,
    rollNo,
    email,
    department: department || "Not specified",
    year: year || null
  };

  students.push(newStudent);
  writeStudents(students);

  // 201 = "Created" -- the correct HTTP status for a successful POST
  res.status(201).json(newStudent);
});


/* ---------------------------------------------------------
   PUT /api/students/:id
   UPDATE an existing student completely (replace its fields).
   --------------------------------------------------------- */
router.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const students = readStudents();

  const index = students.findIndex((s) => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: `No student found with id ${id}` });
  }

  const { name, rollNo, email, department, year } = req.body;
  if (!name || !rollNo || !email) {
    return res.status(400).json({ error: "name, rollNo and email are required." });
  }

  // Keep the same id, overwrite everything else with the new values.
  students[index] = { id, name, rollNo, email, department: department || "Not specified", year: year || null };
  writeStudents(students);

  res.json(students[index]);
});


/* ---------------------------------------------------------
   DELETE /api/students/:id
   DELETE a student.
   --------------------------------------------------------- */
router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  const students = readStudents();

  const index = students.findIndex((s) => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: `No student found with id ${id}` });
  }

  const [deletedStudent] = students.splice(index, 1); // remove 1 item at `index`
  writeStudents(students);

  res.json({ message: "Student deleted successfully.", student: deletedStudent });
});


module.exports = router;
