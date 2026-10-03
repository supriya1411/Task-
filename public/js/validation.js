/**
 * TaskFlow Client-Side Validation Engine (Task 2 & Task 4)
 */

document.addEventListener('DOMContentLoaded', function () {
  // 1. Password Strength & Registration Validation
  const registerForm = document.getElementById('registerForm');
  const passwordInput = document.getElementById('password');
  const confirmInput = document.getElementById('confirmPassword');
  const strengthBar = document.getElementById('strengthBar');
  const strengthText = document.getElementById('strengthText');
  const strengthBadge = document.getElementById('strengthBadge');

  if (passwordInput && strengthBar) {
    passwordInput.addEventListener('input', function () {
      const val = passwordInput.value;
      let score = 0;

      // Criteria Checks
      const lenOk = val.length >= 6;
      const upperOk = /[A-Z]/.test(val);
      const lowerOk = /[a-z]/.test(val);
      const numOk = /[0-9]/.test(val);
      const specialOk = /[^A-Za-z0-9]/.test(val);

      // Update Checklist Icons
      updateCriteriaIcon('crit-len', lenOk, 'At least 6 characters');
      updateCriteriaIcon('crit-upper', upperOk, 'Contains uppercase letter (A-Z)');
      updateCriteriaIcon('crit-lower', lowerOk, 'Contains lowercase letter (a-z)');
      updateCriteriaIcon('crit-num', numOk, 'Contains at least one digit (0-9)');

      if (lenOk) score += 25;
      if (upperOk) score += 20;
      if (lowerOk) score += 20;
      if (numOk) score += 20;
      if (specialOk) score += 15;

      strengthBar.style.width = score + '%';

      if (score === 0) {
        strengthBar.className = 'progress-bar';
        strengthText.innerHTML = 'Password Strength: <em>Enter password</em>';
        strengthBadge.className = 'badge bg-secondary-subtle text-secondary';
        strengthBadge.textContent = 'None';
      } else if (score < 45) {
        strengthBar.className = 'progress-bar bg-danger';
        strengthText.textContent = 'Password Strength: Weak';
        strengthBadge.className = 'badge bg-danger-subtle text-danger';
        strengthBadge.textContent = 'Weak';
      } else if (score < 75) {
        strengthBar.className = 'progress-bar bg-warning';
        strengthText.textContent = 'Password Strength: Fair';
        strengthBadge.className = 'badge bg-warning-subtle text-dark';
        strengthBadge.textContent = 'Fair';
      } else if (score < 95) {
        strengthBar.className = 'progress-bar bg-info';
        strengthText.textContent = 'Password Strength: Good';
        strengthBadge.className = 'badge bg-info-subtle text-info';
        strengthBadge.textContent = 'Good';
      } else {
        strengthBar.className = 'progress-bar bg-success';
        strengthText.textContent = 'Password Strength: Strong';
        strengthBadge.className = 'badge bg-success-subtle text-success';
        strengthBadge.textContent = 'Strong';
      }
    });

    function updateCriteriaIcon(id, valid, text) {
      const el = document.getElementById(id);
      if (!el) return;
      if (valid) {
        el.innerHTML = `<i class="bi bi-check-circle-fill text-success me-1"></i> ${text}`;
      } else {
        el.innerHTML = `<i class="bi bi-x-circle text-danger me-1"></i> ${text}`;
      }
    }
  }

  // Toggle Password Visibility on Register Form
  const toggleBtn = document.getElementById('togglePasswordBtn');
  const toggleIcon = document.getElementById('togglePasswordIcon');
  if (toggleBtn && passwordInput && toggleIcon) {
    toggleBtn.addEventListener('click', function () {
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.replace('bi-eye', 'bi-eye-slash');
      } else {
        passwordInput.type = 'password';
        toggleIcon.classList.replace('bi-eye-slash', 'bi-eye');
      }
    });
  }

  // Register Form Submit Validation
  if (registerForm) {
    registerForm.addEventListener('submit', function (e) {
      let isValid = true;

      // Name check
      const nameInput = document.getElementById('name');
      if (nameInput && nameInput.value.trim().length < 2) {
        nameInput.classList.add('is-invalid');
        isValid = false;
      } else if (nameInput) {
        nameInput.classList.remove('is-invalid');
        nameInput.classList.add('is-valid');
      }

      // Email check
      const emailInput = document.getElementById('email');
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (emailInput && !emailRegex.test(emailInput.value.trim())) {
        emailInput.classList.add('is-invalid');
        isValid = false;
      } else if (emailInput) {
        emailInput.classList.remove('is-invalid');
        emailInput.classList.add('is-valid');
      }

      // Password check
      if (passwordInput && passwordInput.value.length < 6) {
        passwordInput.classList.add('is-invalid');
        isValid = false;
      } else if (passwordInput) {
        passwordInput.classList.remove('is-invalid');
        passwordInput.classList.add('is-valid');
      }

      // Confirm Password
      if (confirmInput && confirmInput.value !== passwordInput.value) {
        confirmInput.classList.add('is-invalid');
        isValid = false;
      } else if (confirmInput) {
        confirmInput.classList.remove('is-invalid');
        confirmInput.classList.add('is-valid');
      }

      if (!isValid) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
  }

  // Task Form Validation
  const taskForm = document.getElementById('taskForm');
  if (taskForm) {
    taskForm.addEventListener('submit', function (e) {
      const titleInput = document.getElementById('taskTitle');
      if (titleInput && titleInput.value.trim().length < 3) {
        titleInput.classList.add('is-invalid');
        e.preventDefault();
        e.stopPropagation();
      } else if (titleInput) {
        titleInput.classList.remove('is-invalid');
        titleInput.classList.add('is-valid');
      }
    });
  }
});

// Toast notification trigger
window.showToast = function (message, type = 'success') {
  const toastEl = document.getElementById('liveToast');
  const toastMsg = document.getElementById('toastMessage');
  if (toastEl && toastMsg) {
    const icon = type === 'success' ? 'bi-check-circle-fill text-success' : 'bi-exclamation-triangle-fill text-danger';
    toastMsg.innerHTML = `<i class="bi ${icon} fs-5"></i> <span>${message}</span>`;
    const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
    toast.show();
  }
};
