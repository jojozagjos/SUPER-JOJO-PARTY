/**
 * Super JoJo Party - Authentication Manager
 * Handles user registration, login, and session management
 */

export class AuthManager {
  constructor(app) {
    this.app = app;
    this.token = localStorage.getItem('superJoJoParty_token');
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('login-form');
    loginForm?.addEventListener('submit', (e) => this.handleLogin(e));

    // Register form
    const registerForm = document.getElementById('register-form');
    registerForm?.addEventListener('submit', (e) => this.handleRegister(e));

    // Guest button
    const guestBtn = document.getElementById('guest-login');
    guestBtn?.addEventListener('click', () => this.handleGuestLogin());

    // Tab switching
    document.querySelectorAll('.login-tabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });

    // Password toggle
    document.querySelectorAll('.toggle-password').forEach(btn => {
      btn.addEventListener('click', (e) => this.togglePasswordVisibility(e));
    });

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn?.addEventListener('click', () => this.logout());
  }

  switchTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.login-tabs .tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // Update forms
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (tab === 'login') {
      loginForm?.classList.add('active');
      registerForm?.classList.remove('active');
    } else {
      loginForm?.classList.remove('active');
      registerForm?.classList.add('active');
    }

    // Clear errors
    this.clearErrors();
  }

  togglePasswordVisibility(e) {
    const btn = e.currentTarget;
    const input = btn.parentElement.querySelector('input');
    
    if (input.type === 'password') {
      input.type = 'text';
      btn.textContent = '👁️';
    } else {
      input.type = 'password';
      btn.textContent = '👁️‍🗨️';
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    this.clearErrors();

    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
      this.showError('login', 'Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        this.setSession(data.token, data.user);
        this.app.audio.playSFX('success');
        this.app.ui.showToast(`Welcome back, ${data.user.username}!`, 'success');
        this.app.navigateTo('main-menu');
      } else {
        this.showError('login', data.error || 'Login failed');
        this.app.audio.playSFX('error');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showError('login', 'Connection error. Please try again.');
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    this.clearErrors();

    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm').value;

    // Validation
    if (!username || !password || !confirmPassword) {
      this.showError('register', 'Please fill in all fields');
      return;
    }

    if (username.length < 3 || username.length > 20) {
      this.showError('register', 'Username must be 3-20 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      this.showError('register', 'Username can only contain letters, numbers, and underscores');
      return;
    }

    if (password.length < 6) {
      this.showError('register', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      this.showError('register', 'Passwords do not match');
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        this.setSession(data.token, data.user);
        this.app.audio.playSFX('success');
        this.app.ui.showToast(`Welcome to Super JoJo Party, ${data.user.username}!`, 'success');
        this.app.navigateTo('main-menu');
      } else {
        this.showError('register', data.error || 'Registration failed');
        this.app.audio.playSFX('error');
      }
    } catch (error) {
      console.error('Register error:', error);
      this.showError('register', 'Connection error. Please try again.');
    }
  }

  async handleGuestLogin() {
    try {
      const response = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (response.ok) {
        // Include isGuest flag in user object
        const user = { ...data.user, isGuest: true };
        this.setSession(data.token, user);
        this.app.audio.playSFX('success');
        this.app.ui.showToast(`Welcome, ${data.user.username}!`, 'success');
        this.app.navigateTo('main-menu');
      } else {
        this.app.ui.showToast(data.error || 'Guest login failed', 'error');
      }
    } catch (error) {
      console.error('Guest login error:', error);
      this.app.ui.showToast('Connection error. Please try again.', 'error');
    }
  }

  async checkSession() {
    if (!this.token) return false;

    try {
      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: this.token })
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        this.app.setUser(data.user);
        return true;
      } else {
        this.clearSession();
        return false;
      }
    } catch (error) {
      console.error('Session check error:', error);
      this.clearSession();
      return false;
    }
  }

  setSession(token, user) {
    this.token = token;
    localStorage.setItem('superJoJoParty_token', token);
    this.app.setUser(user);
  }

  clearSession() {
    this.token = null;
    localStorage.removeItem('superJoJoParty_token');
    this.app.setUser(null);
  }

  async logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: this.token })
      });
    } catch (error) {
      console.error('Logout error:', error);
    }

    // Stop menu music when logging out
    this.app.audio?.stopMusic();

    this.clearSession();
    this.app.socket.disconnect();
    this.app.ui.showToast('Logged out successfully', 'success');
    this.app.navigateTo('login');
  }

  showError(form, message) {
    const errorEl = document.getElementById(`${form}-error`);
    if (errorEl) {
      errorEl.textContent = message;
    }
  }

  clearErrors() {
    document.querySelectorAll('.form-error').forEach(el => {
      el.textContent = '';
    });
  }

  getToken() {
    return this.token;
  }
}
