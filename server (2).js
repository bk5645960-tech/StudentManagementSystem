/* =========================================================
   server.js
   ---------------------------------------------------------
   This is the entry point of our backend. Run it with:
       node server.js
   or
       npm start

   What it does, top to bottom:
   1. Creates an Express app.
   2. Turns on middleware to understand incoming JSON (req.body).
   3. Serves our front-end (the "public" folder) as static files,
      so visiting http://localhost:3000 shows index.html directly --
      no separate front-end server needed.
   4. Mounts our student CRUD routes under the path /api/students.
   5. Starts listening for requests on a port.
   ========================================================= */

const express = require("express");
const path = require("path");
const studentRoutes = require("./routes/students");

const app = express();
const PORT = process.env.PORT || 3000;

/* ---------- MIDDLEWARE ----------
   express.json() reads the raw text body of incoming requests and,
   if it's valid JSON, parses it into a JS object available as
   req.body. Without this line, req.body would be undefined inside
   our POST/PUT route handlers. */
app.use(express.json());

/* ---------- STATIC FRONT-END ----------
   Anything inside the "public" folder is served directly as-is.
   e.g. public/index.html  -> http://localhost:3000/
        public/style.css   -> http://localhost:3000/style.css
        public/script.js   -> http://localhost:3000/script.js
   This is what lets our front-end and back-end run from ONE server
   on ONE port, which conveniently also avoids any CORS issues
   (CORS problems happen when front-end and back-end are on
   different origins/ports -- see the README's "Common Errors" table). */
app.use(express.static(path.join(__dirname, "public")));

/* ---------- API ROUTES ----------
   Every route defined inside routes/students.js gets prefixed with
   "/api/students" here. So router.get("/") in that file actually
   becomes GET /api/students, router.get("/:id") becomes
   GET /api/students/:id, and so on. */
app.use("/api/students", studentRoutes);

/* ---------- START THE SERVER ---------- */
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`📚 API base URL:    http://localhost:${PORT}/api/students`);
});
