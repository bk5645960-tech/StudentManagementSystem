# StudentHub — Student Management System (Task 5)

A beginner-friendly **Node.js + Express** REST API with a **vanilla
HTML/CSS/JS** front-end, demonstrating full CRUD (Create, Read,
Update, Delete) using the **Fetch API**. Data is stored in a JSON
file, so it survives server restarts but needs no real database.

---

## 1. Folder Structure

```
student-management-system/
├── package.json          ← project info + dependencies
├── server.js              ← Express app entry point
├── routes/
│   └── students.js        ← all 5 CRUD route handlers
├── data/
│   └── students.json      ← our "database" (3 seed records included)
├── public/                ← the front-end, served as static files
│   ├── index.html         ← form + table markup
│   ├── style.css          ← styling
│   └── script.js          ← Fetch API calls + dynamic DOM rendering
└── README.md              ← this file
```

**Why does the front-end live inside a `public` folder instead of
next to `server.js`?**
Express has a built-in convention: `app.use(express.static("public"))`
serves everything inside `public/` directly as web files. Keeping
front-end files there (rather than flat in the project root) makes it
crystal clear which files are "server code" and which are "things a
browser downloads" — and it means **one server, one port** serves
both your API and your UI, with zero CORS headaches.

---

## 2. Setup Instructions

You need [Node.js](https://nodejs.org) installed (any LTS version, 18+).

```bash
# 1. Move into the project folder
cd student-management-system

# 2. Install the one dependency (Express)
npm install

# 3. Start the server
npm start
```

You should see:
```
✅ Server running at http://localhost:3000
📚 API base URL:    http://localhost:3000/api/students
```

Now open **http://localhost:3000** in your browser — that's it. The
front-end and API are both running from this one address.

---

## 3. API Reference

Base URL: `http://localhost:3000/api/students`

| Method | Endpoint | Purpose | Body required? |
|---|---|---|---|
| GET | `/api/students` | Get all students | No |
| GET | `/api/students/:id` | Get one student by id | No |
| POST | `/api/students` | Create a new student | Yes |
| PUT | `/api/students/:id` | Update an existing student | Yes |
| DELETE | `/api/students/:id` | Delete a student | No |

**Example request body for POST / PUT:**
```json
{
  "name": "Bharath Kumar",
  "rollNo": "CSE2026001",
  "email": "bharath.kumar@example.com",
  "department": "Computer Science",
  "year": 4
}
```
`name`, `rollNo` and `email` are required — the server responds with
`400 Bad Request` if any are missing.

**You can test the API directly with curl, without even opening the
front-end** (handy to show in a viva that the API works
independently of the UI):
```bash
curl http://localhost:3000/api/students

curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{"name":"New Student","rollNo":"CSE2026050","email":"new@example.com"}'
```

---

## 4. Fetch API Examples (from `public/script.js`)

These are the exact 4 patterns used in the project — useful to point
to directly during a viva walkthrough.

```javascript
// READ — GET
const response = await fetch("/api/students");
const students = await response.json();

// CREATE — POST
const response = await fetch("/api/students", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name, rollNo, email })
});

// UPDATE — PUT
const response = await fetch(`/api/students/${id}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name, rollNo, email })
});

// DELETE
const response = await fetch(`/api/students/${id}`, { method: "DELETE" });
```

Note the two-step pattern every time: `fetch()` resolves with a
**Response object**, then `.json()` resolves with the actual parsed
data. Forgetting the second `await` is one of the most common
beginner mistakes (see the table below).

---

## 5. How "no page refresh" actually works

1. User submits the form → `event.preventDefault()` stops the
   browser's normal full-page submit behaviour.
2. `script.js` sends the data via `fetch()` instead.
3. On success, `script.js` calls `getStudents()` again and rebuilds
   the `<tbody>` element directly with `document.createElement` /
   `innerHTML` — pure DOM manipulation, no navigation, no reload.

---

## 6. Common Errors & Fixes

| Problem | Why it happens | Fix |
|---|---|---|
| `Error: Cannot find module 'express'` | You ran `node server.js` before installing dependencies | Run `npm install` first, inside the project folder |
| `Error: listen EADDRINUSE: address already in use :::3000` | Another process (maybe a previous run of this same server) is already using port 3000 | Stop the other process, or change the port: `PORT=4000 npm start`, then open `http://localhost:4000` |
| Page loads but the table never fills in, console shows a CORS error | You opened `public/index.html` directly by double-clicking it (file:// URL) instead of going through the Express server | Always access the app via `http://localhost:3000` — opening the HTML file directly bypasses the server entirely, so `fetch("/api/students")` has nowhere valid to point to |
| `TypeError: response.json is not a function` | Forgot that `fetch()` returns a Response, not the data — only `.json()` gives you the actual JS object, and it must be awaited too | Always do `const response = await fetch(...)` then `const data = await response.json()` — two separate `await`s |
| POST/PUT request reaches the server but `req.body` is `undefined` | `express.json()` middleware is missing, or `Content-Type: application/json` header wasn't sent | Confirm `server.js` has `app.use(express.json())` BEFORE your routes are mounted, and that every fetch POST/PUT call includes the `headers: { "Content-Type": "application/json" }` line |
| New student added through the form disappears after restarting the server | You're using a version of the code that keeps data ONLY in memory, never writing it back to the JSON file | Our `writeStudents()` function in `routes/students.js` saves to `data/students.json` after every create/update/delete — confirm that function is actually being called in each route |
| `SyntaxError: Unexpected token` when starting the server | A trailing comma or missing bracket, usually in `data/students.json` if you hand-edited it | JSON does NOT allow trailing commas (unlike JS objects) — validate the file at a site like jsonlint.com, or just delete it and let it regenerate (you'll lose existing edits though, so back it up first) |
| Clicking "Edit" fills the form, but submitting creates a NEW record instead of updating | The hidden `#studentId` field didn't get set, so the form thinks it's still in "Add" mode | Check `handleEditClick()` in `script.js` — it must set `studentIdInput.value = student.id` before the form can know it's editing |
| 404 errors on `/style.css` or `/script.js` | These files aren't inside the `public` folder, or `express.static` isn't pointed at the right path | Confirm `server.js` has `app.use(express.static(path.join(__dirname, "public")))` and that `style.css`/`script.js` are literally inside the `public/` folder |

---

## 7. Possible Viva Questions (quick prep)

- *"Why JSON file storage instead of a real database like MySQL/MongoDB?"*
  → The assignment scope is client-server communication and CRUD
  mechanics, not database design. A JSON file is the simplest thing
  that still genuinely persists data across restarts, which a plain
  in-memory array alone would not do.

- *"What's the difference between PUT here and PATCH?"*
  → PUT (used here) replaces the entire record with the new data sent.
  PATCH would only update the specific fields included in the request,
  leaving everything else untouched. We use PUT because our form
  always sends every field anyway.

- *"Why use `express.Router()` instead of writing all routes directly
  in `server.js`?"*
  → Keeps `server.js` focused on server setup only, while
  `routes/students.js` focuses purely on student-related logic — this
  separation scales much better once a real app has many resources
  (students, courses, teachers, etc.), each with their own router file.
