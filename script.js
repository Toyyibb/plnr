const STORAGE_KEY = "plnr_tasks_v1";
const THEME_KEY = "plnr_theme_v1";

const taskForm = document.getElementById("taskForm");
const titleInput = document.getElementById("title");
const notesInput = document.getElementById("notes");
const dueDateInput = document.getElementById("dueDate");
const priorityInput = document.getElementById("priority");
const categoryInput = document.getElementById("category");
const taskList = document.getElementById("taskList");
const taskTemplate = document.getElementById("taskTemplate");
const addSubtaskBtn = document.getElementById("addSubtask");
const subtaskList = document.getElementById("subtaskList");
const filterBtns = document.querySelectorAll(".filter-btn");
const themeToggle = document.getElementById("themeToggle");
const taskStats = document.getElementById("taskStats");
const submitBtn = document.getElementById("submitBtn");

let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let currentFilter = "all";
let editingId = null;

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

function getTheme() {
  return localStorage.getItem(THEME_KEY) || "light";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-bs-theme", theme);
  themeToggle.innerHTML = theme === "dark"
    ? '<i class="bi bi-sun"></i> Theme'
    : '<i class="bi bi-moon-stars"></i> Theme';
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function addSubtaskField(value = "") {
  const wrapper = document.createElement("div");
  wrapper.className = "input-group";
  wrapper.innerHTML = `
    <input type="text" class="form-control subtask-input" placeholder="Subtask" value="${escapeHtml(value)}">
    <button class="btn btn-outline-danger remove-subtask" type="button"><i class="bi bi-x-lg"></i></button>
  `;
  subtaskList.appendChild(wrapper);
}

function getFormSubtasks() {
  return [...document.querySelectorAll(".subtask-input")]
    .map(input => input.value.trim())
    .filter(Boolean)
    .map(text => ({ text, done: false }));
}

function resetForm() {
  taskForm.reset();
  subtaskList.innerHTML = "";
  addSubtaskField();
  editingId = null;
  submitBtn.textContent = "Add task";
}

function renderStats() {
  const total = tasks.length;
  const active = tasks.filter(t => !t.completed).length;
  const completed = tasks.filter(t => t.completed).length;

  taskStats.innerHTML = `
    <div class="col-md-4">
      <div class="card border-0 shadow-sm"><div class="card-body"><h3 class="h6 text-secondary">Total</h3><div class="display-6 fw-bold">${total}</div></div></div>
    </div>
    <div class="col-md-4">
      <div class="card border-0 shadow-sm"><div class="card-body"><h3 class="h6 text-secondary">Active</h3><div class="display-6 fw-bold">${active}</div></div></div>
    </div>
    <div class="col-md-4">
      <div class="card border-0 shadow-sm"><div class="card-body"><h3 class="h6 text-secondary">Completed</h3><div class="display-6 fw-bold">${completed}</div></div></div>
    </div>
  `;
}

function getFilteredTasks() {
  if (currentFilter === "active") return tasks.filter(t => !t.completed);
  if (currentFilter === "completed") return tasks.filter(t => t.completed);
  return tasks;
}

function renderTasks() {
  taskList.innerHTML = "";
  renderStats();

  const filtered = getFilteredTasks();

  if (!filtered.length) {
    taskList.innerHTML = `
      <div class="card border-0 shadow-sm">
        <div class="card-body p-5 text-center text-secondary">
          <i class="bi bi-card-checklist display-4 d-block mb-3"></i>
          No tasks found.
        </div>
      </div>
    `;
    return;
  }

  filtered.forEach(task => {
    const node = taskTemplate.content.cloneNode(true);
    const card = node.querySelector(".task-card");
    const toggle = node.querySelector(".task-toggle");
    const title = node.querySelector(".task-title");
    const notes = node.querySelector(".task-notes");
    const badges = node.querySelector(".task-badges");
    const subtasks = node.querySelector(".task-subtasks");
    const editBtn = node.querySelector(".edit-btn");
    const deleteBtn = node.querySelector(".delete-btn");

    title.textContent = task.title;
    title.classList.toggle("done", task.completed);
    toggle.checked = task.completed;
    notes.textContent = task.notes || "No notes added.";

    const priorityClass = {
      High: "priority-high",
      Medium: "priority-medium",
      Low: "priority-low"
    }[task.priority] || "badge-soft";

    badges.innerHTML = `
      <span class="badge ${priorityClass}">${task.priority}</span>
      ${task.category ? `<span class="badge badge-soft">${task.category}</span>` : ""}
      ${task.dueDate ? `<span class="badge text-bg-secondary">Due ${task.dueDate}</span>` : ""}
    `;

    subtasks.innerHTML = task.subtasks?.length ? `
      <div class="small text-secondary mb-2">Subtasks</div>
      <div class="vstack gap-2">
        ${task.subtasks.map((st, index) => `
          <label class="subtask-item small">
            <input type="checkbox" class="form-check-input subtask-toggle" data-task-id="${task.id}" data-subtask-index="${index}" ${st.done ? "checked" : ""}>
            <span class="${st.done ? "text-decoration-line-through text-secondary" : ""}">${st.text}</span>
          </label>
        `).join("")}
      </div>
    ` : "";

    toggle.addEventListener("change", () => {
      task.completed = toggle.checked;
      saveTasks();
      renderTasks();
    });

    editBtn.addEventListener("click", () => loadTaskToForm(task));
    deleteBtn.addEventListener("click", () => {
      tasks = tasks.filter(t => t.id !== task.id);
      saveTasks();
      renderTasks();
    });

    card.querySelectorAll(".subtask-toggle").forEach(cb => {
      cb.addEventListener("change", (e) => {
        const subIdx = +e.target.dataset.subtaskIndex;
        const tId = e.target.dataset.taskId;
        const target = tasks.find(t => t.id === tId);
        target.subtasks[subIdx].done = e.target.checked;
        saveTasks();
        renderTasks();
      });
    });

    taskList.appendChild(node);
  });
}

function loadTaskToForm(task) {
  editingId = task.id;
  titleInput.value = task.title;
  notesInput.value = task.notes || "";
  dueDateInput.value = task.dueDate || "";
  priorityInput.value = task.priority || "Medium";
  categoryInput.value = task.category || "";
  subtaskList.innerHTML = "";
  (task.subtasks?.length ? task.subtasks : [{ text: "" }]).forEach(st => addSubtaskField(st.text));
  submitBtn.textContent = "Update task";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

taskForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const task = {
    id: editingId || crypto.randomUUID(),
    title: titleInput.value.trim(),
    notes: notesInput.value.trim(),
    dueDate: dueDateInput.value,
    priority: priorityInput.value,
    category: categoryInput.value.trim(),
    completed: false,
    subtasks: getFormSubtasks()
  };

  if (editingId) {
    const index = tasks.findIndex(t => t.id === editingId);
    task.completed = tasks[index].completed;
    tasks[index] = task;
  } else {
    tasks.unshift(task);
  }

  saveTasks();
  resetForm();
  renderTasks();
});

addSubtaskBtn.addEventListener("click", () => addSubtaskField());

subtaskList.addEventListener("click", (e) => {
  if (e.target.closest(".remove-subtask")) {
    e.target.closest(".input-group").remove();
  }
});

filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

themeToggle.addEventListener("click", () => {
  const next = document.documentElement.getAttribute("data-bs-theme") === "dark" ? "light" : "dark";
  applyTheme(next);
  saveTheme(next);
});

applyTheme(getTheme());
addSubtaskField();
renderTasks();