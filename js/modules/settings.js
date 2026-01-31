/* ═══════════════════════════════════════════════════════════════════════════════
   NEXUS ULTRA - Settings Module
   API Keys, Preferences, Data Management
   ═══════════════════════════════════════════════════════════════════════════════ */

const SettingsModule = {
  
  currentTab: 'general',
  _listenersInitialized: false,
  
  // Initialize
  init() {
    this.render();
  },
  
  // Render the settings page
  render() {
    const container = document.getElementById('page-settings');
    if (!container) return;
    
    const settings = NexusStore.getSettings();
    
    container.innerHTML = `
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-medium">Einstellungen</h2>
          <p class="text-secondary">Konfiguriere Athena Ultra nach deinen Wünschen</p>
        </div>
      </div>
      
      <!-- Settings Layout -->
      <div class="layout-two-col">
        <div class="layout-two-col-main">
          
          <!-- Tabs -->
          <div class="tabs mb-6">
            <button class="tab ${this.currentTab === 'general' ? 'active' : ''}" data-tab="general">
              Allgemein
            </button>
            <button class="tab ${this.currentTab === 'atlas-ai' ? 'active' : ''}" data-tab="atlas-ai">
              Atlas AI
            </button>
            <button class="tab ${this.currentTab === 'spheres' ? 'active' : ''}" data-tab="spheres">
              Sphären
            </button>
            <button class="tab ${this.currentTab === 'data' ? 'active' : ''}" data-tab="data">
              Daten
            </button>
            <button class="tab ${this.currentTab === 'about' ? 'active' : ''}" data-tab="about">
              Über
            </button>
          </div>
          
          <!-- Tab Content -->
          <div class="settings-content">
            ${this.renderTabContent(settings)}
          </div>
          
        </div>
        
        <div class="layout-two-col-aside">
          <!-- Quick Status -->
          <div class="panel mb-6">
            <div class="panel-header">
              <span class="panel-title">Status</span>
            </div>
            <div class="panel-body">
              <div class="status-item mb-3">
                <div class="flex items-center gap-2">
                  <span class="${AtlasAI.isConfigured() ? 'text-success' : 'text-warning'}">
                    ${AtlasAI.isConfigured() ? '●' : '○'}
                  </span>
                  <span>Atlas AI</span>
                </div>
                <span class="text-sm text-tertiary">
                  ${AtlasAI.isConfigured() ? 'Verbunden' : 'Nicht konfiguriert'}
                </span>
              </div>
              <div class="status-item mb-3">
                <div class="flex items-center gap-2">
                  <span class="text-success">●</span>
                  <span>Lokaler Speicher</span>
                </div>
                <span class="text-sm text-tertiary">Aktiv</span>
              </div>
            </div>
          </div>
          
          <!-- Storage Info -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Speicher</span>
            </div>
            <div class="panel-body">
              ${this.renderStorageInfo()}
            </div>
          </div>
        </div>
      </div>
    `;
    
    NexusUI.refreshIcons();
  },
  
  // Render tab content
  renderTabContent(settings) {
    switch (this.currentTab) {
      case 'general':
        return this.renderGeneralSettings(settings);
      case 'atlas-ai':
        return this.renderAtlasAISettings(settings);
      case 'spheres':
        return this.renderSpheresSettings(settings);
      case 'data':
        return this.renderDataSettings(settings);
      case 'about':
        return this.renderAboutSettings();
      default:
        return '';
    }
  },
  
  // General Settings
  renderGeneralSettings(settings) {
    return `
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Allgemeine Einstellungen</span>
        </div>
        <div class="panel-body">
          
          <!-- User Name -->
          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">Benutzername</div>
              <div class="setting-description">Dein Name für personalisierte Begrüßungen</div>
            </div>
            <div class="setting-control">
              <input type="text" class="input" id="setting-username" 
                     value="${settings.username || 'Nutzer'}" 
                     placeholder="Dein Name">
            </div>
          </div>
          
          <!-- Theme -->
          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">Theme</div>
              <div class="setting-description">Farbschema der Anwendung</div>
            </div>
            <div class="setting-control">
              <select class="input" id="setting-theme">
                <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Dunkel (Standard)</option>
                <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Hell</option>
                <option value="system" ${settings.theme === 'system' ? 'selected' : ''}>System</option>
              </select>
            </div>
          </div>
          
          <!-- Language -->
          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">Sprache</div>
              <div class="setting-description">Sprache der Benutzeroberfläche</div>
            </div>
            <div class="setting-control">
              <select class="input" id="setting-language">
                <option value="de" ${settings.language === 'de' ? 'selected' : ''}>Deutsch</option>
                <option value="en" ${settings.language === 'en' ? 'selected' : ''}>English</option>
              </select>
            </div>
          </div>
          
          <!-- Start Page -->
          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">Startseite</div>
              <div class="setting-description">Welche Seite beim Start angezeigt werden soll</div>
            </div>
            <div class="setting-control">
              <select class="input" id="setting-startpage">
                <option value="command-center" ${settings.startPage === 'command-center' ? 'selected' : ''}>Command Center</option>
                <option value="tasks" ${settings.startPage === 'tasks' ? 'selected' : ''}>Tasks</option>
                <option value="temporal-engine" ${settings.startPage === 'temporal-engine' ? 'selected' : ''}>Kalender</option>
              </select>
            </div>
          </div>
          
          <div class="mt-6">
            <button class="btn btn-primary" id="save-general-settings">
              Speichern
            </button>
          </div>
          
        </div>
      </div>
    `;
  },
  
  // Atlas AI Settings
  renderAtlasAISettings(settings) {
    const isConfigured = AtlasAI.isConfigured();
    const maskedKey = settings.openaiApiKey ? 
      '••••••••••••' + settings.openaiApiKey.slice(-4) : '';
    
    return `
      <div class="panel mb-6">
        <div class="panel-header">
          <span class="panel-title">🧠 Atlas AI Konfiguration</span>
          <span class="badge ${isConfigured ? 'badge-success' : 'badge-warning'}">
            ${isConfigured ? 'Verbunden' : 'Nicht konfiguriert'}
          </span>
        </div>
        <div class="panel-body">
          
          <div class="atlas-info mb-6 p-4 rounded-md bg-surface-2">
            <p class="mb-2">
              <strong>Atlas AI</strong> nutzt OpenAI's GPT-4o-mini für intelligente Features:
            </p>
            <ul class="text-secondary text-sm" style="list-style: disc; padding-left: 20px;">
              <li>Personalisierte Morning Briefings</li>
              <li>Smart Task Suggestions</li>
              <li>Weekly Reviews & Insights</li>
              <li>Natürliche Sprach-Eingabe</li>
            </ul>
          </div>
          
          <!-- API Key Input -->
          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">OpenAI API Key</div>
              <div class="setting-description">
                Hol dir deinen Key auf 
                <a href="https://platform.openai.com/api-keys" target="_blank" class="text-accent">
                  platform.openai.com
                </a>
              </div>
            </div>
            <div class="setting-control" style="flex: 1; max-width: 400px;">
              ${isConfigured ? `
                <div class="flex items-center gap-2">
                  <input type="text" class="input" value="${maskedKey}" disabled>
                  <button class="btn btn-secondary" id="remove-api-key">Entfernen</button>
                </div>
              ` : `
                <div class="flex items-center gap-2">
                  <input type="password" class="input" id="api-key-input" 
                         placeholder="sk-...">
                  <button class="btn btn-primary" id="save-api-key">Speichern</button>
                </div>
              `}
            </div>
          </div>
          
          ${isConfigured ? `
            <!-- Test Connection -->
            <div class="setting-row">
              <div class="setting-info">
                <div class="setting-label">Verbindung testen</div>
                <div class="setting-description">Prüfe ob der API Key funktioniert</div>
              </div>
              <div class="setting-control">
                <button class="btn btn-secondary" id="test-api-connection">
                  Verbindung testen
                </button>
              </div>
            </div>
          ` : ''}
          
          <div class="warning-box mt-4 p-3 rounded-md" style="background: rgba(148, 133, 74, 0.1); border: 1px solid var(--color-warning);">
            <div class="flex items-start gap-2">
              <span>⚠️</span>
              <div class="text-sm">
                <strong>Sicherheitshinweis:</strong> Der API Key wird lokal in deinem Browser gespeichert.
                Teile diesen Key niemals und nutze für Produktion einen Backend-Proxy.
              </div>
            </div>
          </div>
          
        </div>
      </div>
      
      <!-- AI Model Settings -->
      ${isConfigured ? `
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">AI Modell Einstellungen</span>
          </div>
          <div class="panel-body">
            
            <div class="setting-row">
              <div class="setting-info">
                <div class="setting-label">Modell</div>
                <div class="setting-description">Welches GPT-Modell verwendet werden soll</div>
              </div>
              <div class="setting-control">
                <select class="input" id="setting-ai-model">
                  <option value="gpt-4o-mini" ${settings.aiModel === 'gpt-4o-mini' ? 'selected' : ''}>GPT-4o-mini (Schnell & Günstig)</option>
                  <option value="gpt-4o" ${settings.aiModel === 'gpt-4o' ? 'selected' : ''}>GPT-4o (Beste Qualität)</option>
                  <option value="gpt-3.5-turbo" ${settings.aiModel === 'gpt-3.5-turbo' ? 'selected' : ''}>GPT-3.5 Turbo (Legacy)</option>
                </select>
              </div>
            </div>
            
            <div class="setting-row">
              <div class="setting-info">
                <div class="setting-label">Automatisches Morning Briefing</div>
                <div class="setting-description">Atlas erstellt jeden Morgen automatisch ein Briefing</div>
              </div>
              <div class="setting-control">
                <div class="toggle ${settings.autoBriefing ? 'active' : ''}" id="toggle-auto-briefing">
                  <div class="toggle-slider"></div>
                </div>
              </div>
            </div>
            
            <div class="mt-6">
              <button class="btn btn-primary" id="save-ai-settings">
                Speichern
              </button>
            </div>
            
          </div>
        </div>
      ` : ''}
    `;
  },
  
  // Spheres Settings
  renderSpheresSettings(settings) {
    const spheres = settings.spheres || [
      { id: 'geschaeft', name: 'Geschäft', icon: '💼', color: '#4A7C94' },
      { id: 'projekte', name: 'Projekte', icon: '🚀', color: '#7C6A94' },
      { id: 'schule', name: 'Schule', icon: '📚', color: '#94854A' },
      { id: 'sport', name: 'Sport', icon: '💪', color: '#4A946A' },
      { id: 'freizeit', name: 'Freizeit', icon: '🎮', color: '#6B6862' }
    ];
    
    return `
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Lebensbereiche (Sphären)</span>
          <button class="btn btn-sm" id="add-sphere">+ Neue Sphäre</button>
        </div>
        <div class="panel-body">
          <p class="text-secondary mb-4">
            Sphären helfen dir, deine Aufgaben nach Lebensbereichen zu organisieren.
          </p>
          
          <div class="spheres-list">
            ${spheres.map(sphere => `
              <div class="sphere-item" data-sphere-id="${sphere.id}">
                <div class="flex items-center gap-3">
                  <div class="sphere-color-picker" 
                       style="background: ${sphere.color}; width: 24px; height: 24px; border-radius: 50%;">
                  </div>
                  <span class="text-lg">${sphere.icon}</span>
                  <input type="text" class="input input-sm sphere-name" value="${sphere.name}">
                </div>
                <button class="btn-icon-sm delete-sphere" data-sphere-id="${sphere.id}">
                  ${NexusUI.icon('trash-2', 14)}
                </button>
              </div>
            `).join('')}
          </div>
          
          <div class="mt-6">
            <button class="btn btn-primary" id="save-spheres">
              Sphären speichern
            </button>
          </div>
        </div>
      </div>
    `;
  },
  
  // Data Settings
  renderDataSettings(settings) {
    return `
      <div class="panel mb-6">
        <div class="panel-header">
          <span class="panel-title">Daten Export</span>
        </div>
        <div class="panel-body">
          <p class="text-secondary mb-4">
            Exportiere all deine Daten als JSON-Datei für Backup oder Migration.
          </p>
          <button class="btn btn-secondary" id="export-data">
            ${NexusUI.icon('download', 16)}
            Alle Daten exportieren
          </button>
        </div>
      </div>
      
      <div class="panel mb-6">
        <div class="panel-header">
          <span class="panel-title">Daten Import</span>
        </div>
        <div class="panel-body">
          <p class="text-secondary mb-4">
            Importiere Daten aus einem früheren Export.
          </p>
          <input type="file" id="import-file" accept=".json" style="display: none;">
          <button class="btn btn-secondary" id="import-data">
            ${NexusUI.icon('upload', 16)}
            Daten importieren
          </button>
        </div>
      </div>
      
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title text-critical">⚠️ Gefahrenzone</span>
        </div>
        <div class="panel-body">
          <p class="text-secondary mb-4">
            Diese Aktionen können nicht rückgängig gemacht werden!
          </p>
          
          <div class="flex gap-3">
            <button class="btn btn-secondary" id="reset-demo-data">
              Demo-Daten wiederherstellen
            </button>
            <button class="btn" id="clear-all-data" 
                    style="background: var(--color-critical); color: white;">
              Alle Daten löschen
            </button>
          </div>
        </div>
      </div>
    `;
  },
  
  // About Settings
  renderAboutSettings() {
    return `
      <div class="panel">
        <div class="panel-body text-center p-8">
          <div class="text-4xl mb-4">🌌</div>
          <h2 class="text-2xl font-medium mb-2">Athena Ultra</h2>
          <p class="text-secondary mb-4">Das ultimative Life Operating System</p>
          <p class="text-tertiary text-sm mb-6">Version 1.0.0</p>
          
          <div class="text-left max-w-md mx-auto">
            <h3 class="font-medium mb-2">Features:</h3>
            <ul class="text-secondary text-sm mb-6" style="list-style: disc; padding-left: 20px;">
              <li>Universal Capture Engine</li>
              <li>Command Center mit Atlas AI</li>
              <li>Venture Cockpit für Projekte</li>
              <li>Temporal Engine (Kalender)</li>
              <li>Mind Canvas (Notizen)</li>
              <li>Horizon Tracker (Ziele)</li>
              <li>5 Lebens-Sphären</li>
            </ul>
            
            <h3 class="font-medium mb-2">Tastenkürzel:</h3>
            <div class="grid gap-2 text-sm">
              <div class="flex justify-between">
                <span class="text-secondary">Universal Capture</span>
                <kbd>Ctrl + Space</kbd>
              </div>
              <div class="flex justify-between">
                <span class="text-secondary">Schnellsuche</span>
                <kbd>Ctrl + K</kbd>
              </div>
              <div class="flex justify-between">
                <span class="text-secondary">Navigation</span>
                <kbd>1-7</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },
  
  // Render storage info
  renderStorageInfo() {
    const tasks = NexusStore.getTasks();
    const habits = NexusStore.getHabits();
    const projects = NexusStore.getProjects();
    const notes = NexusStore.getNotes();
    const goals = NexusStore.getGoals();
    
    return `
      <div class="storage-stats">
        <div class="flex justify-between mb-2">
          <span class="text-secondary">Tasks</span>
          <span class="mono">${tasks.length}</span>
        </div>
        <div class="flex justify-between mb-2">
          <span class="text-secondary">Habits</span>
          <span class="mono">${habits.length}</span>
        </div>
        <div class="flex justify-between mb-2">
          <span class="text-secondary">Projekte</span>
          <span class="mono">${projects.length}</span>
        </div>
        <div class="flex justify-between mb-2">
          <span class="text-secondary">Notizen</span>
          <span class="mono">${notes.length}</span>
        </div>
        <div class="flex justify-between mb-2">
          <span class="text-secondary">Ziele</span>
          <span class="mono">${goals.length}</span>
        </div>
        <hr class="my-3" style="border-color: var(--color-border);">
        <div class="flex justify-between">
          <span class="text-secondary">Speicher</span>
          <span class="mono">${this.getStorageSize()}</span>
        </div>
      </div>
    `;
  },
  
  // Calculate storage size
  getStorageSize() {
    let total = 0;
    for (let key in localStorage) {
      if (key.startsWith('nexus_')) {
        total += localStorage.getItem(key).length * 2; // UTF-16
      }
    }
    if (total < 1024) return total + ' B';
    if (total < 1024 * 1024) return (total / 1024).toFixed(1) + ' KB';
    return (total / 1024 / 1024).toFixed(1) + ' MB';
  },
  
  // Switch tab
  switchTab(tab) {
    this.currentTab = tab;
    this.render();
  },
  
  // Save General Settings
  saveGeneralSettings() {
    const username = document.getElementById('setting-username')?.value;
    const theme = document.getElementById('setting-theme')?.value;
    const language = document.getElementById('setting-language')?.value;
    const startPage = document.getElementById('setting-startpage')?.value;
    
    NexusStore.updateSettings({ username, theme, language, startPage });
    NexusUI.showToast('Einstellungen gespeichert!', 'success');
  },
  
  // Save API Key
  async saveApiKey() {
    const input = document.getElementById('api-key-input');
    const key = input?.value?.trim();
    
    if (!key || !key.startsWith('sk-')) {
      NexusUI.showToast('Ungültiger API Key', 'error');
      return;
    }
    
    AtlasAI.setApiKey(key);
    
    // Test the connection
    NexusUI.showToast('Teste Verbindung...', 'info');
    const result = await AtlasAI.testConnection();
    
    if (result.success) {
      NexusUI.showToast('API Key gespeichert & verifiziert!', 'success');
      this.render();
    } else {
      AtlasAI.removeApiKey();
      NexusUI.showToast('Verbindung fehlgeschlagen: ' + result.error, 'error');
    }
  },
  
  // Remove API Key
  removeApiKey() {
    if (confirm('API Key wirklich entfernen?')) {
      AtlasAI.removeApiKey();
      NexusUI.showToast('API Key entfernt', 'success');
      this.render();
    }
  },
  
  // Test API Connection
  async testConnection() {
    NexusUI.showToast('Teste Verbindung...', 'info');
    const result = await AtlasAI.testConnection();
    
    if (result.success) {
      NexusUI.showToast('Verbindung erfolgreich!', 'success');
    } else {
      NexusUI.showToast('Fehler: ' + result.error, 'error');
    }
  },
  
  // Export all data
  exportData() {
    const data = NexusStore.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-ultra-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    NexusUI.showToast('Daten exportiert!', 'success');
  },
  
  // Import data
  importData() {
    document.getElementById('import-file')?.click();
  },
  
  // Handle file import
  handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        NexusStore.importAll(data);
        NexusUI.showToast('Daten importiert!', 'success');
        this.render();
      } catch (error) {
        NexusUI.showToast('Import fehlgeschlagen: ' + error.message, 'error');
      }
    };
    reader.readAsText(file);
  },
  
  // Reset to demo data
  resetDemoData() {
    if (confirm('Alle Daten werden durch Demo-Daten ersetzt. Fortfahren?')) {
      NexusStore.clearAll();
      NexusStore.seedDemoData();
      NexusUI.showToast('Demo-Daten wiederhergestellt!', 'success');
      this.render();
    }
  },
  
  // Clear all data
  clearAllData() {
    if (confirm('ALLE Daten werden unwiderruflich gelöscht! Bist du sicher?')) {
      if (confirm('Wirklich ALLE Daten löschen?')) {
        NexusStore.clearAll();
        NexusUI.showToast('Alle Daten gelöscht', 'success');
        this.render();
      }
    }
  },
  
  // Setup event listeners
  setupEventListeners() {
    if (this._listenersInitialized) return;
    this._listenersInitialized = true;
    
    document.addEventListener('click', (e) => {
      // Tab switching
      const tab = e.target.closest('.tabs .tab');
      if (tab && tab.dataset.tab && e.target.closest('#page-settings')) {
        this.switchTab(tab.dataset.tab);
        return;
      }
      
      // Save general settings
      if (e.target.id === 'save-general-settings') {
        this.saveGeneralSettings();
        return;
      }
      
      // Save API key
      if (e.target.id === 'save-api-key') {
        this.saveApiKey();
        return;
      }
      
      // Remove API key
      if (e.target.id === 'remove-api-key') {
        this.removeApiKey();
        return;
      }
      
      // Test connection
      if (e.target.id === 'test-api-connection') {
        this.testConnection();
        return;
      }
      
      // Export data
      if (e.target.id === 'export-data') {
        this.exportData();
        return;
      }
      
      // Import data
      if (e.target.id === 'import-data') {
        this.importData();
        return;
      }
      
      // Reset demo data
      if (e.target.id === 'reset-demo-data') {
        this.resetDemoData();
        return;
      }
      
      // Clear all data
      if (e.target.id === 'clear-all-data') {
        this.clearAllData();
        return;
      }
    });
    
    // File input change
    document.addEventListener('change', (e) => {
      if (e.target.id === 'import-file') {
        this.handleFileImport(e);
      }
    });
  }
};

// Initialize on navigation
window.addEventListener('nexus:navigate', (e) => {
  if (e.detail.page === 'settings') {
    SettingsModule.init();
  }
});

// Export
window.SettingsModule = SettingsModule;
