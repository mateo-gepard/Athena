/* ═══════════════════════════════════════════════════════════════════════════════
   NEXUS ULTRA - Venture Cockpit Module
   Das ultimative Werkzeug für komplexe, langfristige Projekte
   ═══════════════════════════════════════════════════════════════════════════════ */

const VentureCockpit = {
  
  currentVenture: null,
  currentTab: 'overview',
  
  // Initialize
  init() {
    this.render();
    this.setupEventListeners();
  },
  
  // Render the venture cockpit
  render() {
    const container = document.getElementById('page-venture-cockpit');
    if (!container) return;
    
    const ventures = NexusStore.getVentures();
    const activeVentures = ventures.filter(v => v.status === 'active');
    
    if (ventures.length === 0) {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center p-8 text-center" style="min-height: 400px;">
          <div class="text-6xl mb-4">🚀</div>
          <h2 class="text-xl font-medium mb-2">Keine Ventures</h2>
          <p class="text-secondary mb-6">Starte dein erstes Venture-Projekt!</p>
          <button class="btn btn-primary" id="add-venture-btn-empty">
            ${NexusUI.icon('plus', 16)}
            Neues Venture erstellen
          </button>
        </div>
      `;
      NexusUI.refreshIcons();
      return;
    }
    
    // If no venture selected, show first active one
    if (!this.currentVenture && activeVentures.length > 0) {
      this.currentVenture = activeVentures[0];
    }
    
    if (!this.currentVenture) {
      this.currentVenture = ventures[0];
    }
    
    container.innerHTML = this.renderVentureDashboard(this.currentVenture);
    NexusUI.refreshIcons();
  },
  
  // Render full venture dashboard
  renderVentureDashboard(venture) {
    const ventures = NexusStore.getVentures();
    const project = NexusStore.getProjects().find(p => 
      p.name.toLowerCase().includes(venture.name.toLowerCase().split(' ')[0])
    );
    const tasks = project ? NexusStore.getTasks().filter(t => t.projectId === project.id) : [];
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const progress = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
    
    return `
      <!-- Venture Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-4">
          <div class="flex items-center justify-center w-12 h-12 rounded-lg" 
               style="background: linear-gradient(135deg, var(--color-sphere-geschaeft), var(--color-sphere-projekte))">
            <span style="font-size: 24px">🚀</span>
          </div>
          <div>
            ${ventures.length > 1 ? `
              <select class="input" id="venture-selector" style="font-size: 18px; font-weight: 500; padding: 4px 8px; margin-bottom: 4px;">
                ${ventures.map(v => `
                  <option value="${v.id}" ${v.id === venture.id ? 'selected' : ''}>${v.name}</option>
                `).join('')}
              </select>
            ` : `
              <h2 class="text-xl font-medium">${venture.name}</h2>
            `}
            <p class="text-secondary text-sm">${venture.description}</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="badge badge-success">🟢 AKTIV</span>
          <button class="btn btn-primary" id="add-venture-btn">
            ${NexusUI.icon('plus', 16)}
            Neues Venture
          </button>
          <button class="btn btn-secondary" id="venture-settings-btn">
            ${NexusUI.icon('settings', 16)}
            Settings
          </button>
        </div>
      </div>
      
      <!-- Tabs -->
      <div class="tabs mb-6">
        <button class="tab ${this.currentTab === 'overview' ? 'active' : ''}" data-tab="overview">Übersicht</button>
        <button class="tab ${this.currentTab === 'roadmap' ? 'active' : ''}" data-tab="roadmap">Roadmap</button>
        <button class="tab ${this.currentTab === 'tasks' ? 'active' : ''}" data-tab="tasks">Tasks</button>
        <button class="tab ${this.currentTab === 'evaluation' ? 'active' : ''}" data-tab="evaluation">Evaluation</button>
        <button class="tab ${this.currentTab === 'team' ? 'active' : ''}" data-tab="team">Team</button>
        <button class="tab ${this.currentTab === 'mind-space' ? 'active' : ''}" data-tab="mind-space">Mind Space</button>
        <button class="tab ${this.currentTab === 'analytics' ? 'active' : ''}" data-tab="analytics">Analytics</button>
      </div>
      
      <!-- Tab Content -->
      <div id="venture-tab-content">
        ${this.renderTabContent(venture, project, tasks, progress)}
      </div>
    `;
  },
  
  // Render content for active tab
  renderTabContent(venture, project, tasks, progress) {
    switch (this.currentTab) {
      case 'overview':
        return this.renderOverviewTab(venture, project, tasks, progress);
      case 'roadmap':
        return this.renderRoadmapTab(venture);
      case 'tasks':
        return this.renderTasksTab(tasks);
      case 'evaluation':
        return this.renderEvaluationTab(venture);
      case 'team':
        return this.renderTeamTab(venture);
      case 'mind-space':
        return this.renderMindSpaceTab(venture);
      case 'analytics':
        return this.renderAnalyticsTab(venture);
      default:
        return this.renderOverviewTab(venture, project, tasks, progress);
    }
  },
  
  // Switch to a different tab
  switchTab(tabName) {
    this.currentTab = tabName;
    this.render();
  },
  
  // Render Overview Tab (original dashboard content)
  renderOverviewTab(venture, project, tasks, progress) {
    return `
      <!-- Scorecard -->
      <div class="panel mb-6">
        <div class="panel-header">
          <span class="panel-title">Scorecard</span>
          <div class="flex items-center gap-2">
            ${NexusUI.renderSphereTags(venture.spheres)}
          </div>
        </div>
        <div class="panel-body">
          <div class="grid" style="grid-template-columns: repeat(4, 1fr); gap: var(--space-4);">
            <div class="stat-card">
              <div class="stat-label">📊 ROI Score</div>
              <div class="stat-value">${venture.roiProjection?.score || '-'}/10</div>
              <div class="stat-sublabel">Expected: ${venture.roiProjection?.expected || '-'}x</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">⏱️ Effort Invested</div>
              <div class="stat-value">${venture.effortInvested || 0}h</div>
              <div class="stat-sublabel">Remaining: ~${venture.effortRemaining || '?'}h</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">🎯 Best Case</div>
              <div class="stat-value text-success" style="font-size: 14px;">${venture.bestCase || '-'}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">⚠️ Worst Case</div>
              <div class="stat-value text-critical" style="font-size: 14px;">${venture.worstCase || '-'}</div>
            </div>
          </div>
          
          <div class="mt-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-secondary">Erfolgswahrscheinlichkeit</span>
              <span class="mono text-sm">${progress}%</span>
            </div>
            ${NexusUI.renderProgress(progress)}
          </div>
        </div>
      </div>
      
      <!-- Two Column Layout -->
      <div class="layout-two-col">
        <div class="layout-two-col-main">
          
          <!-- Roadmap Timeline -->
          <div class="panel mb-6">
            <div class="panel-header">
              <span class="panel-title">Roadmap Timeline</span>
              <div class="tabs-pills" style="border: none;">
                <button class="tab active">Timeline</button>
                <button class="tab">Gantt</button>
                <button class="tab">Kanban</button>
              </div>
            </div>
            <div class="panel-body">
              ${this.renderRoadmap(venture)}
            </div>
          </div>
          
          <!-- Current Tasks -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Current Tasks</span>
              <button class="btn btn-sm" id="add-venture-task-btn">+ Task</button>
            </div>
            <div class="panel-body">
              ${this.renderVentureTasks(tasks)}
            </div>
          </div>
          
        </div>
        
        <div class="layout-two-col-aside">
          
          <!-- Risk & Barriers -->
          <div class="panel mb-6">
            <div class="panel-header">
              <span class="panel-title">🚧 Blockers</span>
            </div>
            <div class="panel-body">
              ${this.renderBlockers(venture)}
            </div>
          </div>
          
          <!-- Key Contacts -->
          <div class="panel mb-6">
            <div class="panel-header">
              <span class="panel-title">👥 Key Contacts</span>
            </div>
            <div class="panel-body">
              ${this.renderContacts(venture)}
            </div>
          </div>
          
          <!-- Linked Mind Space -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">💭 Mind Space</span>
            </div>
            <div class="panel-body">
              ${this.renderMindSpaceLinks(venture)}
            </div>
          </div>
          
        </div>
      </div>
    `;
  },
  
  // Render Roadmap Tab
  renderRoadmapTab(venture) {
    return `
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Roadmap Timeline</span>
          <button class="btn btn-sm" id="add-venture-phase-btn">+ Phase</button>
        </div>
        <div class="panel-body">
          ${this.renderRoadmap(venture)}
        </div>
      </div>
    `;
  },
  
  // Render Tasks Tab
  renderTasksTab(tasks) {
    return `
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Alle Tasks</span>
          <button class="btn btn-sm" id="add-venture-task-btn">+ Task</button>
        </div>
        <div class="panel-body">
          ${this.renderVentureTasks(tasks)}
        </div>
      </div>
    `;
  },
  
  // Render Evaluation Tab
  renderEvaluationTab(venture) {
    return `
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">ROI & Evaluation</span>
        </div>
        <div class="panel-body">
          <div class="grid" style="grid-template-columns: repeat(3, 1fr); gap: var(--space-4);">
            <div class="stat-card">
              <div class="stat-label">📊 ROI Score</div>
              <div class="stat-value">${venture.evaluation?.roiScore || venture.roiProjection?.score || '-'}/10</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">⏱️ Time Invested</div>
              <div class="stat-value">${venture.effortInvested || 0}h</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">📈 Expected Return</div>
              <div class="stat-value">${venture.evaluation?.expectedReturn || venture.roiProjection?.expected || '-'}</div>
            </div>
          </div>
          <div class="mt-6">
            <h4 class="text-sm font-medium mb-3">Best & Worst Case</h4>
            <div class="p-4 mb-3 rounded-md bg-success/10 border-l-3" style="border-left-color: var(--color-success)">
              <div class="text-sm font-medium text-success">🎯 Best Case</div>
              <div class="text-sm mt-1">${venture.bestCase || 'Nicht definiert'}</div>
            </div>
            <div class="p-4 rounded-md bg-critical/10 border-l-3" style="border-left-color: var(--color-critical)">
              <div class="text-sm font-medium text-critical">⚠️ Worst Case</div>
              <div class="text-sm mt-1">${venture.worstCase || 'Nicht definiert'}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  },
  
  // Render Team Tab
  renderTeamTab(venture) {
    return `
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Team & Kontakte</span>
          <button class="btn btn-sm" id="add-venture-contact-btn-2">+ Kontakt</button>
        </div>
        <div class="panel-body">
          ${this.renderContacts(venture)}
        </div>
      </div>
    `;
  },
  
  // Render Mind Space Tab
  renderMindSpaceTab(venture) {
    return `
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">💭 Mind Space</span>
          <button class="btn btn-sm" id="add-venture-note-btn">+ Note</button>
        </div>
        <div class="panel-body">
          ${this.renderMindSpaceLinks(venture)}
        </div>
      </div>
    `;
  },
  
  // Render Analytics Tab
  renderAnalyticsTab(venture) {
    return `
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">📊 Analytics</span>
        </div>
        <div class="panel-body">
          <div class="text-center p-8 text-secondary">
            <div class="text-6xl mb-4">📈</div>
            <p>Analytics Dashboard coming soon...</p>
            <p class="text-sm mt-2">Track progress, velocity, and insights</p>
          </div>
        </div>
      </div>
    `;
  },
  
  // Render roadmap timeline
  renderRoadmap(venture) {
    // Get phases from venture.roadmap or show empty state
    const phases = venture.roadmap || [];
    
    if (phases.length === 0) {
      return `
        <div class="text-center p-6 text-secondary">
          <p>Keine Phasen definiert.</p>
          <button class="btn btn-primary btn-sm mt-3" id="add-venture-phase-btn">+ Phase hinzufügen</button>
        </div>
      `;
    }
    
    return `
      <div class="flex items-center gap-4 mb-6">
        ${phases.map((phase, i) => {
          const progress = typeof phase.progress === 'number' ? phase.progress : 0;
          return `
          <div class="flex-1">
            <div class="text-xs text-tertiary mb-1">Phase ${i + 1}</div>
            <div class="p-3 rounded-md ${phase.status === 'active' ? 'bg-surface-2 border border-border-hover' : 'bg-surface-1'}">
              <div class="text-sm font-medium mb-2">${phase.name}</div>
              ${NexusUI.renderProgress(progress, { labeled: true })}
              <div class="text-xs text-tertiary mt-1">
                ${phase.status === 'completed' ? '✓ Abgeschlossen' : 
                  phase.status === 'active' ? '🔄 In Progress' : '○ Ausstehend'}
              </div>
            </div>
          </div>
        `}).join('')}
      </div>
      
      <div class="atlas-panel">
        <div class="atlas-header">
          <div class="atlas-icon">🏁</div>
          <span class="atlas-title">Nächster Milestone</span>
        </div>
        <div class="atlas-body">
          ${venture.nextMilestone ? `
            <div class="flex items-center justify-between">
              <span class="text-secondary">${venture.nextMilestone.title} - Fällig: ${venture.nextMilestone.dueDate || 'TBD'}</span>
            </div>
          ` : `
            <div class="text-secondary text-center">Kein Milestone definiert</div>
          `}
        </div>
      </div>
    `;
  },
  
  // Render venture tasks
  renderVentureTasks(tasks) {
    const pendingTasks = tasks.filter(t => t.status !== 'completed');
    const criticalTasks = pendingTasks.filter(t => t.priority === 'critical');
    const highTasks = pendingTasks.filter(t => t.priority === 'high');
    const normalTasks = pendingTasks.filter(t => t.priority === 'normal' || t.priority === 'low');
    
    if (pendingTasks.length === 0) {
      return '<div class="text-center text-tertiary p-4">Alle Tasks erledigt! 🎉</div>';
    }
    
    let html = '';
    
    if (criticalTasks.length > 0) {
      html += `
        <div class="mb-4">
          <div class="text-caption text-critical mb-2">🔴 KRITISCH</div>
          <div class="content-stack gap-2">
            ${criticalTasks.map(t => NexusUI.renderTaskCard(t, { hideTime: true })).join('')}
          </div>
        </div>
      `;
    }
    
    if (highTasks.length > 0) {
      html += `
        <div class="mb-4">
          <div class="text-caption text-warning mb-2">🟡 DIESE WOCHE</div>
          <div class="content-stack gap-2">
            ${highTasks.slice(0, 3).map(t => NexusUI.renderTaskCard(t, { hideTime: true })).join('')}
          </div>
        </div>
      `;
    }
    
    html += `
      <div class="text-secondary text-sm mt-4">
        🟢 BACKLOG: ${normalTasks.length} Tasks
        <button class="btn-ghost" id="show-venture-backlog-btn">Alle anzeigen →</button>
      </div>
    `;
    
    return html;
  },
  
  // Render blockers
  renderBlockers(venture) {
    // Get barriers from venture (support both barriers and blockers for backwards compatibility)
    const barriers = venture.barriers || venture.blockers || [];
    
    if (barriers.length === 0) {
      return '<div class="text-center text-success p-4">✓ Keine Blocker</div>';
    }
    
    return barriers.map(b => `
      <div class="p-3 mb-3 rounded-md bg-surface-1 border-l-3" 
           style="border-left: 3px solid ${b.severity === 'high' || b.severity === 'critical' ? 'var(--color-critical)' : b.severity === 'medium' ? 'var(--color-warning)' : 'var(--color-info)'}">
        <div class="flex items-center gap-2 mb-1">
          <span class="${b.severity === 'high' || b.severity === 'critical' ? 'text-critical' : b.severity === 'medium' ? 'text-warning' : 'text-info'}">
            ${b.severity === 'high' || b.severity === 'critical' ? '🔴' : b.severity === 'medium' ? '🟡' : '🔵'}
          </span>
          <span class="font-medium">${b.description}</span>
        </div>
        ${b.impact ? `<div class="text-sm text-secondary mb-1">Impact: ${b.impact}</div>` : ''}
        ${b.suggestion || b.suggestedAction ? `<div class="text-sm text-tertiary">💡 ${b.suggestion || b.suggestedAction}</div>` : ''}
      </div>
    `).join('');
  },
  
  // Render contacts
  renderContacts(venture) {
    const contacts = NexusStore.getContacts().slice(0, 3);
    
    if (contacts.length === 0) {
      return `
        <div class="text-center text-tertiary p-4">
          Keine Kontakte verknüpft
          <button class="btn btn-sm mt-2" id="add-venture-contact-btn">+ Kontakt hinzufügen</button>
        </div>
      `;
    }
    
    return `
      ${contacts.map(c => `
        <div class="flex items-center gap-3 p-2 rounded-md hover:bg-surface-2 cursor-pointer mb-2">
          <div class="avatar">${c.name.charAt(0)}</div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium truncate">${c.name}</div>
            <div class="text-xs text-tertiary">${c.role}</div>
          </div>
        </div>
      `).join('')}
      <button class="btn-ghost text-sm mt-2" id="add-venture-contact-btn-2">+ Kontakt hinzufügen</button>
    `;
  },
  
  // Render mind space links
  renderMindSpaceLinks(venture) {
    const notes = NexusStore.getNotes().slice(0, 3);
    
    if (notes.length === 0) {
      return `
        <div class="text-center text-tertiary p-4">
          Keine Notizen verknüpft
          <button class="btn btn-sm mt-2" id="add-venture-note-btn">+ Neue Notiz</button>
        </div>
      `;
    }
    
    return `
      ${notes.map(n => `
        <div class="flex items-center gap-3 p-2 rounded-md hover:bg-surface-2 cursor-pointer mb-2">
          <span>💭</span>
          <span class="text-sm truncate">"${n.content.substring(0, 30)}..."</span>
          <span class="text-tertiary text-xs ml-auto">Öffnen →</span>
        </div>
      `).join('')}
      <div class="text-xs text-tertiary mt-2">
        📎 ${notes.length} Notizen │ ${notes.filter(n => n.type === 'idea').length} Ideen
      </div>
      <button class="btn-ghost text-sm mt-2" id="open-venture-canvas-btn">Canvas öffnen →</button>
    `;
  },
  
  // Setup event listeners
  setupEventListeners() {
    // Venture selector change
    document.addEventListener('change', (e) => {
      if (e.target.id === 'venture-selector') {
        const ventureId = e.target.value;
        const venture = NexusStore.getVentureById(ventureId);
        if (venture) {
          this.currentVenture = venture;
          this.render();
        }
      }
    });
    
    // Tab switching
    document.addEventListener('click', (e) => {
      // Handle tab clicks
      const tabElement = e.target.closest('.tab[data-tab]');
      if (tabElement) {
        const tabName = tabElement.dataset.tab;
        
        // Update active class
        const container = tabElement.closest('.tabs, .tabs-pills');
        if (container) {
          container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
          tabElement.classList.add('active');
        }
        
        // Switch tab content
        this.switchTab(tabName);
        return;
      }
      
      // Add venture buttons
      if (e.target.closest('#add-venture-btn') || e.target.closest('#add-venture-btn-empty')) {
        this.showAddVentureModal();
        return;
      }
      
      // Create venture button in modal
      if (e.target.id === 'create-venture-btn') {
        this.createVenture();
        return;
      }
      
      // Venture settings
      if (e.target.closest('#venture-settings-btn')) {
        this.showVentureSettings();
        return;
      }
      
      // Add task to venture
      if (e.target.closest('#add-venture-task-btn')) {
        this.showAddTaskModal();
        return;
      }
      
      // Add phase
      if (e.target.closest('#add-venture-phase-btn')) {
        this.showAddPhaseModal();
        return;
      }
      
      // Show backlog
      if (e.target.closest('#show-venture-backlog-btn')) {
        this.showBacklog();
        return;
      }
      
      // Add contact
      if (e.target.closest('#add-venture-contact-btn') || e.target.closest('#add-venture-contact-btn-2')) {
        this.showAddContactModal();
        return;
      }
      
      // Add note
      if (e.target.closest('#add-venture-note-btn')) {
        this.showAddNoteModal();
        return;
      }
      
      // Open canvas
      if (e.target.closest('#open-venture-canvas-btn')) {
        this.openCanvas();
        return;
      }
    });
  },
  
  // Show add venture modal
  showAddVentureModal() {
    const modalContent = `
      <div class="p-4">
        <h3 class="text-xl font-medium mb-4">🚀 Neues Venture erstellen</h3>
        
        <div class="grid gap-4">
          <div>
            <label class="input-label">Name *</label>
            <input type="text" class="input" id="new-venture-name" placeholder="z.B. SaaS Startup, E-Commerce Shop">
          </div>
          
          <div>
            <label class="input-label">Beschreibung</label>
            <textarea class="input" id="new-venture-description" rows="3" placeholder="Was ist das Ziel dieses Ventures?"></textarea>
          </div>
          
          <div class="grid gap-4" style="grid-template-columns: 1fr 1fr;">
            <div>
              <label class="input-label">Best Case Szenario</label>
              <textarea class="input" id="new-venture-best-case" rows="2" placeholder="Was ist der beste Ausgang?"></textarea>
            </div>
            
            <div>
              <label class="input-label">Worst Case Szenario</label>
              <textarea class="input" id="new-venture-worst-case" rows="2" placeholder="Was ist der schlechteste Ausgang?"></textarea>
            </div>
          </div>
          
          <div>
            <label class="input-label">Sphären</label>
            <div class="flex gap-2 flex-wrap">
              <label class="flex items-center gap-2">
                <input type="checkbox" value="geschaeft" checked id="venture-sphere-geschaeft">
                <span>💼 Geschäft</span>
              </label>
              <label class="flex items-center gap-2">
                <input type="checkbox" value="projekte" checked id="venture-sphere-projekte">
                <span>📁 Projekte</span>
              </label>
            </div>
          </div>
        </div>
        
        <div class="flex gap-3 mt-6">
          <button class="btn btn-primary flex-1" id="create-venture-btn">
            ${NexusUI.icon('check', 16)}
            Venture erstellen
          </button>
          <button class="btn btn-secondary" onclick="NexusUI.closeModal()">
            Abbrechen
          </button>
        </div>
      </div>
    `;
    
    NexusUI.openModal('🚀 Neues Venture', modalContent);
  },
  
  // Create venture
  createVenture() {
    const name = document.getElementById('new-venture-name')?.value;
    if (!name) {
      NexusUI.showToast('Name ist erforderlich', 'error');
      return;
    }
    
    const spheres = [];
    if (document.getElementById('venture-sphere-geschaeft')?.checked) spheres.push('geschaeft');
    if (document.getElementById('venture-sphere-projekte')?.checked) spheres.push('projekte');
    
    const venture = {
      name,
      description: document.getElementById('new-venture-description')?.value || '',
      bestCase: document.getElementById('new-venture-best-case')?.value || '',
      worstCase: document.getElementById('new-venture-worst-case')?.value || '',
      spheres: spheres.length > 0 ? spheres : ['geschaeft', 'projekte'],
      status: 'active'
    };
    
    const newVenture = NexusStore.addVenture(venture);
    this.currentVenture = newVenture;
    
    NexusUI.closeModal();
    NexusUI.showToast('Venture erstellt! 🚀', 'success');
    this.render();
  },
  
  // Show venture settings
  showVentureSettings() {
    NexusUI.showToast('Venture Settings - Coming Soon', 'info');
  },
  
  // Show add task modal for venture
  showAddTaskModal() {
    if (!this.currentVenture) return;
    
    // Find or create project for this venture
    const projects = NexusStore.getProjects();
    let project = projects.find(p => 
      p.name.toLowerCase().includes(this.currentVenture.name.toLowerCase().split(' ')[0])
    );
    
    if (!project) {
      // Create a project for this venture
      project = NexusStore.addProject({
        name: this.currentVenture.name,
        description: this.currentVenture.description,
        icon: '🚀'
      });
    }
    
    // Navigate to tasks and open add task modal with project pre-selected
    if (typeof NexusApp !== 'undefined') {
      NexusApp.navigateTo('tasks');
      setTimeout(() => {
        if (typeof TasksModule !== 'undefined') {
          TasksModule.showAddTaskModal();
          // Pre-select the project
          setTimeout(() => {
            const projectSelect = document.getElementById('new-task-project');
            if (projectSelect) {
              projectSelect.value = project.id;
            }
          }, 100);
        }
      }, 100);
    }
  },
  
  // Show add phase modal
  showAddPhaseModal() {
    NexusUI.showToast('Roadmap Phasen - Coming Soon', 'info');
  },
  
  // Show venture backlog
  showBacklog() {
    if (!this.currentVenture) return;
    
    // Navigate to tasks filtered by venture project
    const projects = NexusStore.getProjects();
    const project = projects.find(p => 
      p.name.toLowerCase().includes(this.currentVenture.name.toLowerCase().split(' ')[0])
    );
    
    if (typeof NexusApp !== 'undefined') {
      NexusApp.navigateTo('tasks');
      if (project && typeof TasksModule !== 'undefined') {
        setTimeout(() => {
          TasksModule.filter = 'pending';
          TasksModule.render();
        }, 100);
      }
    }
  },
  
  // Show add contact modal
  showAddContactModal() {
    if (typeof NexusApp !== 'undefined') {
      NexusApp.navigateTo('contacts');
      setTimeout(() => {
        if (typeof ContactsModule !== 'undefined') {
          ContactsModule.showAddContactModal();
        }
      }, 100);
    }
  },
  
  // Show add note modal
  showAddNoteModal() {
    NexusUI.showToast('Venture Notizen - Coming Soon', 'info');
  },
  
  // Open mind canvas
  openCanvas() {
    if (typeof NexusApp !== 'undefined') {
      NexusApp.navigateTo('mind-canvas');
    }
  }
};

// Initialize on navigation
window.addEventListener('nexus:navigate', (e) => {
  if (e.detail.page === 'venture-cockpit') {
    VentureCockpit.init();
  }
});

// Export
window.VentureCockpit = VentureCockpit;
