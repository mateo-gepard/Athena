/* ═══════════════════════════════════════════════════════════════════════════════
   NEXUS ULTRA - Authentication Service
   Firebase Authentication for user login/register
   ═══════════════════════════════════════════════════════════════════════════════ */

const AuthService = {
  user: null,
  isAuthenticated: false,
  _initialized: false,
  
  // Initialize Firebase Auth
  init() {
    if (this._initialized) return Promise.resolve(this.isAuthenticated);
    this._initialized = true;
    
    if (typeof firebase === 'undefined' || !firebase.auth) {
      console.warn('⚠️ Firebase Auth not loaded');
      return Promise.resolve(false);
    }
    
    return new Promise((resolve) => {
      // Listen to auth state changes
      firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          this.user = user;
          this.isAuthenticated = true;
          this.onAuthSuccess(user);
          resolve(true);
        } else {
          this.user = null;
          this.isAuthenticated = false;
          this.showLoginScreen();
          resolve(false);
        }
      });
    });
  },
  
  // Show login screen
  showLoginScreen() {
    const app = document.getElementById('app');
    if (!app) return;
    
    app.innerHTML = `
      <div class="auth-screen">
        <div class="auth-container">
          <div class="auth-left">
            <div class="auth-header">
              <div class="auth-logo">
                <i data-lucide="brain" style="width: 48px; height: 48px;"></i>
              </div>
              <h1>Athena Ultra</h1>
              <p>Your Life, Intelligently Orchestrated</p>
            </div>
          </div>
          
          <div class="auth-right">
            <div class="auth-tabs">
              <button class="auth-tab active" data-tab="login">Login</button>
              <button class="auth-tab" data-tab="register">Registrieren</button>
            </div>
            
            <div class="auth-content">
              <!-- Login Form -->
              <form id="login-form" class="auth-form active">
                <div class="form-group">
                  <label>Email</label>
                  <input type="email" id="login-email" class="form-control" required>
                </div>
                <div class="form-group">
                  <label>Passwort</label>
                  <input type="password" id="login-password" class="form-control" required>
                </div>
                <button type="submit" class="btn btn-primary w-full">
                  <i data-lucide="log-in"></i>
                  Anmelden
                </button>
                <div class="auth-error" id="login-error"></div>
              </form>
              
              <!-- Register Form -->
              <form id="register-form" class="auth-form">
                <div class="form-group">
                  <label>Email</label>
                  <input type="email" id="register-email" class="form-control" required>
                </div>
                <div class="form-group">
                  <label>Passwort (min. 6 Zeichen)</label>
                  <input type="password" id="register-password" class="form-control" required minlength="6">
                </div>
                <div class="form-group">
                  <label>Passwort wiederholen</label>
                  <input type="password" id="register-password-confirm" class="form-control" required>
                </div>
                <button type="submit" class="btn btn-primary w-full">
                  <i data-lucide="user-plus"></i>
                  Registrieren
                </button>
                <div class="auth-error" id="register-error"></div>
            </div>
            
            <div class="auth-divider">oder</div>
            
            <button class="btn btn-secondary w-full" id="google-signin">
              <svg width="18" height="18" viewBox="0 0 48 48" style="margin-right: 8px;">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Mit Google anmelden
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Refresh icons
    if (window.lucide) {
      lucide.createIcons({ icons: lucide.icons, nameAttr: 'data-lucide' });
    }
    
    this.setupAuthListeners();
  },
  
  // Setup event listeners
  setupAuthListeners() {
    // Tab switching
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`${target}-form`).classList.add('active');
      });
    });
    
    // Login form
    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.login();
    });
    
    // Register form
    document.getElementById('register-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.register();
    });
    
    // Google Sign-In
    document.getElementById('google-signin').addEventListener('click', () => {
      this.signInWithGoogle();
    });
  },
  
  // Login with email/password
  async login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    
    try {
      await firebase.auth().signInWithEmailAndPassword(email, password);
      // onAuthStateChanged will handle success
    } catch (error) {
      errorEl.textContent = this.getErrorMessage(error.code);
      errorEl.style.display = 'block';
    }
  },
  
  // Register with email/password
  async register() {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-password-confirm').value;
    const errorEl = document.getElementById('register-error');
    
    if (password !== confirmPassword) {
      errorEl.textContent = 'Passwörter stimmen nicht überein';
      errorEl.style.display = 'block';
      return;
    }
    
    try {
      await firebase.auth().createUserWithEmailAndPassword(email, password);
      // onAuthStateChanged will handle success
    } catch (error) {
      errorEl.textContent = this.getErrorMessage(error.code);
      errorEl.style.display = 'block';
    }
  },
  
  // Sign in with Google
  async signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      await firebase.auth().signInWithPopup(provider);
      // onAuthStateChanged will handle success
    } catch (error) {
      console.error('Google Sign-In error:', error);
      alert('Google Anmeldung fehlgeschlagen: ' + error.message);
    }
  },
  
  // Logout
  async logout() {
    try {
      await firebase.auth().signOut();
      // onAuthStateChanged will handle showing login screen
    } catch (error) {
      console.error('Logout error:', error);
    }
  },
  
  // On successful authentication
  onAuthSuccess(user) {
    console.log('✅ User authenticated:', user.email);
    
    // Update cloud sync with real user ID
    if (window.CloudSync) {
      CloudSync.userId = user.uid;
    }
    
    // Initialize main app (instead of reload)
    if (window.NexusApp && typeof NexusApp.init === 'function') {
      NexusApp.init();
    }
  },
  
  // Get user-friendly error messages
  getErrorMessage(errorCode) {
    const messages = {
      'auth/invalid-email': 'Ungültige Email-Adresse',
      'auth/user-disabled': 'Dieser Account wurde deaktiviert',
      'auth/user-not-found': 'Kein Account mit dieser Email gefunden',
      'auth/wrong-password': 'Falsches Passwort',
      'auth/email-already-in-use': 'Diese Email-Adresse wird bereits verwendet',
      'auth/weak-password': 'Passwort zu schwach (min. 6 Zeichen)',
      'auth/network-request-failed': 'Netzwerkfehler - bitte versuche es erneut',
      'auth/too-many-requests': 'Zu viele Versuche - bitte warte einen Moment'
    };
    
    return messages[errorCode] || 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.';
  }
};

// Export
window.AuthService = AuthService;
