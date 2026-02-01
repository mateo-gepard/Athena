/* ═══════════════════════════════════════════════════════════════════════════════
   NEXUS ULTRA - UI Utilities
   Common UI functions and helpers
   ═══════════════════════════════════════════════════════════════════════════════ */

const NexusUI = {
  
  // ═══ ICONS (Lucide) ═══
  
  icons: {
    // Navigation
    zap: 'zap',
    checkSquare: 'check-square',
    repeat: 'repeat',
    rocket: 'rocket',
    folder: 'folder',
    calendar: 'calendar',
    brain: 'brain',
    target: 'target',
    barChart: 'bar-chart-2',
    users: 'users',
    settings: 'settings',
    
    // Actions
    plus: 'plus',
    pencil: 'pencil',
    trash: 'trash-2',
    moreHorizontal: 'more-horizontal',
    x: 'x',
    check: 'check',
    clock: 'clock',
    link: 'link',
    paperclip: 'paperclip',
    sparkles: 'sparkles',
    
    // Status
    alertCircle: 'alert-circle',
    checkCircle: 'check-circle',
    circle: 'circle',
    
    // Misc
    chevronDown: 'chevron-down',
    chevronRight: 'chevron-right',
    search: 'search',
    filter: 'filter'
  },
  
  // Create icon element
  icon(name, size = 16) {
    return `<i data-lucide="${name}" style="width: ${size}px; height: ${size}px;"></i>`;
  },
  
  // ═══ DATE/TIME FORMATTING ═══
  
  formatDate(date, options = {}) {
    const d = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (options.relative !== false) {
      if (d.toDateString() === today.toDateString()) return 'Heute';
      if (d.toDateString() === tomorrow.toDateString()) return 'Morgen';
      if (d.toDateString() === yesterday.toDateString()) return 'Gestern';
    }
    
    const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const daysShort = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    const monthsShort = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    
    if (options.format === 'full') {
      return `${days[d.getDay()]}, ${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}`;
    }
    
    if (options.format === 'short') {
      return `${daysShort[d.getDay()]}, ${d.getDate()}. ${monthsShort[d.getMonth()]}`;
    }
    
    return `${d.getDate()}. ${monthsShort[d.getMonth()]}`;
  },
  
  formatTime(time) {
    if (!time) return '';
    if (typeof time === 'string' && time.includes(':')) {
      return time;
    }
    const d = new Date(time);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  },
  
  formatDuration(minutes) {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}min`;
    }
  },
  
  formatRelativeTime(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now - d;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `vor ${days} Tag${days > 1 ? 'en' : ''}`;
    if (hours > 0) return `vor ${hours} Stunde${hours > 1 ? 'n' : ''}`;
    if (minutes > 0) return `vor ${minutes} Minute${minutes > 1 ? 'n' : ''}`;
    return 'gerade eben';
  },
  
  // ═══ SPHERE HELPERS ═══
  
  getSphereColor(sphereId) {
    const colors = {
      geschaeft: '#4A7C94',
      projekte: '#7C6A94',
      schule: '#94854A',
      sport: '#4A946A',
      freizeit: '#6B6862'
    };
    return colors[sphereId] || colors.freizeit;
  },
  
  getSphereIcon(sphereId) {
    const icons = {
      geschaeft: '💼',
      projekte: '🚀',
      schule: '📚',
      sport: '🏃',
      freizeit: '⚪'
    };
    return icons[sphereId] || '⚪';
  },
  
  getSphereName(sphereId) {
    const names = {
      geschaeft: 'Geschäft',
      projekte: 'Projekte',
      schule: 'Schule',
      sport: 'Sport',
      freizeit: 'Freizeit'
    };
    return names[sphereId] || sphereId;
  },
  
  // ═══ PRIORITY HELPERS ═══
  
  getPriorityColor(priority) {
    const colors = {
      critical: 'var(--color-critical)',
      high: 'var(--color-warning)',
      normal: 'var(--color-text-tertiary)',
      low: 'var(--color-text-muted)'
    };
    return colors[priority] || colors.normal;
  },
  
  getPriorityLabel(priority) {
    const labels = {
      critical: 'Kritisch',
      high: 'Hoch',
      normal: 'Normal',
      low: 'Niedrig'
    };
    return labels[priority] || 'Normal';
  },
  
  // ═══ TOAST NOTIFICATIONS ═══
  
  toasts: [],
  
  showToast(messageOrOptions, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    // Support both simple string and options object
    let options;
    if (typeof messageOrOptions === 'string') {
      options = { message: messageOrOptions, type };
    } else {
      options = messageOrOptions;
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${options.type || 'info'}`;
    toast.innerHTML = `
      <div class="toast-icon">
        ${this.icon(options.type === 'success' ? 'check-circle' : options.type === 'error' ? 'alert-circle' : 'info', 20)}
      </div>
      <div class="toast-content">
        ${options.title ? `<div class="toast-title">${options.title}</div>` : ''}
        ${options.message ? `<div class="toast-message">${options.message}</div>` : ''}
      </div>
      <button class="btn-icon toast-close">
        ${this.icon('x', 16)}
      </button>
    `;
    
    container.appendChild(toast);
    lucide.createIcons({ icons: lucide.icons, nameAttr: 'data-lucide' });
    
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => this.removeToast(toast));
    
    // Auto-remove after delay
    const duration = options.duration || 5000;
    setTimeout(() => this.removeToast(toast), duration);
    
    return toast;
  },
  
  removeToast(toast) {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 200);
  },
  
  // ═══ MODAL HELPERS ═══
  
  openModal(title, content, options = {}) {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    if (!overlay || !modal) {
      console.warn('Modal elements not found');
      return;
    }
    
    if (modalTitle) modalTitle.textContent = title;
    if (modalBody) modalBody.innerHTML = content;
    
    if (options.size === 'large') {
      modal.classList.add('large');
    } else {
      modal.classList.remove('large');
    }
    
    overlay.classList.add('active');
    modal.classList.add('open');
    
    // Focus first input if present
    setTimeout(() => {
      const input = modal.querySelector('input, textarea, select');
      if (input) input.focus();
    }, 100);
    
    this.refreshIcons();
  },
  
  closeModal() {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('modal');
    if (overlay) {
      overlay.classList.remove('active');
    }
    if (modal) {
      modal.classList.remove('open');
    }
  },
  
  closeAllModals() {
    this.closeModal();
    document.querySelectorAll('.modal.open').forEach(m => m.classList.remove('open'));
    document.querySelectorAll('.modal-backdrop.open').forEach(b => b.classList.remove('open'));
  },
  
  // ═══ DROPDOWN HELPERS ═══
  
  toggleDropdown(dropdownElement) {
    const isOpen = dropdownElement.classList.contains('open');
    this.closeAllDropdowns();
    if (!isOpen) {
      dropdownElement.classList.add('open');
    }
  },
  
  closeAllDropdowns() {
    document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
  },
  
  // ═══ RENDER HELPERS ═══
  
  // Render Task Card
  renderTaskCard(task, options = {}) {
    const project = task.projectId ? NexusStore.getProjectById(task.projectId) : null;
    const sphereColor = this.getSphereColor(task.spheres[0]);
    const isCompleted = task.status === 'completed';
    const isOverdue = !isCompleted && task.deadline && new Date(task.deadline) < new Date();
    
    let metaItems = [];
    if (project) metaItems.push(`@${project.name}`);
    if (task.scheduledTime && !options.hideTime) metaItems.push(task.scheduledTime);
    if (task.deadline && isOverdue) {
      const daysOverdue = Math.ceil((new Date() - new Date(task.deadline)) / (1000 * 60 * 60 * 24));
      metaItems.push(`<span class="overdue-text">${daysOverdue} Tag${daysOverdue > 1 ? 'e' : ''} überfällig</span>`);
    }
    
    return `
      <div class="task-card ${isCompleted ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}" 
           style="--sphere-color: ${sphereColor}"
           data-task-id="${task.id}">
        <div class="task-checkbox ${isCompleted ? 'checked' : ''}" data-action="toggle-task"></div>
        <div class="task-content">
          <div class="task-title">${task.title}</div>
          ${metaItems.length > 0 ? `
            <div class="task-meta">
              ${metaItems.map((item, i) => `
                ${i > 0 ? '<span class="task-meta-separator">·</span>' : ''}
                <span>${item}</span>
              `).join('')}
            </div>
          ` : ''}
        </div>
        ${task.timeEstimate ? `
          <div class="task-time">
            <span class="mono">${this.formatDuration(task.timeEstimate)}</span>
          </div>
        ` : ''}
        <div class="task-actions">
          <button class="btn-icon" data-action="edit-task" data-tooltip="Bearbeiten">
            ${this.icon('pencil')}
          </button>
          <button class="btn-icon" data-action="schedule-task" data-tooltip="Planen">
            ${this.icon('clock')}
          </button>
          <button class="btn-icon" data-action="more-task" data-tooltip="Mehr">
            ${this.icon('more-horizontal')}
          </button>
        </div>
      </div>
    `;
  },
  
  // Render Habit Card
  renderHabitCard(habit, options = {}) {
    const isCompleted = NexusStore.isHabitCompletedToday(habit.id);
    const sphereColor = this.getSphereColor(habit.spheres[0]);
    
    return `
      <div class="habit-card" data-habit-id="${habit.id}" style="--sphere-color: ${sphereColor}">
        <div class="habit-icon">${habit.icon}</div>
        <div class="habit-info">
          <div class="habit-name">${habit.name}</div>
          <div class="habit-streak">
            <span>Streak: ${habit.streak}</span>
            ${habit.streak > 0 ? '<span class="streak-fire"><i data-lucide="flame"></i></span>' : ''}
          </div>
        </div>
        <div class="task-checkbox ${isCompleted ? 'checked' : ''}" data-action="toggle-habit"></div>
      </div>
    `;
  },
  
  // Render Sphere Tags
  renderSphereTags(sphereIds) {
    return sphereIds.map(id => `
      <span class="sphere-tag" style="--sphere-color: ${this.getSphereColor(id)}">
        <span class="sphere-dot"></span>
        ${this.getSphereName(id)}
      </span>
    `).join('');
  },
  
  // Render Progress Bar
  renderProgress(percent, options = {}) {
    const value = typeof percent === 'number' && !isNaN(percent) ? percent : 0;
    const barClass = value >= 75 ? 'success' : value >= 50 ? '' : 'warning';
    
    if (options.labeled) {
      return `
        <div class="progress-labeled">
          <div class="progress">
            <div class="progress-bar ${barClass}" style="width: ${value}%"></div>
          </div>
          <span class="progress-label">${Math.round(value)}%</span>
        </div>
      `;
    }
    
    return `
      <div class="progress">
        <div class="progress-bar ${barClass}" style="width: ${value}%"></div>
      </div>
    `;
  },
  
  // Render Empty State
  renderEmptyState(icon, title, description) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">${this.icon(icon, 48)}</div>
        <h3 class="empty-state-title">${title}</h3>
        <p class="empty-state-description">${description}</p>
      </div>
    `;
  },
  
  // ═══ CAPTURE OVERLAY ═══
  
  openCapture() {
    const overlay = document.getElementById('captureOverlay');
    const input = document.getElementById('captureInput');
    
    if (overlay) {
      overlay.classList.add('open');
      if (input) {
        input.value = '';
        input.focus();
      }
    }
  },
  
  closeCapture() {
    const overlay = document.getElementById('captureOverlay');
    if (overlay) {
      overlay.classList.remove('open');
    }
  },
  
  // ═══ PAGE NAVIGATION ═══
  
  navigateTo(pageId) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === pageId);
    });
    
    // Update page views
    document.querySelectorAll('.page-view').forEach(view => {
      view.classList.toggle('active', view.id === `page-${pageId}`);
    });
    
    // Update page title
    const titles = {
      'command-center': 'Command Center',
      'tasks': 'Tasks',
      'habits': 'Habits',
      'venture-cockpit': 'Venture Cockpit',
      'projects': 'Projekte',
      'calendar': 'Kalender',
      'temporal-engine': 'Kalender',
      'mind-canvas': 'Mind Canvas',
      'horizon': 'Horizon',
      'horizon-tracker': 'Horizon Tracker',
      'analytics': 'Analytics',
      'contacts': 'Kontakte',
      'inbox': 'Inbox',
      'settings': 'Einstellungen'
    };
    
    const titleEl = document.querySelector('.page-title');
    if (titleEl) titleEl.textContent = titles[pageId] || pageId;
    
    // Update store
    NexusStore.state.currentPage = pageId;
    
    // Trigger page-specific initialization
    window.dispatchEvent(new CustomEvent('nexus:navigate', { detail: { page: pageId } }));
  },
  
  // Initialize Lucide icons
  refreshIcons() {
    if (window.lucide) {
      lucide.createIcons({ icons: lucide.icons, nameAttr: 'data-lucide' });
    }
  },
  
  // Show Project Suggestion Modal - for smart project detection
  showProjectSuggestion(suggestedName, relatedTasks, sphere, callback) {
    const taskList = relatedTasks.map(t => `
      <div class="suggestion-task-item">
        <span class="task-check">✓</span>
        <span class="task-title">${t.title}</span>
      </div>
    `).join('');
    
    const sphereLabel = {
      'geschaeft': 'Geschäft',
      'projekte': 'Projekte', 
      'schule': 'Schule',
      'sport': 'Sport',
      'freizeit': 'Freizeit'
    }[sphere] || sphere;
    
    const content = `
      <div class="project-suggestion-modal">
        <div class="suggestion-header">
          <div class="suggestion-icon">💡</div>
          <h3>Projekt-Vorschlag</h3>
          <p>Atlas hat ${relatedTasks.length} verwandte Tasks erkannt. Möchtest du ein Projekt erstellen?</p>
        </div>
        
        <div class="suggestion-form">
          <div class="form-group">
            <label>Projektname</label>
            <input type="text" id="suggestion-project-name" value="${suggestedName}" class="form-control">
          </div>
          
          <div class="form-group">
            <label>Sphäre: ${sphereLabel}</label>
          </div>
          
          <div class="suggestion-tasks">
            <label>Tasks die hinzugefügt werden:</label>
            <div class="suggestion-task-list">
              ${taskList}
            </div>
          </div>
        </div>
        
        <div class="suggestion-actions">
          <button type="button" class="btn btn-secondary" id="suggestion-cancel">
            Nicht jetzt
          </button>
          <button type="button" class="btn btn-primary" id="suggestion-accept">
            <i data-lucide="folder-plus"></i>
            Projekt erstellen
          </button>
        </div>
      </div>
    `;
    
    this.showModal('Smarte Projekt-Erkennung', content);
    
    // Setup event listeners
    setTimeout(() => {
      const acceptBtn = document.getElementById('suggestion-accept');
      const cancelBtn = document.getElementById('suggestion-cancel');
      const nameInput = document.getElementById('suggestion-project-name');
      
      if (acceptBtn) {
        acceptBtn.addEventListener('click', () => {
          const customName = nameInput?.value?.trim() || suggestedName;
          this.closeModal();
          callback(true, customName);
        });
      }
      
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          this.closeModal();
          callback(false);
        });
      }
      
      this.refreshIcons();
    }, 100);
  }
};

// Export
window.NexusUI = NexusUI;
