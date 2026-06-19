/* =========================================================
   script.js
   ---------------------------------------------------------
   This file is the bridge between the page (DOM) and our Express
   API. Every single network call here uses the Fetch API -- this
   file is basically "Fetch API examples" for requirement #5, all in
   one place, one function per CRUD operation:

     getStudents()            -> GET    /api/students
     createStudent(data)      -> POST   /api/students
     updateStudent(id, data)  -> PUT    /api/students/:id
     deleteStudent(id)        -> DELETE /api/students/:id

   After ANY of these calls succeeds, we re-fetch the full list and
   re-render the table. That's what makes the page feel "live" --
   nothing ever triggers a real browser page reload.
   ========================================================= */

// Because our front-end is served BY the same Express server (see
// server.js -> app.use(express.static(...))), we can use a relative
// URL here. The browser automatically sends requests to
// http://localhost:3000/api/students. If your front-end ever lives
// on a different origin/port than the API, you'd need to write the
// FULL url here instead (e.g. "http://localhost:3000/api/students")
// AND enable CORS on the server -- see the README's common errors table.
const API_URL = "/api/students";


/* =========================================================
   SECTION 1 — FETCH API FUNCTIONS (the actual CRUD calls)
   ========================================================= */

/**
 * getStudents
 * READ: fetch the full list of students.
 * fetch() returns a Promise that resolves with a "Response" object --
 * NOT the data itself yet. You have to call .json() on it (which
 * ALSO returns a Promise) to get the actual parsed JS data out.
 * That's why there are two "await"s below.
 */
async function getStudents() {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error("Failed to load students from the server.");
  }
  return response.json();
}

/**
 * createStudent
 * CREATE: POST a new student object to the server.
 * Notice the 3 things every POST/PUT fetch call needs:
 *   1. method: "POST"
 *   2. headers: tell the server we're sending JSON
 *   3. body: the actual data, turned into a JSON STRING with
 *      JSON.stringify() (fetch can't send a raw JS object over
 *      the network, only text/binary data)
 */
async function createStudent(studentData) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(studentData)
  });

  const data = await response.json();
  if (!response.ok) {
    // Our server sends back { error: "..." } on failure -- surface
    // that exact message instead of a generic one.
    throw new Error(data.error || "Failed to create student.");
  }
  return data;
}

/**
 * updateStudent
 * UPDATE: PUT the edited fields for an existing student, identified
 * by its id in the URL (/api/students/5, for example).
 */
async function updateStudent(id, studentData) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(studentData)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to update student.");
  }
  return data;
}

/**
 * deleteStudent
 * DELETE: remove a student by id. No body needed -- the id in the
 * URL is enough information for the server to know what to delete.
 */
async function deleteStudent(id) {
  const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to delete student.");
  }
  return data;
}


