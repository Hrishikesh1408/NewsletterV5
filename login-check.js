// Logout function
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userData');
  window.location.href = 'login.html';
}

