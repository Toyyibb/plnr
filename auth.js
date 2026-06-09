/*
  Authentication logic:
  - Users are stored in localStorage as a simple front-end demo.
  - Logged-in user session is saved in sessionStorage or localStorage.
  - Protected pages redirect to login if the user is not authenticated.
  - Passwords are not truly secure in localStorage, so this is for coursework/demo only.
*/

const USERS_KEY = "plnr_users_v1";
const SESSION_KEY = "plnr_session_v1";

function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession() {
  return JSON.parse(localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY) || "null");
}

function setSession(user, remember = false) {
  const data = JSON.stringify(user);
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
  if (remember) localStorage.setItem(SESSION_KEY, data);
  else sessionStorage.setItem(SESSION_KEY, data);
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

function isLoggedIn() {
  return !!getSession();
}

function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = "login.html";
  }
}

function logout() {
  clearSession();
  window.location.href = "login.html";
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password);
}

function showError(el, message) {
  el.textContent = message;
  el.classList.remove("d-none");
}

function clearError(el) {
  el.textContent = "";
  el.classList.add("d-none");
}