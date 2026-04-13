const API = 'https://farmers-direct-market.onrender.com/api';

// Save token to localStorage
function saveToken(token) {
  localStorage.setItem('token', token);
}

// Get token from localStorage
function getToken() {
  return localStorage.getItem('token');
}

// Save user info to localStorage
function saveUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

// Get user info from localStorage
function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

// Logout — clear everything and go to login page
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/pages/login.html';
}

// Show alert message inside a container
function showAlert(containerId, message, type = 'success') {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
  }
}

// Update navbar based on login status
function updateNavbar() {
  const user = getUser();
  const navLinks = document.getElementById('nav-links');
  if (!navLinks) return;

  if (user) {
    navLinks.innerHTML = `
      <li><a href="/pages/products.html">Products</a></li>
      ${user.role === 'farmer'
        ? '<li><a href="/pages/farmer-dashboard.html">My Dashboard</a></li>'
        : '<li><a href="/pages/orders.html">My Orders</a></li>'
      }
      <li><a href="#" onclick="logout()">Logout (${user.name})</a></li>
    `;
  } else {
    navLinks.innerHTML = `
      <li><a href="/pages/products.html">Products</a></li>
      <li><a href="/pages/login.html">Login</a></li>
      <li><a href="/pages/register.html">Register</a></li>
    `;
  }
}