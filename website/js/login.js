/* ============================================
   login.js — Login page logic
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  const form     = document.getElementById('login-form');
  const alertBox = document.getElementById('form-alert');
  const submitBtn = document.getElementById('submit-btn');
  const pwInput  = document.getElementById('password');
  const pwToggle = document.getElementById('pw-toggle');

  if (pwToggle) {
    pwToggle.addEventListener('click', () => {
      const isText = pwInput.type === 'text';
      pwInput.type = isText ? 'password' : 'text';
      pwToggle.textContent = isText ? '👁' : '🙈';
    });
  }

  // Clear errors on input
  form.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => {
      input.classList.remove('error');
      const err = document.getElementById(`${input.id}-error`);
      if (err) err.textContent = '';
      hideAlert();
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email    = document.getElementById('email').value.trim();
    const password = pwInput.value;

    if (!validate(email, password)) return;

    setLoading(true);
    hideAlert();

    try {
      const data = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setToken(data.token);
      setUser(data.user);

      // Redirect based on role
      const user = data.user || {};
      if (user.role === 'admin') {
        window.location.href = '/dashboard.html';
      } else {
        window.location.href = '/success.html';
      }
    } catch (err) {
      showAlert(err.message || 'Invalid email or password.');
      setLoading(false);
    }
  });

  /* ---- Validation ---- */
  function validate(email, password) {
    let valid = true;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError('email', 'Enter a valid email address.');
      valid = false;
    }

    if (!password) {
      setFieldError('password', 'Password is required.');
      valid = false;
    }

    return valid;
  }

  function setFieldError(id, message) {
    const input = document.getElementById(id);
    if (!input) return;
    input.classList.add('error');
    let err = document.getElementById(`${id}-error`);
    if (!err) {
      err = document.createElement('span');
      err.id = `${id}-error`;
      err.className = 'field-error';
      input.closest('.form-group').appendChild(err);
    }
    err.textContent = message;
  }

  function showAlert(msg) {
    alertBox.textContent = msg;
    alertBox.classList.add('visible');
  }

  function hideAlert() {
    alertBox.classList.remove('visible');
  }

  function setLoading(loading) {
    submitBtn.disabled = loading;
    submitBtn.innerHTML = loading
      ? '<span class="spinner"></span> Signing in…'
      : 'Sign In';
  }
});