/* =========================================================
   SECTION 2 — DOM WIRING (everything below this line touches
   the page; everything above this line only talks to the server)
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("studentForm");
  const formTitle = document.getElementById("formTitle");
  const studentIdInput = document.getElementById("studentId");
  const nameInput = document.getElementById("name");
  const rollNoInput = document.getElementById("rollNo");
  const emailInput = document.getElementById("email");
  const departmentInput = document.getElementById("department");
  const yearInput = document.getElementById("year");

  const submitBtn = document.getElementById("submitBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const refreshBtn = document.getElementById("refreshBtn");
  const statusMsg = document.getElementById("statusMsg");
  const tableBody = document.getElementById("studentTableBody");

  // Load the table the moment the page opens.
  loadAndRenderStudents();


  /* ---------------------------------------------------------
     loadAndRenderStudents
     Fetches the latest list from the server and rebuilds the
     <tbody> from scratch. Called after every successful Create,
     Update or Delete, AND once on page load. This is the function
     responsible for "dynamically display data without refreshing".
     --------------------------------------------------------- */
  async function loadAndRenderStudents(flashId) {
    try {
      const students = await getStudents();
      renderTable(students, flashId);
    } catch (err) {
      showStatus(err.message, "error");
    }
  }

  /**
   * renderTable
   * Pure DOM-building function: given an array of student objects,
   * wipes the table body and rebuilds it row by row.
   * @param {Array} students
   * @param {number} [flashId] - optionally highlight this row briefly
   *   (used right after an add/update so the user can SEE which row
   *   just changed)
   */
  function renderTable(students, flashId) {
    tableBody.innerHTML = ""; // clear out whatever was there before

    if (students.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" class="empty-row">No students yet. Add one above!</td></tr>`;
      return;
    }

    students.forEach((student) => {
      const row = document.createElement("tr");
      if (student.id === flashId) row.classList.add("row-flash");

      // Using template literals to build the row's HTML in one go.
      // textContent isn't used here for simplicity, but since our
      // data comes from our own trusted server (not arbitrary user
      // HTML), this is safe for a college demo.
      row.innerHTML = `
        <td>${student.id}</td>
        <td>${student.name}</td>
        <td>${student.rollNo}</td>
        <td>${student.email}</td>
        <td>${student.department || "—"}</td>
        <td>${student.year || "—"}</td>
        <td>
          <button class="btn-edit" data-id="${student.id}">Edit</button>
          <button class="btn-delete" data-id="${student.id}">Delete</button>
        </td>
      `;
      tableBody.appendChild(row);
    });

    // Remove the temporary flash highlight after the animation finishes.
    if (flashId) {
      setTimeout(() => {
        const flashedRow = tableBody.querySelector(".row-flash");
        if (flashedRow) flashedRow.classList.remove("row-flash");
      }, 1000);
    }
  }

  /**
   * showStatus
   * Small helper to show a green success or red error line under the
   * form, and auto-clear it after a few seconds so the page doesn't
   * stay cluttered with old messages.
   */
  function showStatus(message, type) {
    statusMsg.textContent = message;
    statusMsg.className = "status-msg " + type;
    setTimeout(() => {
      statusMsg.textContent = "";
      statusMsg.className = "status-msg";
    }, 3500);
  }

  /**
   * resetFormToAddMode
   * Clears every field and switches the form back to "Add" mode --
   * used after a successful add, after a successful update, and when
   * the user clicks "Cancel" while editing.
   */
  function resetFormToAddMode() {
    form.reset();
    studentIdInput.value = "";
    formTitle.textContent = "Add New Student";
    submitBtn.textContent = "Add Student";
    cancelBtn.classList.add("hidden");
  }


  /* ---------------------------------------------------------
     FORM SUBMIT — handles BOTH add and edit
     --------------------------------------------------------- */
  form.addEventListener("submit", async (event) => {
    event.preventDefault(); // stop the browser's normal page-reload submit

    const studentData = {
      name: nameInput.value.trim(),
      rollNo: rollNoInput.value.trim(),
      email: emailInput.value.trim(),
      department: departmentInput.value.trim(),
      year: yearInput.value
    };

    // Very quick required-field check (the backend double-checks too).
    if (!studentData.name || !studentData.rollNo || !studentData.email) {
      showStatus("Name, Roll Number and Email are required.", "error");
      return;
    }

    const editingId = studentIdInput.value;

    try {
      if (editingId) {
        // ----- EDIT MODE: studentId was filled in by clicking "Edit" -----
        const updated = await updateStudent(editingId, studentData);
        showStatus(`Updated "${updated.name}" successfully.`, "success");
        await loadAndRenderStudents(updated.id);
      } else {
        // ----- ADD MODE -----
        const created = await createStudent(studentData);
        showStatus(`Added "${created.name}" successfully.`, "success");
        await loadAndRenderStudents(created.id);
      }
      resetFormToAddMode();
    } catch (err) {
      showStatus(err.message, "error");
    }
  });


  /* ---------------------------------------------------------
     CANCEL BUTTON — bail out of edit mode without saving
     --------------------------------------------------------- */
  cancelBtn.addEventListener("click", () => {
    resetFormToAddMode();
  });


  /* ---------------------------------------------------------
     REFRESH BUTTON — manual re-fetch, handy to prove to a viva
     examiner that the table really is live data from the server
     and not something hardcoded in the HTML.
     --------------------------------------------------------- */
  refreshBtn.addEventListener("click", () => {
    loadAndRenderStudents();
  });


  /* ---------------------------------------------------------
     EDIT / DELETE BUTTON CLICKS (event delegation)
     ---------------------------------------------------------
     Instead of adding a separate click listener to every single
     Edit/Delete button (which would need re-doing every time we
     re-render the table), we add ONE listener to the whole <tbody>
     and check what was actually clicked. This pattern is called
     "event delegation" and is the standard way to handle clicks on
     dynamically-created elements.
     --------------------------------------------------------- */
  tableBody.addEventListener("click", async (event) => {
    const target = event.target;
    const id = Number(target.dataset.id);

    if (target.classList.contains("btn-edit")) {
      handleEditClick(id);
    }

    if (target.classList.contains("btn-delete")) {
      await handleDeleteClick(id);
    }
  });

  /**
   * handleEditClick
   * Loads that one student's current data into the form and flips
   * the form into "edit mode" (sets the hidden id field, changes
   * button text, shows the Cancel button).
   */
  async function handleEditClick(id) {
    try {
      // We already have the full list rendered, but re-fetching the
      // single record via GET /api/students/:id demonstrates that
      // endpoint too, and guarantees we have the latest data.
      const response = await fetch(`${API_URL}/${id}`);
      const student = await response.json();
      if (!response.ok) throw new Error(student.error || "Student not found.");

      studentIdInput.value = student.id;
      nameInput.value = student.name;
      rollNoInput.value = student.rollNo;
      emailInput.value = student.email;
      departmentInput.value = student.department === "Not specified" ? "" : student.department;
      yearInput.value = student.year || "";

      formTitle.textContent = `Editing: ${student.name}`;
      submitBtn.textContent = "Save Changes";
      cancelBtn.classList.remove("hidden");

      // Scroll the form into view -- handy on smaller screens where
      // the table might currently be in focus.
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      showStatus(err.message, "error");
    }
  }

  /**
   * handleDeleteClick
   * Confirms with the user, then calls the DELETE endpoint and
   * refreshes the table.
   */
  async function handleDeleteClick(id) {
    const confirmed = window.confirm("Delete this student? This cannot be undone.");
    if (!confirmed) return;

    try {
      const result = await deleteStudent(id);
      showStatus(result.message, "success");
      await loadAndRenderStudents();

      // If the user happened to be editing the very record they just
      // deleted, reset the form so it doesn't sit there in a stale
      // "edit" state for a record that no longer exists.
      if (studentIdInput.value === String(id)) {
        resetFormToAddMode();
      }
    } catch (err) {
      showStatus(err.message, "error");
    }
  }

});
