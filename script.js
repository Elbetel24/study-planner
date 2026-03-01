document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const showRegister = document.getElementById("show-register");
  const showLogin = document.getElementById("show-login");
  const authSection = document.getElementById("auth-section");
  const plannerSection = document.getElementById("planner");
  const logoutBtn = document.getElementById("logout");

  const taskForm = document.querySelector("#planner #task-form form");
  const taskList = document.getElementById("task-list");

  let currentUser = localStorage.getItem("currentUser");

  function saveUsers(users) {
    localStorage.setItem("users", JSON.stringify(users));
  }
  function loadUsers() {
    return JSON.parse(localStorage.getItem("users") || "{}");
  }

  function loadTasks() {
    if (!currentUser) return [];
    return JSON.parse(localStorage.getItem(`tasks_${currentUser}`) || "[]");
  }
  function saveTasks(tasks) {
    if (!currentUser) return;
    localStorage.setItem(`tasks_${currentUser}`, JSON.stringify(tasks));
  }

  function renderTasks() {
    taskList.innerHTML = "";
    const tasks = loadTasks();
    tasks.forEach(({ title, due, color }, index) => {
      const li = document.createElement("li");
      li.className = "task-item";
      li.style.borderLeft = `6px solid ${color}`;
      const span = document.createElement("span");
      span.textContent = `${title} - due ${due}`;
      const btn = document.createElement("button");
      btn.textContent = "Delete";
      btn.addEventListener("click", () => {
        tasks.splice(index, 1);
        saveTasks(tasks);
        renderTasks();
      });
      li.appendChild(span);
      li.appendChild(btn);
      taskList.appendChild(li);
    });
  }

  function addTask(title, due, color) {
    const tasks = loadTasks();
    tasks.push({ title, due, color });
    saveTasks(tasks);
    renderTasks();
  }

  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("title").value;
    const due = document.getElementById("due").value;
    const color = document.getElementById("color").value;
    addTask(title, due, color);
    taskForm.reset();
  });

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const users = loadUsers();
    if (users[username] && users[username] === password) {
      currentUser = username;
      localStorage.setItem("currentUser", currentUser);
      showPlanner();
    } else {
      alert("Invalid credentials");
    }
  });

  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("reg-username").value;
    const password = document.getElementById("reg-password").value;
    const users = loadUsers();
    if (users[username]) {
      alert("User already exists");
      return;
    }
    users[username] = password;
    saveUsers(users);
    alert("Account created, please login");
    toggleForms();
  });

  showRegister.addEventListener("click", () => toggleForms(true));
  showLogin.addEventListener("click", () => toggleForms(false));

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    currentUser = null;
    plannerSection.style.display = "none";
    authSection.style.display = "block";
  });

  function toggleForms(showRegisterForm) {
    if (showRegisterForm) {
      loginForm.style.display = "none";
      registerForm.style.display = "block";
    } else {
      loginForm.style.display = "block";
      registerForm.style.display = "none";
    }
  }

  // calendar helpers
  let currentDate = new Date();

  function renderCalendar(date) {
    const calendarBody = document.querySelector("#calendar tbody");
    const monthLabel = document.getElementById("current-month");
    calendarBody.innerHTML = "";
    const year = date.getFullYear();
    const month = date.getMonth();
    monthLabel.textContent = date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let row = document.createElement("tr");
    // blank cells
    for (let i = 0; i < firstDay; i++) {
      row.appendChild(document.createElement("td"));
    }

    const tasks = loadTasks();

    for (let day = 1; day <= daysInMonth; day++) {
      if (row.children.length === 7) {
        calendarBody.appendChild(row);
        row = document.createElement("tr");
      }
      const cell = document.createElement("td");
      const cellDate = new Date(year, month, day);
      const dayTasks = tasks.filter(t => {
        const d = new Date(t.due);
        return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
      });
      cell.textContent = day;
      if (dayTasks.length) {
        cell.classList.add("task-day");
        const list = document.createElement("ul");
        list.className = "task-list";
        dayTasks.forEach(t => {
          const item = document.createElement("li");
          item.textContent = t.title;
          item.style.color = t.color;
          list.appendChild(item);
        });
        cell.appendChild(list);
        cell.addEventListener("click", () => {
          showDayTasks(cellDate, dayTasks);
        });
      }
      row.appendChild(cell);
    }
    // fill remaining
    while (row.children.length < 7) {
      row.appendChild(document.createElement("td"));
    }
    calendarBody.appendChild(row);
  }

  document.getElementById("prev-month").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(currentDate);
  });
  document.getElementById("next-month").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(currentDate);
  });
  document.getElementById("show-calendar").addEventListener("click", () => {
    const calSection = document.getElementById("calendar-section");
    calSection.style.display = calSection.style.display === "none" ? "block" : "none";
    if (calSection.style.display === "block") renderCalendar(currentDate);
  });

  function showDayTasks(date, tasksForDay) {
    const daySection = document.getElementById("day-tasks");
    const list = document.getElementById("selected-task-list");
    const label = document.getElementById("selected-date");
    label.textContent = date.toLocaleDateString();
    list.innerHTML = "";
    tasksForDay.forEach(t => {
      const li = document.createElement("li");
      li.textContent = `${t.title} (due ${t.due})`;
      list.appendChild(li);
    });
    daySection.style.display = "block";
  }

  function showPlanner() {
    authSection.style.display = "none";
    plannerSection.style.display = "block";
    renderTasks();
  }

  if (currentUser) {
    showPlanner();
  }

  // update current time/date in quote box
  function updateQuoteTime() {
    const now = new Date();
    const tEl = document.getElementById("quote-time");
    if (tEl) {
      tEl.textContent = now.toLocaleString();
    }
  }
  setInterval(updateQuoteTime, 1000);
  updateQuoteTime();
});