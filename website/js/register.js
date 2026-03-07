/* ============================================
   register.js — Registration & Stripe checkout
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  const form       = document.getElementById('register-form');
  const alertBox   = document.getElementById('form-alert');
  const submitBtn  = document.getElementById('submit-btn');
  const pwInput    = document.getElementById('password');
  const pwConfirm  = document.getElementById('confirm-password');
  const pwToggle   = document.getElementById('pw-toggle');
  const pwcToggle  = document.getElementById('pwc-toggle');

  // Password visibility toggles
  if (pwToggle) {
    pwToggle.addEventListener('click', () => togglePassword(pwInput, pwToggle));
  }
  if (pwcToggle) {
    pwcToggle.addEventListener('click', () => togglePassword(pwConfirm, pwcToggle));
  }

  function togglePassword(input, btn) {
    if (!input) return;
    const isText = input.type === 'text';
    input.type = isText ? 'password' : 'text';
    btn.textContent = isText ? '👁' : '🙈';
  }

  // Clear field error on input
  form.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => clearFieldError(input));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validate()) return;

    const name     = document.getElementById('name').value.trim();
    const email    = document.getElementById('email').value.trim();
    const password = pwInput.value;

    setLoading(true);
    hideAlert();

    try {
      // Step 1: Sign up
      const signupData = await api('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });

      setToken(signupData.token);
      setUser(signupData.user);

      // Step 2: Create Stripe checkout session
      const session = await api('/api/stripe/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      // Step 3: Redirect to Stripe checkout
      if (session.url) {
        window.location.href = session.url;
      } else {
        // Fallback if Stripe not configured
        window.location.href = '/success.html';
      }
    } catch (err) {
      showAlert(err.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  });

  /* ---- Validation ---- */
  function validate() {
    let valid = true;
    const name     = document.getElementById('name').value.trim();
    const email    = document.getElementById('email').value.trim();
    const password = pwInput.value;
    const confirm  = pwConfirm.value;

    clearAllErrors();

    if (!name) {
      setFieldError('name', 'Name is required.');
      valid = false;
    }

    if (!email || !isValidEmail(email)) {
      setFieldError('email', 'Enter a valid email address.');
      valid = false;
    }

    if (!password || password.length < 8) {
      setFieldError('password', 'Password must be at least 8 characters.');
      valid = false;
    }

    if (password !== confirm) {
      setFieldError('confirm-password', 'Passwords do not match.');
      valid = false;
    }

    return valid;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

  function clearFieldError(input) {
    input.classList.remove('error');
    const err = document.getElementById(`${input.id}-error`);
    if (err) err.textContent = '';
  }

  function clearAllErrors() {
    form.querySelectorAll('input').forEach(clearFieldError);
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
      ? '<span class="spinner"></span> Creating account…'
      : 'Create Account &amp; Subscribe';
  }
});
