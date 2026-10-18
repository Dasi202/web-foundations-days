const API_URL = "https://jsonplaceholder.typicode.com/users";

const loadButton = document.getElementById("load-users");
const filterInput = document.getElementById("filter-input");
const statusEl = document.getElementById("status");
const usersList = document.getElementById("users-list");

// Stores the users loaded from the API so filtering never needs a new request.
let allUsers = [];

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

function createUserItem(user) {
  const li = document.createElement("li");

  const name = document.createElement("h2");
  name.textContent = user.name;

  const email = document.createElement("p");
  email.textContent = "Email: " + user.email;

  const city = document.createElement("p");
  city.textContent = "City: " + user.address.city;

  const company = document.createElement("p");
  company.textContent = "Company: " + user.company.name;

  li.append(name, email, city, company);
  return li;
}

// Draws any array of users into the list.
function renderUsers(list) {
  usersList.textContent = "";

  if (list.length === 0) {
    setStatus("No users match your filter.");
    return;
  }

  list.forEach((user) => {
    usersList.appendChild(createUserItem(user));
  });
}

function filterUsers() {
  const text = filterInput.value.trim().toLowerCase();
  return allUsers.filter((user) => user.name.toLowerCase().includes(text));
}

async function loadUsers() {
  loadButton.disabled = true;
  setStatus("Loading users...");

  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error("Request failed with status " + response.status);
    }

    allUsers = await response.json();

    const filtered = filterUsers();
    renderUsers(filtered);
    if (filtered.length > 0) {
      setStatus("Loaded " + allUsers.length + " users successfully.");
    }
  } catch (error) {
    setStatus("Error: could not load users. " + error.message, true);
  } finally {
    loadButton.disabled = false;
  }
}

loadButton.addEventListener("click", loadUsers);

filterInput.addEventListener("input", () => {
  if (allUsers.length === 0) {
    return; // nothing loaded yet
  }
  const filtered = filterUsers();
  renderUsers(filtered);
  if (filtered.length > 0) {
    setStatus("Showing " + filtered.length + " of " + allUsers.length + " users.");
  }
});