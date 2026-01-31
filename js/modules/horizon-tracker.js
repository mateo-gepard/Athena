/* ═══════════════════════════════════════════════════════════════════════════════
   NEXUS ULTRA - Horizon Tracker Module
   Langfristige Ziele, Bucket List, Lebensthemen
   ═══════════════════════════════════════════════════════════════════════════════ */

const HorizonTracker = {
  
  currentTab: 'life-goals', // life-goals | bucket-list | yearly-themes
  
  // Initialize
  init() {
    this.render();
    this.setupEventListeners();
  },
  
  // Render the horizon tracker
  render() {
    const container = document.getElementById('page-horizon-tracker');
    if (!container) return;
    
    container.innerHTML = `
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-medium">Horizon Tracker</h2>
          <p class="text-secondary">Langfristige Ziele und Lebensvisionen</p>
        </div>
        
        <div class="flex items-center gap-3">
          <button class="btn btn-primary" id="ht-new-goal">
            ${NexusUI.icon('target', 16)}
            Neues Ziel
          </button>
        </div>
      </div>
      
      <!-- Tabs -->
      <div class="tabs mb-6">
        <button class="tab ${this.currentTab === 'life-goals' ? 'active' : ''}" data-tab="life-goals">
          🎯 Life Goals
        </button>
        <button class="tab ${this.currentTab === 'bucket-list' ? 'active' : ''}" data-tab="bucket-list">
          ✨ Bucket List
        </button>
        <button class="tab ${this.currentTab === 'yearly-themes' ? 'active' : ''}" data-tab="yearly-themes">
          📅 Yearly Themes
        </button>
      </div>
      
      <!-- Content -->
      <div class="horizon-content">
        ${this.currentTab === 'life-goals' ? this.renderLifeGoals() :
          this.currentTab === 'bucket-list' ? this.renderBucketList() :
          this.renderYearlyThemes()}
      </div>
    `;
    
    NexusUI.refreshIcons();
  },
  
  // Render life goals section
  renderLifeGoals() {
    const goals = NexusStore.getGoals();
    
    if (goals.length === 0) {
      return `
        <div class="panel">
          <div class="panel-body">
            ${NexusUI.renderEmptyState(
              'target',
              'Keine Lebensziele definiert',
              'Definiere deine Vision und setze langfristige Ziele!'
            )}
          </div>
        </div>
      `;
    }
    
    // Group goals by horizon
    const horizonGroups = {
      '10-year': goals.filter(g => g.horizon === '10-year'),
      '5-year': goals.filter(g => g.horizon === '5-year'),
      '1-year': goals.filter(g => g.horizon === '1-year'),
      '90-day': goals.filter(g => g.horizon === '90-day')
    };
    
    return `
      <!-- Life Vision Statement -->
      <div class="atlas-panel mb-6">
        <div class="atlas-header">
          <div class="atlas-icon">🌟</div>
          <span class="atlas-title">Life Vision</span>
        </div>
        <div class="atlas-body">
          ${NexusStore.state.user?.lifeVision ? `
            <blockquote class="text-lg italic text-secondary" style="border-left: 3px solid var(--color-accent); padding-left: var(--space-4);">
              "${NexusStore.state.user.lifeVision}"
            </blockquote>
          ` : `
            <p class="text-secondary">Noch keine Life Vision definiert. Was ist deine größte Vision für dein Leben?</p>
          `}
          <button class="btn btn-ghost btn-sm mt-3" id="edit-life-vision">✏️ Vision bearbeiten</button>
        </div>
      </div>
      
      <!-- Horizon Levels -->
      <div class="grid gap-6" style="grid-template-columns: repeat(2, 1fr);">
        ${this.renderHorizonLevel('10-year', '🏔️ 10-Jahres-Vision', horizonGroups['10-year'])}
        ${this.renderHorizonLevel('5-year', '🎯 5-Jahres-Ziele', horizonGroups['5-year'])}
        ${this.renderHorizonLevel('1-year', '📅 Jahresziele', horizonGroups['1-year'])}
        ${this.renderHorizonLevel('90-day', '🏃 90-Tage-Sprints', horizonGroups['90-day'])}
      </div>
      
      <!-- Goal Relationships -->
      <div class="panel mt-6">
        <div class="panel-header">
          <span class="panel-title">🔗 Ziel-Hierarchie</span>
        </div>
        <div class="panel-body">
          ${this.renderGoalHierarchy(goals)}
        </div>
      </div>
    `;
  },
  
  // Render horizon level
  renderHorizonLevel(horizon, title, goals) {
    return `
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">${title}</span>
          <span class="badge">${goals.length}</span>
        </div>
        <div class="panel-body">
          ${goals.length === 0 ? `
            <div class="text-center text-tertiary p-4">
              <p>Keine Ziele definiert</p>
              <button class="btn btn-sm btn-ghost mt-2" data-add-goal="${horizon}">
                + Ziel hinzufügen
              </button>
            </div>
          ` : `
            <div class="content-stack gap-3">
              ${goals.map(goal => this.renderGoalCard(goal)).join('')}
            </div>
            <button class="btn btn-ghost btn-sm mt-3" data-add-goal="${horizon}">
              + Weiteres Ziel
            </button>
          `}
        </div>
      </div>
    `;
  },
  
  // Render goal card
  renderGoalCard(goal) {
    const progress = goal.progress || 0;
    const statusColor = goal.status === 'on-track' ? 'success' : 
                        goal.status === 'at-risk' ? 'warning' : 
                        goal.status === 'off-track' ? 'critical' : '';
    
    return `
      <div class="goal-card" data-goal-id="${goal.id}">
        <div class="flex items-start gap-3">
          ${goal.sphere ? `
            <div class="sphere-indicator" style="background: var(--color-sphere-${goal.sphere})"></div>
          ` : ''}
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-lg">${goal.icon || '🎯'}</span>
              <span class="font-medium">${goal.title}</span>
              ${statusColor ? `
                <span class="badge badge-${statusColor}">${goal.status}</span>
              ` : ''}
            </div>
            ${goal.description ? `
              <p class="text-sm text-secondary mb-2">${goal.description}</p>
            ` : ''}
            <div class="flex items-center gap-2 mb-2">
              ${NexusUI.renderProgress(progress, { labeled: true })}
            </div>
            ${goal.keyResults?.length > 0 ? `
              <div class="key-results mt-2">
                <div class="text-xs text-tertiary mb-1">Key Results:</div>
                ${goal.keyResults.slice(0, 2).map(kr => `
                  <div class="key-result-item">
                    <span class="${kr.completed ? 'text-success' : ''}">${kr.completed ? '✓' : '○'}</span>
                    <span class="text-sm">${kr.title}</span>
                  </div>
                `).join('')}
                ${goal.keyResults.length > 2 ? `
                  <span class="text-xs text-tertiary">+${goal.keyResults.length - 2} weitere</span>
                ` : ''}
              </div>
            ` : ''}
          </div>
          <button class="btn-icon-sm">
            ${NexusUI.icon('more-vertical', 14)}
          </button>
        </div>
      </div>
    `;
  },
  
  // Render goal hierarchy visualization
  renderGoalHierarchy(goals) {
    const tenYearGoals = goals.filter(g => g.horizon === '10-year');
    
    if (tenYearGoals.length === 0) {
      return '<div class="text-center text-tertiary p-4">Definiere 10-Jahres-Ziele um die Hierarchie zu sehen</div>';
    }
    
    return `
      <div class="goal-hierarchy">
        ${tenYearGoals.map(tenYear => {
          const fiveYearChildren = goals.filter(g => g.horizon === '5-year' && g.parentId === tenYear.id);
          
          return `
            <div class="hierarchy-branch">
              <div class="hierarchy-node level-1">
                <span class="text-lg">${tenYear.icon || '🏔️'}</span>
                <span>${tenYear.title}</span>
              </div>
              ${fiveYearChildren.length > 0 ? `
                <div class="hierarchy-children">
                  ${fiveYearChildren.map(fiveYear => {
                    const yearChildren = goals.filter(g => g.horizon === '1-year' && g.parentId === fiveYear.id);
                    
                    return `
                      <div class="hierarchy-branch">
                        <div class="hierarchy-node level-2">
                          <span>${fiveYear.icon || '🎯'}</span>
                          <span>${fiveYear.title}</span>
                        </div>
                        ${yearChildren.length > 0 ? `
                          <div class="hierarchy-children">
                            ${yearChildren.map(year => `
                              <div class="hierarchy-node level-3">
                                <span>${year.icon || '📅'}</span>
                                <span>${year.title}</span>
                              </div>
                            `).join('')}
                          </div>
                        ` : ''}
                      </div>
                    `;
                  }).join('')}
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  },
  
  // Render bucket list section
  renderBucketList() {
    // Get bucket items from store
    const bucketItems = NexusStore.state.bucketItems || [];
    
    const categories = {
      travel: { icon: '✈️', label: 'Reisen' },
      fitness: { icon: '💪', label: 'Fitness' },
      creativity: { icon: '🎨', label: 'Kreativität' },
      learning: { icon: '📚', label: 'Lernen' },
      adventure: { icon: '🏔️', label: 'Abenteuer' },
      career: { icon: '💼', label: 'Karriere' }
    };
    
    if (bucketItems.length === 0) {
      return `
        <div class="panel">
          <div class="panel-body">
            ${NexusUI.renderEmptyState(
              'star',
              'Keine Bucket List Items',
              'Füge hinzu, was du in deinem Leben erleben möchtest!'
            )}
            <div class="text-center mt-4">
              <button class="btn btn-primary" id="add-bucket-item">+ Bucket Item hinzufügen</button>
            </div>
          </div>
        </div>
      `;
    }
    
    const completed = bucketItems.filter(i => i.completed);
    const pending = bucketItems.filter(i => !i.completed);
    
    return `
      <!-- Stats -->
      <div class="grid gap-4 mb-6" style="grid-template-columns: repeat(4, 1fr);">
        <div class="stat-card">
          <div class="stat-label">✨ Total</div>
          <div class="stat-value">${bucketItems.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">✓ Erledigt</div>
          <div class="stat-value text-success">${completed.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">○ Offen</div>
          <div class="stat-value">${pending.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">📈 Quote</div>
          <div class="stat-value">${Math.round((completed.length / bucketItems.length) * 100)}%</div>
        </div>
      </div>
      
      <div class="layout-two-col">
        <div class="layout-two-col-main">
          <!-- Pending Items -->
          <div class="panel mb-6">
            <div class="panel-header">
              <span class="panel-title">○ Noch zu erleben</span>
              <button class="btn btn-sm">+ Hinzufügen</button>
            </div>
            <div class="panel-body">
              <div class="content-stack gap-3">
                ${pending.map(item => `
                  <div class="bucket-item">
                    <div class="flex items-center gap-3">
                      <button class="task-checkbox" data-bucket-id="${item.id}"></button>
                      <span class="text-xl">${categories[item.category]?.icon || '✨'}</span>
                      <div class="flex-1">
                        <div class="font-medium">${item.title}</div>
                        <div class="text-xs text-tertiary">${categories[item.category]?.label || item.category}</div>
                      </div>
                      ${item.priority === 'high' ? '<span class="badge badge-critical">Priorität</span>' : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
          
          <!-- Completed Items -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">✓ Erlebt</span>
            </div>
            <div class="panel-body">
              <div class="content-stack gap-2">
                ${completed.map(item => `
                  <div class="bucket-item completed">
                    <div class="flex items-center gap-3">
                      <span class="text-success">✓</span>
                      <span class="text-xl">${categories[item.category]?.icon || '✨'}</span>
                      <div class="flex-1">
                        <div class="font-medium text-secondary line-through">${item.title}</div>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
        
        <div class="layout-two-col-aside">
          <!-- Categories -->
          <div class="panel mb-6">
            <div class="panel-header">
              <span class="panel-title">Kategorien</span>
            </div>
            <div class="panel-body">
              ${Object.entries(categories).map(([key, cat]) => {
                const count = bucketItems.filter(i => i.category === key).length;
                const completedCount = bucketItems.filter(i => i.category === key && i.completed).length;
                return `
                  <div class="flex items-center gap-3 p-2 rounded-md hover:bg-surface-2 cursor-pointer mb-2">
                    <span class="text-lg">${cat.icon}</span>
                    <span class="flex-1">${cat.label}</span>
                    <span class="text-tertiary text-sm">${completedCount}/${count}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          
          <!-- Random Pick -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">🎲 Zufällige Inspiration</span>
            </div>
            <div class="panel-body text-center p-6">
              <div class="text-4xl mb-3">${categories[pending[0]?.category]?.icon || '✨'}</div>
              <div class="font-medium mb-2">${pending[0]?.title || 'Keine Items'}</div>
              <button class="btn btn-ghost btn-sm">🔄 Neu würfeln</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },
  
  // Render yearly themes section
  renderYearlyThemes() {
    const currentYear = new Date().getFullYear();
    
    // Get themes from user settings or show empty state
    const themes = NexusStore.state.user?.yearlyThemes || [];
    
    if (themes.length === 0) {
      return `
        <div class="panel">
          <div class="panel-body">
            ${NexusUI.renderEmptyState(
              'calendar',
              'Keine Jahres-Themen definiert',
              'Definiere ein Thema für dieses Jahr, um fokussiert zu bleiben!'
            )}
            <div class="text-center mt-4">
              <button class="btn btn-primary" id="add-yearly-theme">+ Jahres-Theme erstellen</button>
            </div>
          </div>
        </div>
      `;
    }
    
    const currentTheme = themes.find(t => t.year === currentYear) || themes[0];
    
    return `
      <!-- Current Year Theme -->
      <div class="panel mb-6" style="border: 2px solid var(--color-accent);">
        <div class="panel-header" style="background: linear-gradient(135deg, var(--color-accent), var(--color-sphere-projekte)); opacity: 0.9;">
          <span class="panel-title" style="color: white;">${currentTheme.year} - ${currentTheme.theme}</span>
          <span class="text-2xl">${currentTheme.icon || '🎯'}</span>
        </div>
        <div class="panel-body">
          <p class="text-lg mb-4">${currentTheme.description || ''}</p>
          
          ${currentTheme.focus && currentTheme.focus.length > 0 ? `
            <div class="grid gap-4 mb-4" style="grid-template-columns: repeat(${Math.min(currentTheme.focus.length, 3)}, 1fr);">
              ${currentTheme.focus.map(f => `
                <div class="p-3 rounded-md bg-surface-2 text-center">
                  <div class="text-sm">${f}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-secondary">Jahresfortschritt</span>
              <span class="mono">${currentTheme.progress || 0}%</span>
            </div>
            ${NexusUI.renderProgress(currentTheme.progress || 0)}
          </div>
          
          <div class="flex gap-2">
            <button class="btn btn-primary">
              ${NexusUI.icon('edit-2', 14)}
              Theme bearbeiten
            </button>
            <button class="btn btn-secondary">
              ${NexusUI.icon('file-text', 14)}
              Quarterly Review
            </button>
          </div>
        </div>
      </div>
      
      <!-- Past Themes -->
      ${themes.filter(t => t.status === 'completed').length > 0 ? `
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">📜 Vergangene Themes</span>
          </div>
          <div class="panel-body">
            ${themes.filter(t => t.status === 'completed').map(t => `
              <div class="past-theme-item mb-4 p-4 rounded-md bg-surface-1">
                <div class="flex items-center gap-3 mb-2">
                  <span class="text-2xl">${t.icon || '📅'}</span>
                  <div>
                    <span class="font-medium">${t.year} - ${t.theme}</span>
                    <span class="badge badge-success ml-2">Abgeschlossen</span>
                  </div>
                </div>
                <p class="text-secondary mb-2">${t.description || ''}</p>
                ${t.reflection ? `
                  <div class="p-3 rounded-md bg-surface-2 border-l-3" style="border-left: 3px solid var(--color-success);">
                    <div class="text-xs text-tertiary mb-1">Reflektion:</div>
                    <p class="text-sm italic">"${t.reflection}"</p>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      <!-- Quick Add Future Theme -->
      <div class="panel mt-6">
        <div class="panel-header">
          <span class="panel-title">🔮 Nächstes Jahr planen</span>
        </div>
        <div class="panel-body">
          <div class="flex items-center gap-4">
            <input type="text" class="input flex-1" placeholder="${currentYear + 1} - Das Jahr der...">
            <button class="btn btn-primary">
              ${NexusUI.icon('plus', 14)}
              Theme erstellen
            </button>
          </div>
        </div>
      </div>
    `;
  },
  
  // Switch tab
  switchTab(tab) {
    this.currentTab = tab;
    this.render();
  },
  
  // Setup event listeners
  setupEventListeners() {
    document.addEventListener('click', (e) => {
      // Tab switching
      const tab = e.target.closest('.tabs .tab');
      if (tab && tab.dataset.tab) {
        this.switchTab(tab.dataset.tab);
        return;
      }
      
      // New goal button
      if (e.target.closest('#ht-new-goal')) {
        this.showNewGoalModal();
        return;
      }
      
      // Add goal to specific horizon
      const addGoalBtn = e.target.closest('[data-add-goal]');
      if (addGoalBtn) {
        this.showNewGoalModal(addGoalBtn.dataset.addGoal);
        return;
      }
      
      // Goal card click
      const goalCard = e.target.closest('.goal-card');
      if (goalCard && goalCard.dataset.goalId) {
        this.showGoalDetail(goalCard.dataset.goalId);
        return;
      }
    });
  },
  
  // Show new goal modal
  showNewGoalModal(horizon = '1-year') {
    const content = `
      <div class="p-4">
        <div class="mb-4">
          <label class="input-label">Ziel Titel</label>
          <input type="text" class="input" id="goal-title" placeholder="z.B. 100k MRR erreichen">
        </div>
        <div class="mb-4">
          <label class="input-label">Beschreibung</label>
          <textarea class="input" id="goal-description" rows="3" placeholder="Was bedeutet dieses Ziel für dich?"></textarea>
        </div>
        <div class="mb-4">
          <label class="input-label">Zeithorizont</label>
          <select class="input" id="goal-horizon">
            <option value="10-year" ${horizon === '10-year' ? 'selected' : ''}>10 Jahre</option>
            <option value="5-year" ${horizon === '5-year' ? 'selected' : ''}>5 Jahre</option>
            <option value="1-year" ${horizon === '1-year' ? 'selected' : ''}>1 Jahr</option>
            <option value="90-day" ${horizon === '90-day' ? 'selected' : ''}>90 Tage</option>
          </select>
        </div>
        <div class="mb-4">
          <label class="input-label">Icon</label>
          <input type="text" class="input" id="goal-icon" placeholder="🎯" value="🎯">
        </div>
        <div class="flex gap-2 justify-end">
          <button class="btn btn-secondary" onclick="NexusUI.closeModal()">Abbrechen</button>
          <button class="btn btn-primary" onclick="HorizonTracker.createGoal()">Ziel erstellen</button>
        </div>
      </div>
    `;
    
    NexusUI.openModal('Neues Ziel', content);
  },
  
  // Create new goal
  createGoal() {
    const title = document.getElementById('goal-title')?.value;
    const description = document.getElementById('goal-description')?.value;
    const horizon = document.getElementById('goal-horizon')?.value;
    const icon = document.getElementById('goal-icon')?.value;
    
    if (!title) {
      NexusUI.showToast('Bitte Titel eingeben', 'error');
      return;
    }
    
    const goal = {
      id: 'goal_' + Date.now(),
      title,
      description,
      horizon,
      icon: icon || '🎯',
      progress: 0,
      status: 'on-track',
      keyResults: [],
      createdAt: new Date().toISOString()
    };
    
    NexusStore.addGoal(goal);
    NexusUI.closeModal();
    this.render();
    NexusUI.showToast('Ziel erstellt!', 'success');
  },
  
  // Show goal detail
  showGoalDetail(goalId) {
    const goal = NexusStore.getGoals().find(g => g.id === goalId);
    if (!goal) return;
    
    const content = `
      <div class="p-4">
        <div class="flex items-center gap-3 mb-4">
          <span class="text-3xl">${goal.icon || '🎯'}</span>
          <div>
            <h3 class="text-lg font-medium">${goal.title}</h3>
            <p class="text-secondary">${goal.description || 'Keine Beschreibung'}</p>
          </div>
        </div>
        
        <div class="mb-4">
          <label class="input-label">Fortschritt</label>
          <div class="flex items-center gap-3">
            <input type="range" min="0" max="100" value="${goal.progress || 0}" 
                   class="flex-1" id="goal-progress-slider">
            <span class="mono">${goal.progress || 0}%</span>
          </div>
        </div>
        
        <div class="mb-4">
          <label class="input-label">Key Results</label>
          <div class="text-tertiary text-sm">(Bald verfügbar)</div>
        </div>
        
        <div class="flex gap-2 justify-end">
          <button class="btn btn-secondary" onclick="NexusUI.closeModal()">Schließen</button>
          <button class="btn btn-primary" onclick="HorizonTracker.updateGoalProgress('${goal.id}')">Speichern</button>
        </div>
      </div>
    `;
    
    NexusUI.openModal('Ziel Details', content);
  },
  
  // Update goal progress
  updateGoalProgress(goalId) {
    const progress = parseInt(document.getElementById('goal-progress-slider')?.value || 0);
    NexusStore.updateGoal(goalId, { progress });
    NexusUI.closeModal();
    this.render();
    NexusUI.showToast('Fortschritt aktualisiert', 'success');
  }
};

// Initialize on navigation
window.addEventListener('nexus:navigate', (e) => {
  if (e.detail.page === 'horizon-tracker') {
    HorizonTracker.init();
  }
});

// Export
window.HorizonTracker = HorizonTracker;
