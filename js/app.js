/* ═══════════════════════════════════════════════════════════════════════════════
   NEXUS ULTRA - Main Application
   Das ultimative Life Operating System
   ═══════════════════════════════════════════════════════════════════════════════ */

const NexusApp = {
  
  currentPage: 'command-center',
  isAtlasOpen: false,
  isCaptureOpen: false,
  
  // Initialize the application
  init() {
    console.log('Athena Ultra initializing...');
    
    // Initialize Lucide icons
    if (window.lucide) {
      lucide.createIcons();
    }
    
    // Check if onboarding needed
    if (typeof OnboardingModule !== 'undefined' && OnboardingModule.isNeeded()) {
      console.log('👋 Starting onboarding...');
      OnboardingModule.start();
      return; // Wait for onboarding to complete
    }
    
    this.startApp();
  },
  
  // Start the main application
  startApp() {
    // Setup event listeners
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
    
    // Initialize date display
    this.updateDateDisplay();
    
    // Update sidebar badges
    this.updateSidebarBadges();
    
    // Navigate to default page
    this.navigateTo('command-center');
    
    console.log('Athena Ultra ready!');
  },
  
  // Update sidebar badges with real counts
  updateSidebarBadges() {
    const tasksBadge = document.getElementById('tasks-count-badge');
    if (tasksBadge && typeof NexusStore !== 'undefined') {
      const pendingTasks = NexusStore.getTasks().filter(t => t.status !== 'completed').length;
      if (pendingTasks > 0) {
        tasksBadge.textContent = pendingTasks;
        tasksBadge.style.display = 'flex';
      } else {
        tasksBadge.style.display = 'none';
      }
    }
  },
  
  // Navigate to a page
  navigateTo(page) {
    this.currentPage = page;
    
    // Update sidebar badges
    this.updateSidebarBadges();
    
    // Update navigation active state
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });
    
    // Hide all pages
    document.querySelectorAll('.page-view').forEach(view => {
      view.classList.remove('active');
    });
    
    // Show target page
    const targetPage = document.getElementById(`page-${page}`);
    if (targetPage) {
      targetPage.classList.add('active');
    }
    
    // Dispatch navigation event for modules
    window.dispatchEvent(new CustomEvent('nexus:navigate', { 
      detail: { page } 
    }));
  },
  
  // Update date display
  updateDateDisplay() {
    const dateEl = document.getElementById('current-date');
    if (dateEl) {
      const now = new Date();
      const options = { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      };
      dateEl.textContent = now.toLocaleDateString('de-DE', options);
    }
  },
  
  // Setup event listeners
  setupEventListeners() {
    // Navigation clicks
    document.addEventListener('click', (e) => {
      console.log('🖱️ App click:', e.target.tagName, e.target.className);
      
      // Nav items
      const navItem = e.target.closest('.nav-item');
      if (navItem && navItem.dataset.page) {
        console.log('  → Navigating to:', navItem.dataset.page);
        e.preventDefault();
        this.navigateTo(navItem.dataset.page);
        return;
      }
      
      // Capture button
      if (e.target.closest('#capture-btn') || e.target.closest('.open-capture')) {
        console.log('  → Opening capture');
        e.preventDefault();
        this.openCapture();
        return;
      }
      
      // Close capture
      if (e.target.closest('.capture-close') || e.target.closest('.capture-backdrop')) {
        this.closeCapture();
        return;
      }
      
      // Close modal
      if (e.target.closest('#modal-close') || e.target.closest('#modal-overlay:not(.modal)')) {
        if (e.target.closest('#modal-overlay') && !e.target.closest('.modal')) {
          NexusUI.closeModal();
          return;
        }
        if (e.target.closest('#modal-close')) {
          NexusUI.closeModal();
          return;
        }
      }
      
      // Atlas toggle
      if (e.target.closest('#atlas-toggle')) {
        this.toggleAtlas();
        return;
      }
      
      // Atlas close
      if (e.target.closest('#atlas-close')) {
        this.closeAtlas();
        return;
      }
      
      // Atlas send
      if (e.target.closest('#atlas-send')) {
        this.sendAtlasMessage();
        return;
      }
      
      // Atlas Morning Briefing
      if (e.target.closest('#atlas-morning-briefing')) {
        this.showAtlasMorningBriefing();
        return;
      }
      
      // Atlas Evening Summary
      if (e.target.closest('#atlas-evening-summary')) {
        this.showAtlasEveningSummary();
        return;
      }
      
      // Atlas Insights
      if (e.target.closest('#atlas-insights')) {
        this.showAtlasInsights();
        return;
      }
    });
    
    // Atlas input enter key
    document.addEventListener('keydown', (e) => {
      if (e.target.id === 'atlas-input' && e.key === 'Enter') {
        if (!e.shiftKey) {
          e.preventDefault();
          this.sendAtlasMessage();
        }
        // Shift+Enter erlaubt neue Zeile (default behavior)
      }
    });
    
    // Auto-resize textarea
    document.addEventListener('input', (e) => {
      if (e.target.id === 'atlas-input') {
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
      }
    });
    
    // Capture form submission
    const captureInput = document.getElementById('capture-input');
    if (captureInput) {
      captureInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.processCapture();
        }
        if (e.key === 'Escape') {
          this.closeCapture();
        }
      });
    }
    
    // Quick actions in capture
    document.addEventListener('click', (e) => {
      const quickAction = e.target.closest('.capture-quick-action');
      if (quickAction) {
        const type = quickAction.dataset.type;
        const input = document.getElementById('capture-input');
        if (input) {
          const prefixes = {
            task: '',
            event: '📅 ',
            note: '📝 ',
            idea: '?? ',
            habit: '+daily '
          };
          input.value = prefixes[type] || '';
          input.focus();
        }
      }
    });
  },
  
  // Setup keyboard shortcuts
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Cmd/Ctrl + Space - Open Capture
      if ((e.metaKey || e.ctrlKey) && e.code === 'Space') {
        e.preventDefault();
        this.toggleCapture();
        return;
      }
      
      // Escape - Close modals/capture
      if (e.key === 'Escape') {
        if (this.isCaptureOpen) {
          this.closeCapture();
        }
        NexusUI.closeModal();
        return;
      }
      
      // Cmd/Ctrl + K - Quick search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.openSearch();
        return;
      }
      
      // Number keys 1-7 for navigation (when not in input)
      if (!e.target.matches('input, textarea, select')) {
        const pages = [
          'command-center',
          'inbox',
          'projects',
          'venture-cockpit',
          'temporal-engine',
          'mind-canvas',
          'horizon-tracker'
        ];
        
        const num = parseInt(e.key);
        if (num >= 1 && num <= 7) {
          this.navigateTo(pages[num - 1]);
        }
      }
    });
  },
  
  // Open capture overlay
  openCapture() {
    const overlay = document.getElementById('capture-overlay');
    if (overlay) {
      overlay.classList.add('active');
      this.isCaptureOpen = true;
      
      const input = document.getElementById('capture-input');
      if (input) {
        input.value = '';
        input.focus();
      }
    }
  },
  
  // Close capture overlay
  closeCapture() {
    const overlay = document.getElementById('capture-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      this.isCaptureOpen = false;
    }
  },
  
  // Toggle capture
  toggleCapture() {
    if (this.isCaptureOpen) {
      this.closeCapture();
    } else {
      this.openCapture();
    }
  },
  
  // Process capture input
  processCapture() {
    const input = document.getElementById('capture-input');
    if (!input || !input.value.trim()) return;
    
    const text = input.value.trim();
    
    // Parse the input
    const parsed = SmartParser.parse(text);
    
    // Create the entity
    const entity = SmartParser.createEntity(parsed);
    
    if (entity) {
      NexusUI.showToast(`${this.getEntityIcon(parsed.type)} ${this.getEntityLabel(parsed.type)} erstellt!`, 'success');
      
      // Close capture
      this.closeCapture();
      
      // Refresh current page
      this.refreshCurrentPage();
    } else {
      NexusUI.showToast('Fehler beim Erstellen', 'error');
    }
  },
  
  // Get entity icon
  getEntityIcon(type) {
    const icons = {
      task: '✓',
      event: '📅',
      habit: '🔄',
      note: '📝',
      idea: '💡',
      contact: '👤'
    };
    return icons[type] || '✓';
  },
  
  // Get entity label
  getEntityLabel(type) {
    const labels = {
      task: 'Task',
      event: 'Event',
      habit: 'Habit',
      note: 'Notiz',
      idea: 'Idee',
      contact: 'Kontakt'
    };
    return labels[type] || 'Item';
  },
  
  // Refresh current page
  refreshCurrentPage() {
    window.dispatchEvent(new CustomEvent('nexus:navigate', { 
      detail: { page: this.currentPage } 
    }));
  },
  
  // Toggle Atlas panel (delegated to AtlasController)
  toggleAtlas() {
    if (typeof AtlasController !== 'undefined') {
      AtlasController.toggle();
      this.isAtlasOpen = AtlasController.isOpen;
    }
  },
  
  // Close Atlas panel (delegated to AtlasController)
  closeAtlas() {
    if (typeof AtlasController !== 'undefined') {
      AtlasController.close();
      this.isAtlasOpen = false;
    }
  },
  
  // Send message to Atlas
  sendAtlasMessage() {
    const input = document.getElementById('atlas-input');
    const messagesContainer = document.getElementById('atlas-messages');
    
    if (!input || !messagesContainer) return;
    
    const message = input.value.trim();
    if (!message) return;
    
    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'atlas-message-item user';
    userMsg.innerHTML = `
      <div class="atlas-message-avatar">👤</div>
      <div class="atlas-message-content">${message}</div>
    `;
    messagesContainer.appendChild(userMsg);
    
    // Clear input and reset height
    input.value = '';
    input.style.height = 'auto';
    input.rows = 1;
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Process with AI service
    this.processAtlasMessage(message, messagesContainer);
  },
  
  // Format Atlas AI response with proper HTML formatting
  formatAtlasResponse(text) {
    if (!text) return '';
    
    // Convert numbered lists: "1. " or "1. **"
    text = text.replace(/(\d+)\.\s+\*\*(.*?)\*\*/g, '<div style="margin-top:12px"><strong>$1. $2</strong></div>');
    text = text.replace(/(\d+)\.\s+([^*\n])/g, '<div style="margin-top:8px">$1. $2');
    
    // Convert bullet points: "- " or "• "
    text = text.replace(/^[\-•]\s+(.+)/gm, '<div style="margin-left:16px;margin-top:4px">• $1</div>');
    
    // Convert bold: **text**
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert section headers (with emoji or caps)
    text = text.replace(/^([🌅🌙📊💡🎯⚡🔥]+)\s+(.+)$/gm, '<div style="margin-top:16px;font-size:1.1em"><strong>$1 $2</strong></div>');
    
    // Convert line breaks (double newline = paragraph, single = br)
    text = text.replace(/\n\n/g, '<div style="height:12px"></div>');
    text = text.replace(/\n/g, '<br>');
    
    // Clean up any remaining closing divs that weren't opened
    text = text.replace(/<\/div>(?!.*<div)/g, '');
    
    return text;
  },
  
  // Process message with AI
  async processAtlasMessage(message, container) {
    // Add thinking indicator
    const thinkingMsg = document.createElement('div');
    thinkingMsg.className = 'atlas-message-item assistant';
    thinkingMsg.id = 'atlas-thinking';
    thinkingMsg.innerHTML = `
      <div class="atlas-message-avatar">🧠</div>
      <div class="atlas-message-content">
        <span class="thinking-dots">Denke nach...</span>
      </div>
    `;
    container.appendChild(thinkingMsg);
    container.scrollTop = container.scrollHeight;
    
    try {
      // Try to use AI service if available
      if (typeof AtlasAI !== 'undefined' && AtlasAI.hasApiKey()) {
        const response = await AtlasAI.sendMessage(message);
        thinkingMsg.remove();
        
        const aiMsg = document.createElement('div');
        aiMsg.className = 'atlas-message-item assistant';
        aiMsg.innerHTML = `
          <div class="atlas-message-avatar">🧠</div>
          <div class="atlas-message-content">${this.formatAtlasResponse(response)}</div>
        `;
        container.appendChild(aiMsg);
      } else {
        // Fallback: parse command locally
        thinkingMsg.remove();
        const response = this.parseAtlasCommand(message);
        
        const aiMsg = document.createElement('div');
        aiMsg.className = 'atlas-message-item assistant';
        aiMsg.innerHTML = `
          <div class="atlas-message-avatar">🧠</div>
          <div class="atlas-message-content">${response}</div>
        `;
        container.appendChild(aiMsg);
      }
    } catch (error) {
      thinkingMsg.remove();
      const errorMsg = document.createElement('div');
      errorMsg.className = 'atlas-message-item assistant';
      errorMsg.innerHTML = `
        <div class="atlas-message-avatar">🧠</div>
        <div class="atlas-message-content">Entschuldigung, da ist etwas schiefgelaufen. Bitte versuche es erneut.</div>
      `;
      container.appendChild(errorMsg);
    }
    
    container.scrollTop = container.scrollHeight;
  },
  
  // Parse Atlas command locally (fallback when no API key)
  parseAtlasCommand(message) {
    const lowerMsg = message.toLowerCase();
    
    // Task creation
    if (lowerMsg.includes('erstelle') && (lowerMsg.includes('task') || lowerMsg.includes('aufgabe'))) {
      const title = message.replace(/erstelle.*?(task|aufgabe):?/i, '').trim();
      if (title && typeof NexusStore !== 'undefined') {
        NexusStore.addTask({ title, priority: 'normal' });
        this.refreshCurrentPage();
        return `✅ Task erstellt: "${title}"`;
      }
      return 'Bitte gib einen Titel für die Task an, z.B.: "Erstelle Task: Meeting vorbereiten"';
    }
    
    // Show tasks
    if (lowerMsg.includes('zeig') && lowerMsg.includes('task')) {
      const tasks = NexusStore.getTasks().filter(t => t.status !== 'completed');
      if (tasks.length === 0) return '📋 Du hast keine offenen Tasks!';
      return `📋 Deine ${tasks.length} offenen Tasks:<br><br>` + 
        tasks.slice(0, 5).map(t => `• ${t.title}`).join('<br>') +
        (tasks.length > 5 ? `<br>... und ${tasks.length - 5} weitere` : '');
    }
    
    // Help
    if (lowerMsg.includes('hilfe') || lowerMsg.includes('help')) {
      return `Ich kann dir helfen mit:<br><br>
        📋 <strong>"Erstelle Task: [Titel]"</strong> - Neue Task anlegen<br>
        📊 <strong>"Zeig meine Tasks"</strong> - Offene Tasks anzeigen<br>
        ⚙️ <strong>"Gehe zu Einstellungen"</strong> - Navigieren<br><br>
        💡 Für volle KI-Funktionen, hinterlege einen OpenAI API-Key in den Einstellungen.`;
    }
    
    // Navigation
    if (lowerMsg.includes('gehe zu') || lowerMsg.includes('öffne')) {
      const pages = ['command-center', 'tasks', 'habits', 'projects', 'calendar', 'settings'];
      for (const page of pages) {
        if (lowerMsg.includes(page.replace('-', ' ')) || lowerMsg.includes(page)) {
          this.navigateTo(page);
          this.closeAtlas();
          return `🚀 Navigiere zu ${page}...`;
        }
      }
      if (lowerMsg.includes('einstellung')) {
        this.navigateTo('settings');
        this.closeAtlas();
        return '⚙️ Öffne Einstellungen...';
      }
    }
    
    // Default response
    return `Ich verstehe deine Anfrage noch nicht ganz. Versuche es mit:<br><br>
      • "Erstelle Task: [Titel]"<br>
      • "Zeig meine Tasks"<br>
      • "Hilfe"<br><br>
      💡 Für erweiterte KI-Funktionen, füge einen API-Key in den Einstellungen hinzu.`;
  },
  
  // Open search
  openSearch() {
    // For now, open capture as search
    this.openCapture();
    const input = document.getElementById('capture-input');
    if (input) {
      input.placeholder = 'Suchen...';
    }
  },
  
  // Show Atlas Morning Briefing
  async showAtlasMorningBriefing() {
    const messagesEl = document.getElementById('atlas-messages');
    if (!messagesEl) return;
    
    // Add loading message
    const loadingMsg = `
      <div class="atlas-message-item assistant">
        <div class="atlas-message-avatar">🧠</div>
        <div class="atlas-message-content">
          <div class="loading">🌅 Erstelle dein Morning Briefing...</div>
        </div>
      </div>
    `;
    messagesEl.insertAdjacentHTML('beforeend', loadingMsg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    
    try {
      const briefing = await AtlasAI.generateMorningBriefing();
      
      // Remove loading, add briefing
      messagesEl.lastElementChild.remove();
      const briefingMsg = `
        <div class="atlas-message-item assistant">
          <div class="atlas-message-avatar">🧠</div>
          <div class="atlas-message-content">
            ${briefing}
          </div>
        </div>
      `;
      messagesEl.insertAdjacentHTML('beforeend', briefingMsg);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    } catch (error) {
      messagesEl.lastElementChild.remove();
      const errorMsg = `
        <div class="atlas-message-item assistant">
          <div class="atlas-message-avatar">🧠</div>
          <div class="atlas-message-content">
            ⚠️ Briefing konnte nicht erstellt werden. Bitte hinterlege einen API-Key in den Einstellungen.
          </div>
        </div>
      `;
      messagesEl.insertAdjacentHTML('beforeend', errorMsg);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  },
  
  // Show Atlas Evening Summary
  async showAtlasEveningSummary() {
    const messagesEl = document.getElementById('atlas-messages');
    if (!messagesEl) return;
    
    // Add loading message
    const loadingMsg = `
      <div class="atlas-message-item assistant">
        <div class="atlas-message-avatar">🧠</div>
        <div class="atlas-message-content">
          <div class="loading">🌙 Erstelle deine Evening Summary...</div>
        </div>
      </div>
    `;
    messagesEl.insertAdjacentHTML('beforeend', loadingMsg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    
    try {
      const summary = await AtlasAI.generateEveningSummary();
      
      // Remove loading, add summary
      messagesEl.lastElementChild.remove();
      const summaryMsg = `
        <div class="atlas-message-item assistant">
          <div class="atlas-message-avatar">🧠</div>
          <div class="atlas-message-content">
            ${summary}
          </div>
        </div>
      `;
      messagesEl.insertAdjacentHTML('beforeend', summaryMsg);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    } catch (error) {
      messagesEl.lastElementChild.remove();
      const errorMsg = `
        <div class="atlas-message-item assistant">
          <div class="atlas-message-avatar">🧠</div>
          <div class="atlas-message-content">
            ⚠️ Summary konnte nicht erstellt werden. Bitte hinterlege einen API-Key in den Einstellungen.
          </div>
        </div>
      `;
      messagesEl.insertAdjacentHTML('beforeend', errorMsg);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  },
  
  // Show Atlas Insights
  async showAtlasInsights() {
    const messagesEl = document.getElementById('atlas-messages');
    if (!messagesEl) return;
    
    // Add loading message
    const loadingMsg = `
      <div class="atlas-message-item assistant">
        <div class="atlas-message-avatar">🧠</div>
        <div class="atlas-message-content">
          <div class="loading">📊 Analysiere deine Produktivitätsmuster...</div>
        </div>
      </div>
    `;
    messagesEl.insertAdjacentHTML('beforeend', loadingMsg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    
    try {
      const insights = await AtlasAI.generateInsights();
      
      // Remove loading, add insights
      messagesEl.lastElementChild.remove();
      const insightsMsg = `
        <div class="atlas-message-item assistant">
          <div class="atlas-message-avatar">🧠</div>
          <div class="atlas-message-content">
            ${insights}
          </div>
        </div>
      `;
      messagesEl.insertAdjacentHTML('beforeend', insightsMsg);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    } catch (error) {
      messagesEl.lastElementChild.remove();
      const errorMsg = `
        <div class="atlas-message-item assistant">
          <div class="atlas-message-avatar">🧠</div>
          <div class="atlas-message-content">
            ⚠️ Insights konnten nicht erstellt werden. Bitte hinterlege einen API-Key in den Einstellungen.
          </div>
        </div>
      `;
      messagesEl.insertAdjacentHTML('beforeend', errorMsg);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  NexusApp.init();
  
  // Initialize all module event listeners once
  console.log('🔧 Setting up module event listeners...');
  if (typeof TasksModule !== 'undefined') { TasksModule.setupEventListeners(); console.log('  ✓ TasksModule'); }
  if (typeof HabitsModule !== 'undefined') { HabitsModule.setupEventListeners(); console.log('  ✓ HabitsModule'); }
  if (typeof ProjectsModule !== 'undefined') { ProjectsModule.setupEventListeners(); console.log('  ✓ ProjectsModule'); }
  if (typeof AnalyticsModule !== 'undefined') { AnalyticsModule.setupEventListeners(); console.log('  ✓ AnalyticsModule'); }
  if (typeof ContactsModule !== 'undefined') { ContactsModule.setupEventListeners(); console.log('  ✓ ContactsModule'); }
  if (typeof InboxModule !== 'undefined') { InboxModule.setupEventListeners(); console.log('  ✓ InboxModule'); }
  if (typeof SettingsModule !== 'undefined') { SettingsModule.setupEventListeners(); console.log('  ✓ SettingsModule'); }
  console.log('✅ All module listeners initialized');
});

// Export
window.NexusApp = NexusApp;
