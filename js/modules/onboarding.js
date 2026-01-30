/* ═══════════════════════════════════════════════════════════════════════════════
   NEXUS ULTRA - Onboarding Module
   Professional first-time user experience
   ═══════════════════════════════════════════════════════════════════════════════ */

const OnboardingModule = {
  
  currentStep: 0,
  userData: {
    name: '',
    focusAreas: [],
    createSampleData: true
  },
  
  ONBOARDING_KEY: 'nexus_onboarding_complete',
  
  // Check if onboarding needed
  isNeeded() {
    try {
      return !localStorage.getItem(this.ONBOARDING_KEY);
    } catch (e) {
      // If localStorage blocked, check memory
      return !window._onboardingComplete;
    }
  },
  
  // Mark onboarding complete
  markComplete() {
    try {
      localStorage.setItem(this.ONBOARDING_KEY, 'true');
    } catch (e) {
      window._onboardingComplete = true;
    }
  },
  
  // Steps configuration
  steps: [
    {
      id: 'welcome',
      title: 'Willkommen',
      render: () => `
        <div class="onboarding-hero">
          <div class="onboarding-logo">
            <span class="logo-icon">◈</span>
            <span class="logo-text">NEXUS ULTRA</span>
          </div>
          <h1 class="onboarding-title">Dein persönliches<br>Life Operating System</h1>
          <p class="onboarding-subtitle">
            Organisiere alle Bereiche deines Lebens an einem Ort.<br>
            Tasks, Habits, Projekte, Ziele – alles vernetzt.
          </p>
        </div>
      `
    },
    {
      id: 'name',
      title: 'Wie heißt du?',
      render: () => `
        <div class="onboarding-content">
          <div class="onboarding-icon">👋</div>
          <h2 class="onboarding-heading">Wie dürfen wir dich nennen?</h2>
          <p class="onboarding-text">Personalisiere dein NEXUS-Erlebnis</p>
          <input 
            type="text" 
            id="onboarding-name" 
            class="onboarding-input" 
            placeholder="Dein Name"
            autocomplete="off"
            autofocus
          >
        </div>
      `
    },
    {
      id: 'spheres',
      title: 'Lebensbereiche',
      render: () => `
        <div class="onboarding-content">
          <div class="onboarding-icon">🌐</div>
          <h2 class="onboarding-heading">Deine Lebensbereiche</h2>
          <p class="onboarding-text">NEXUS organisiert dein Leben in "Sphären" – verschiedene Bereiche wie Arbeit, Projekte, Sport etc. Du kannst alle Tasks, Habits und Projekte einer oder mehreren Sphären zuordnen.</p>
          <div class="onboarding-spheres">
            <label class="sphere-option selected" data-sphere="geschaeft">
              <span class="sphere-icon">💼</span>
              <span class="sphere-name">Geschäft</span>
              <span class="sphere-check">✓</span>
            </label>
            <label class="sphere-option selected" data-sphere="projekte">
              <span class="sphere-icon">🚀</span>
              <span class="sphere-name">Projekte</span>
              <span class="sphere-check">✓</span>
            </label>
            <label class="sphere-option selected" data-sphere="schule">
              <span class="sphere-icon">📚</span>
              <span class="sphere-name">Schule/Uni</span>
              <span class="sphere-check">✓</span>
            </label>
            <label class="sphere-option selected" data-sphere="sport">
              <span class="sphere-icon">💪</span>
              <span class="sphere-name">Sport</span>
              <span class="sphere-check">✓</span>
            </label>
            <label class="sphere-option selected" data-sphere="freizeit">
              <span class="sphere-icon">🎮</span>
              <span class="sphere-name">Freizeit</span>
              <span class="sphere-check">✓</span>
            </label>
          </div>
        </div>
      `
    },
    {
      id: 'feature-command',
      title: 'Command Center',
      render: () => `
        <div class="onboarding-content">
          <div class="onboarding-icon">⌘</div>
          <h2 class="onboarding-heading">Command Center</h2>
          <p class="onboarding-text">Dein tägliches Dashboard. Hier siehst du auf einen Blick:</p>
          <div class="feature-list">
            <div class="feature-list-item">
              <span class="feature-bullet">→</span>
              <span>Alle Tasks für heute, nach Tageszeit sortiert</span>
            </div>
            <div class="feature-list-item">
              <span class="feature-bullet">→</span>
              <span>Überfällige Aufgaben die dringend erledigt werden müssen</span>
            </div>
            <div class="feature-list-item">
              <span class="feature-bullet">→</span>
              <span>Deine täglichen Habits zum Abhaken</span>
            </div>
            <div class="feature-list-item">
              <span class="feature-bullet">→</span>
              <span>Quick-Capture für neue Gedanken und Tasks</span>
            </div>
          </div>
        </div>
      `
    },
    {
      id: 'feature-tasks',
      title: 'Tasks & Habits',
      render: () => `
        <div class="onboarding-content">
          <div class="onboarding-icon">✅</div>
          <h2 class="onboarding-heading">Tasks & Habits</h2>
          <div class="feature-split">
            <div class="feature-box">
              <h3>📋 Tasks</h3>
              <p>Einmalige Aufgaben mit Deadline, Priorität und Sphäre. Filtere nach Status, sortiere nach Wichtigkeit, nutze die Kanban-Ansicht.</p>
            </div>
            <div class="feature-box">
              <h3>🔄 Habits</h3>
              <p>Tägliche, wöchentliche oder monatliche Gewohnheiten. Verfolge deinen Streak und baue positive Routinen auf.</p>
            </div>
          </div>
        </div>
      `
    },
    {
      id: 'feature-projects',
      title: 'Projekte & Ventures',
      render: () => `
        <div class="onboarding-content">
          <div class="onboarding-icon">🚀</div>
          <h2 class="onboarding-heading">Projekte & Ventures</h2>
          <div class="feature-split">
            <div class="feature-box">
              <h3>📁 Projekte</h3>
              <p>Gruppiere zusammengehörige Tasks. Verfolge den Fortschritt, setze Deadlines und halte alles organisiert.</p>
            </div>
            <div class="feature-box">
              <h3>💎 Venture Cockpit</h3>
              <p>Für größere Unternehmungen: Analysiere ROI, Risiken und Chancen deiner wichtigsten Projekte.</p>
            </div>
          </div>
        </div>
      `
    },
    {
      id: 'feature-calendar',
      title: 'Kalender & Ziele',
      render: () => `
        <div class="onboarding-content">
          <div class="onboarding-icon">📅</div>
          <h2 class="onboarding-heading">Kalender & Ziele</h2>
          <div class="feature-split">
            <div class="feature-box">
              <h3>⏰ Temporal Engine</h3>
              <p>Wochen- und Monatsansicht. Plane deine Zeit, sieh Termine und Tasks visuell auf einem Zeitstrahl.</p>
            </div>
            <div class="feature-box">
              <h3>🎯 Horizon Tracker</h3>
              <p>Langfristige Ziele von 1-Jahres bis 10-Jahres-Horizont. Behalte das große Bild im Blick.</p>
            </div>
          </div>
        </div>
      `
    },
    {
      id: 'feature-more',
      title: 'Weitere Features',
      render: () => `
        <div class="onboarding-content">
          <div class="onboarding-icon">✨</div>
          <h2 class="onboarding-heading">Und noch mehr...</h2>
          <div class="feature-grid compact">
            <div class="feature-card">
              <div class="feature-icon">🧠</div>
              <h3>Mind Canvas</h3>
              <p>Notizen, Ideen & Bucket List</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📊</div>
              <h3>Analytics</h3>
              <p>Statistiken & Produktivität</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">👥</div>
              <h3>Kontakte</h3>
              <p>Netzwerk & Beziehungen</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📥</div>
              <h3>Inbox</h3>
              <p>Schnelle Erfassung</p>
            </div>
          </div>
        </div>
      `
    },
    {
      id: 'shortcuts',
      title: 'Shortcuts',
      render: () => `
        <div class="onboarding-content">
          <div class="onboarding-icon">⌨️</div>
          <h2 class="onboarding-heading">Tastaturkürzel</h2>
          <p class="onboarding-text">Arbeite schneller mit diesen Shortcuts:</p>
          <div class="shortcut-list">
            <div class="shortcut-item">
              <kbd>C</kbd>
              <span>Quick Capture öffnen</span>
            </div>
            <div class="shortcut-item">
              <kbd>1</kbd> - <kbd>5</kbd>
              <span>Schnell zur Seite navigieren</span>
            </div>
            <div class="shortcut-item">
              <kbd>?</kbd>
              <span>Hilfe anzeigen</span>
            </div>
            <div class="shortcut-item">
              <kbd>Esc</kbd>
              <span>Modals schließen</span>
            </div>
          </div>
        </div>
      `
    },
    {
      id: 'setup',
      title: 'Fertig!',
      render: (module) => `
        <div class="onboarding-content">
          <div class="onboarding-icon">🚀</div>
          <h2 class="onboarding-heading">Alles bereit, ${module.userData.name || 'Freund'}!</h2>
          <p class="onboarding-text">Möchtest du mit Beispieldaten starten?</p>
          <div class="setup-options">
            <label class="setup-option ${module.userData.createSampleData ? 'selected' : ''}" data-option="sample">
              <div class="option-icon">📦</div>
              <div class="option-content">
                <div class="option-title">Mit Beispieldaten starten</div>
                <div class="option-desc">Ideal zum Erkunden der Features</div>
              </div>
              <span class="option-check">✓</span>
            </label>
            <label class="setup-option ${!module.userData.createSampleData ? 'selected' : ''}" data-option="empty">
              <div class="option-icon">✨</div>
              <div class="option-content">
                <div class="option-title">Leer starten</div>
                <div class="option-desc">Direkt mit deinen eigenen Daten</div>
              </div>
              <span class="option-check">✓</span>
            </label>
          </div>
        </div>
      `
    }
  ],
  
  // Start onboarding
  start() {
    this.currentStep = 0;
    this.render();
    this.setupEventListeners();
  },
  
  // Render current step
  render() {
    const step = this.steps[this.currentStep];
    const isFirst = this.currentStep === 0;
    const isLast = this.currentStep === this.steps.length - 1;
    
    const overlay = document.createElement('div');
    overlay.className = 'onboarding-overlay';
    overlay.id = 'onboarding-overlay';
    
    overlay.innerHTML = `
      <div class="onboarding-container">
        <!-- Progress -->
        <div class="onboarding-progress">
          ${this.steps.map((s, i) => `
            <div class="progress-dot ${i === this.currentStep ? 'active' : ''} ${i < this.currentStep ? 'completed' : ''}"></div>
          `).join('')}
        </div>
        
        <!-- Content -->
        <div class="onboarding-step" data-step="${step.id}">
          ${step.render(this)}
        </div>
        
        <!-- Navigation -->
        <div class="onboarding-nav">
          ${!isFirst ? '<button class="onboarding-btn secondary" id="onboarding-back">Zurück</button>' : '<div></div>'}
          <button class="onboarding-btn primary" id="onboarding-next">
            ${isLast ? 'Los geht\'s!' : isFirst ? 'Starten' : 'Weiter'}
          </button>
        </div>
      </div>
    `;
    
    // Remove existing overlay
    const existing = document.getElementById('onboarding-overlay');
    if (existing) existing.remove();
    
    document.body.appendChild(overlay);
    
    // Focus input if present
    setTimeout(() => {
      const input = overlay.querySelector('input');
      if (input) input.focus();
    }, 100);
  },
  
  // Setup event listeners
  setupEventListeners() {
    document.addEventListener('click', (e) => {
      // Next button
      if (e.target.id === 'onboarding-next') {
        this.next();
        return;
      }
      
      // Back button
      if (e.target.id === 'onboarding-back') {
        this.back();
        return;
      }
      
      // Sphere selection
      const sphere = e.target.closest('.sphere-option');
      if (sphere) {
        sphere.classList.toggle('selected');
        return;
      }
      
      // Setup option selection
      const option = e.target.closest('.setup-option');
      if (option) {
        document.querySelectorAll('.setup-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        this.userData.createSampleData = option.dataset.option === 'sample';
        return;
      }
    });
    
    // Enter key to proceed
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && document.getElementById('onboarding-overlay')) {
        this.next();
      }
    });
  },
  
  // Go to next step
  next() {
    // Save data from current step
    this.saveStepData();
    
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.render();
    } else {
      this.complete();
    }
  },
  
  // Go back
  back() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.render();
    }
  },
  
  // Save data from current step
  saveStepData() {
    const step = this.steps[this.currentStep];
    
    if (step.id === 'name') {
      const input = document.getElementById('onboarding-name');
      if (input) {
        this.userData.name = input.value.trim() || 'Nutzer';
      }
    }
    
    if (step.id === 'spheres') {
      this.userData.focusAreas = [];
      document.querySelectorAll('.sphere-option.selected').forEach(s => {
        this.userData.focusAreas.push(s.dataset.sphere);
      });
    }
  },
  
  // Complete onboarding
  complete() {
    // Update user name
    NexusStore.state.user.name = this.userData.name || 'Nutzer';
    
    // Create sample data if requested
    if (this.userData.createSampleData) {
      NexusStore.createSampleData();
    }
    
    // Save
    NexusStore.save();
    
    // Mark complete
    this.markComplete();
    
    // Remove overlay with animation
    const overlay = document.getElementById('onboarding-overlay');
    if (overlay) {
      overlay.classList.add('fade-out');
      setTimeout(() => {
        overlay.remove();
        // Start the main app
        if (typeof NexusApp !== 'undefined') {
          NexusApp.startApp();
        }
      }, 300);
    }
    
    console.log('✅ Onboarding complete!');
  }
};

// Export
window.OnboardingModule = OnboardingModule;
