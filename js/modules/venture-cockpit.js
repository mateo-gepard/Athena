/* ═══════════════════════════════════════════════════════════════════════════════
   NEXUS ULTRA - Venture Cockpit Module
   Das ultimative Werkzeug für komplexe, langfristige Projekte
   ═══════════════════════════════════════════════════════════════════════════════ */

const VentureCockpit = {
  
  currentVenture: null,
  
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
      container.innerHTML = NexusUI.renderEmptyState(
        'rocket',
        'Keine Ventures',
        'Starte dein erstes Venture-Projekt!'
      );
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
            <h2 class="text-xl font-medium">${venture.name}</h2>
            <p class="text-secondary text-sm">${venture.description}</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="badge badge-success">🟢 AKTIV</span>
          <button class="btn btn-secondary">
            ${NexusUI.icon('settings', 16)}
            Settings
          </button>
        </div>
      </div>
      
      <!-- Tabs -->
      <div class="tabs mb-6">
        <button class="tab active" data-tab="overview">Übersicht</button>
        <button class="tab" data-tab="roadmap">Roadmap</button>
        <button class="tab" data-tab="tasks">Tasks</button>
        <button class="tab" data-tab="evaluation">Evaluation</button>
        <button class="tab" data-tab="team">Team</button>
        <button class="tab" data-tab="mind-space">Mind Space</button>
        <button class="tab" data-tab="analytics">Analytics</button>
      </div>
      
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
              <button class="btn btn-sm">+ Task</button>
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
  
  // Render roadmap timeline
  renderRoadmap(venture) {
    // Demo phases
    const phases = [
      { name: 'Phase 1: Validation', status: 'completed', progress: 100 },
      { name: 'Phase 2: Build', status: 'active', progress: 78 },
      { name: 'Phase 3: Launch', status: 'pending', progress: 0 },
      { name: 'Phase 4: Scale', status: 'pending', progress: 0 }
    ];
    
    return `
      <div class="flex items-center gap-4 mb-6">
        ${phases.map((phase, i) => `
          <div class="flex-1">
            <div class="text-xs text-tertiary mb-1">Q${i + 1} 2024</div>
            <div class="p-3 rounded-md ${phase.status === 'active' ? 'bg-surface-2 border border-border-hover' : 'bg-surface-1'}">
              <div class="text-sm font-medium mb-2">${phase.name}</div>
              ${NexusUI.renderProgress(phase.progress, { labeled: true })}
              <div class="text-xs text-tertiary mt-1">
                ${phase.status === 'completed' ? '✓ Abgeschlossen' : 
                  phase.status === 'active' ? '🔄 In Progress' : '○ Ausstehend'}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      
      <div class="atlas-panel">
        <div class="atlas-header">
          <div class="atlas-icon">🏁</div>
          <span class="atlas-title">Nächster Milestone: MVP Launch</span>
        </div>
        <div class="atlas-body">
          <div class="flex items-center justify-between">
            <span class="text-secondary">Fällig: 15.06.2024</span>
            <span class="badge badge-warning">⚠️ 12 Tage!</span>
          </div>
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
        <button class="btn-ghost">Alle anzeigen →</button>
      </div>
    `;
    
    return html;
  },
  
  // Render blockers
  renderBlockers(venture) {
    // Demo blockers
    const blockers = [
      {
        severity: 'high',
        description: 'Backend-Dev krank',
        impact: '3 Tasks blockiert',
        suggestion: '@Max kontaktieren'
      },
      {
        severity: 'medium',
        description: 'Payment Provider Entscheidung offen',
        impact: 'Phase 3 kann nicht starten',
        suggestion: 'Mind Space: "Stripe vs Paddle"'
      }
    ];
    
    if (blockers.length === 0) {
      return '<div class="text-center text-success p-4">✓ Keine Blocker</div>';
    }
    
    return blockers.map(b => `
      <div class="p-3 mb-3 rounded-md bg-surface-1 border-l-3" 
           style="border-left: 3px solid ${b.severity === 'high' ? 'var(--color-critical)' : 'var(--color-warning)'}">
        <div class="flex items-center gap-2 mb-1">
          <span class="${b.severity === 'high' ? 'text-critical' : 'text-warning'}">
            ${b.severity === 'high' ? '🔴' : '🟡'}
          </span>
          <span class="font-medium">${b.description}</span>
        </div>
        <div class="text-sm text-secondary mb-1">Impact: ${b.impact}</div>
        <div class="text-sm text-tertiary">💡 ${b.suggestion}</div>
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
          <button class="btn btn-sm mt-2">+ Kontakt hinzufügen</button>
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
      <button class="btn-ghost text-sm mt-2">+ Kontakt hinzufügen</button>
    `;
  },
  
  // Render mind space links
  renderMindSpaceLinks(venture) {
    const notes = NexusStore.getNotes().slice(0, 3);
    
    if (notes.length === 0) {
      return `
        <div class="text-center text-tertiary p-4">
          Keine Notizen verknüpft
          <button class="btn btn-sm mt-2">+ Neue Notiz</button>
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
      <button class="btn-ghost text-sm mt-2">Canvas öffnen →</button>
    `;
  },
  
  // Setup event listeners
  setupEventListeners() {
    // Tab switching
    document.addEventListener('click', (e) => {
      const tab = e.target.closest('.tab');
      if (!tab) return;
      
      const container = tab.closest('.tabs, .tabs-pills');
      if (!container) return;
      
      container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
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
