/*
  Planner logic:
  - Protected dashboard requires login.
  - Tasks are stored per user using localStorage.
  - Existing planner features remain active after auth is added.
*/

requireAuth();

const session = getSession();
document.getElementById("userName").textContent = session?.name || "User";
document.getElementById("userGreeting").textContent = `Hi, ${session?.name || "User"}`;

document.getElementById("logoutBtn").addEventListener("click", logout);

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
const taskStats = document.getElementById("taskStats");
const submitBtn = document.getElementById("submitBtn");

const TASK_KEY = `plnr_tasks_${session.email}`;
let tasks = JSON.parse(localStorage.getItem(TASK_KEY)) || [];
let currentFilter = "all";
let editingId = null;

function saveTasks() {
  localStorage.setItem(TASK_KEY, JSON.stringify(tasks));
}

function addSubtaskField(value = "") {
  const wrapper = document.createElement("div");
  wrapper.className = "input-group";
  wrapper.innerHTML = `
    <input type="text" class="form-control subtask-input" placeholder="Subtask" value="${value.replaceAll('"', "&quot;")}">
    <button class="btn btn-outline-danger remove-subtask" type="button"><i class="bi bi-x-lg"></i></button>
  `;
  subtaskList.appendChild(wrapper);
}

function getSubtasks() {
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
    <div class="col-md-4"><div class="card task-card"><div class="card-body"><div class="text-secondary">Total</div><div class="display-6 fw-bold">${total}</div></div></div></div>
    <div class="col-md-4"><div class="card task-card"><div class="card-body"><div class="text-secondary">Active</div><div class="display-6 fw-bold">${active}</div></div></div></div>
    <div class="col-md-4"><div class="card task-card"><div class="card-body"><div class="text-secondary">Completed</div><div class="display-6 fw-bold">${completed}</div></div></div></div>
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
    taskList.innerHTML = `<div class="card task-card"><div class="card-body p-5 text-center text-secondary">No tasks found.</div></div>`;
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

    title.textContent = task.title;
    title.classList.toggle("text-decoration-line-through", task.completed);
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
        ${task.subtasks.map((st, i) => `
          <label class="small d-flex align-items-center gap-2">
            <input type="checkbox" class="form-check-input subtask-toggle" data-task-id="${task.id}" data-subtask-index="${i}" ${st.done ? "checked" : ""}>
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

    node.querySelector(".edit-btn").addEventListener("click", () => {
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
    });

    node.querySelector(".delete-btn").addEventListener("click", () => {
      tasks = tasks.filter(t => t.id !== task.id);
      saveTasks();
      renderTasks();
    });

    card.querySelectorAll(".subtask-toggle").forEach(cb => {
      cb.addEventListener("change", (e) => {
        const target = tasks.find(t => t.id === e.target.dataset.taskId);
        target.subtasks[+e.target.dataset.subtaskIndex].done = e.target.checked;
        saveTasks();
        renderTasks();
      });
    });

    taskList.appendChild(node);
  });
}

taskForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const data = {
    id: editingId || crypto.randomUUID(),
    title: titleInput.value.trim(),
    notes: notesInput.value.trim(),
    dueDate: dueDateInput.value,
    priority: priorityInput.value,
    category: categoryInput.value.trim(),
    completed: false,
    subtasks: getSubtasks()
  };

  if (editingId) {
    const idx = tasks.findIndex(t => t.id === editingId);
    data.completed = tasks[idx].completed;
    tasks[idx] = data;
  } else {
    tasks.unshift(data);
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

addSubtaskField();
renderTasks();