/* ═══════════════════════════════════════════════════════════════════════════════
   NEXUS ULTRA - Projects Module
   Full project management view
   ═══════════════════════════════════════════════════════════════════════════════ */

const ProjectsModule = {
  
  filter: 'all', // all | active | completed | sphere
  sphereFilter: null,
  sortBy: 'updated', // updated | created | name | progress
  _listenersInitialized: false,
  
  // Initialize
  init() {
    this.render();
  },
  
  // Render
  render() {
    const container = document.getElementById('page-projects');
    if (!container) return;
    
    let projects = NexusStore.getProjects();
    projects = this.applyFilters(projects);
    projects = this.applySort(projects);
    
    const stats = this.getStats(NexusStore.getProjects());
    
    container.innerHTML = `
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-medium">Projekte</h2>
          <p class="text-secondary">${stats.active} aktiv • ${stats.completed} abgeschlossen</p>
        </div>
        
        <button class="btn btn-primary" id="add-project-btn">
          ${NexusUI.icon('plus', 16)}
          Neues Projekt
        </button>
      </div>
      
      <!-- Stats -->
      <div class="grid gap-4 mb-6" style="grid-template-columns: repeat(4, 1fr);">
        <div class="stat-card clickable ${this.filter === 'all' ? 'active' : ''}" data-filter="all">
          <div class="stat-label">Gesamt</div>
          <div class="stat-value">${stats.total}</div>
        </div>
        <div class="stat-card clickable ${this.filter === 'active' ? 'active' : ''}" data-filter="active">
          <div class="stat-label">Aktiv</div>
          <div class="stat-value">${stats.active}</div>
        </div>
        <div class="stat-card clickable ${this.filter === 'completed' ? 'active' : ''}" data-filter="completed">
          <div class="stat-label">Abgeschlossen</div>
          <div class="stat-value">${stats.completed}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Ø Fortschritt</div>
          <div class="stat-value">${stats.avgProgress}%</div>
        </div>
      </div>
      
      <!-- Filters -->
      <div class="flex items-center justify-between mb-4 gap-4">
        <div class="flex items-center gap-2">
          <span class="text-secondary">Sphäre:</span>
          <div class="sphere-filter-group flex gap-1">
            <button class="sphere-filter-btn ${!this.sphereFilter ? 'active' : ''}" data-sphere="">
              Alle
            </button>
            <button class="sphere-filter-btn ${this.sphereFilter === 'geschaeft' ? 'active' : ''}" 
                    data-sphere="geschaeft" style="--sphere-color: var(--color-sphere-geschaeft)">
              💼
            </button>
            <button class="sphere-filter-btn ${this.sphereFilter === 'projekte' ? 'active' : ''}" 
                    data-sphere="projekte" style="--sphere-color: var(--color-sphere-projekte)">
              🚀
            </button>
            <button class="sphere-filter-btn ${this.sphereFilter === 'schule' ? 'active' : ''}" 
                    data-sphere="schule" style="--sphere-color: var(--color-sphere-schule)">
              📚
            </button>
            <button class="sphere-filter-btn ${this.sphereFilter === 'sport' ? 'active' : ''}" 
                    data-sphere="sport" style="--sphere-color: var(--color-sphere-sport)">
              💪
            </button>
            <button class="sphere-filter-btn ${this.sphereFilter === 'freizeit' ? 'active' : ''}" 
                    data-sphere="freizeit" style="--sphere-color: var(--color-sphere-freizeit)">
              🎮
            </button>
          </div>
        </div>
        
        <select class="input" style="width: auto;" id="project-sort">
          <option value="updated" ${this.sortBy === 'updated' ? 'selected' : ''}>Zuletzt bearbeitet</option>
          <option value="created" ${this.sortBy === 'created' ? 'selected' : ''}>Erstellt</option>
          <option value="name" ${this.sortBy === 'name' ? 'selected' : ''}>Name</option>
          <option value="progress" ${this.sortBy === 'progress' ? 'selected' : ''}>Fortschritt</option>
        </select>
      </div>
      
      <!-- Projects Grid -->
      ${projects.length === 0 ? `
        <div class="panel">
          <div class="panel-body">
            <div class="empty-state p-8">
              <div class="text-4xl mb-4">📁</div>
              <h3 class="text-lg mb-2">Keine Projekte</h3>
              <p class="text-secondary mb-4">Starte dein erstes Projekt!</p>
              <button class="btn btn-primary" id="add-project-btn-empty">
                ${NexusUI.icon('plus', 16)}
                Projekt erstellen
              </button>
            </div>
          </div>
        </div>
      ` : `
        <div class="projects-grid">
          ${projects.map(p => this.renderProjectCard(p)).join('')}
        </div>
      `}
    `;
    
    NexusUI.refreshIcons();
  },
  
  // Get stats
  getStats(projects) {
    const total = projects.length;
    const active = projects.filter(p => p.status === 'active' || !p.status).length;
    const completed = projects.filter(p => p.status === 'completed').length;
    
    let totalProgress = 0;
    projects.forEach(p => totalProgress += (p.progress || 0));
    const avgProgress = total > 0 ? Math.round(totalProgress / total) : 0;
    
    return { total, active, completed, avgProgress };
  },
  
  // Apply filters
  applyFilters(projects) {
    let filtered = [...projects];
    
    if (this.filter === 'active') {
      filtered = filtered.filter(p => p.status === 'active' || !p.status);
    } else if (this.filter === 'completed') {
      filtered = filtered.filter(p => p.status === 'completed');
    }
    
    if (this.sphereFilter) {
      filtered = filtered.filter(p => p.sphere === this.sphereFilter);
    }
    
    return filtered;
  },
  
  // Apply sort
  applySort(projects) {
    return projects.sort((a, b) => {
      switch (this.sortBy) {
        case 'updated':
          return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
        case 'created':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'progress':
          return (b.progress || 0) - (a.progress || 0);
        default:
          return 0;
      }
    });
  },
  
  // Render project card
  renderProjectCard(project) {
    const tasks = NexusStore.getTasks().filter(t => t.projectId === project.id);
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const progress = project.progress || (tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0);
    
    return `
      <div class="project-card" data-project-id="${project.id}">
        <div class="project-card-header">
          <div class="project-icon">${project.icon || '📁'}</div>
          <div class="project-card-actions">
            <button class="btn-icon-sm" data-action="edit">
              ${NexusUI.icon('edit-2', 14)}
            </button>
            <button class="btn-icon-sm" data-action="delete">
              ${NexusUI.icon('trash-2', 14)}
            </button>
          </div>
        </div>
        
        <h3 class="project-name">${project.name}</h3>
        <p class="project-description">${project.description || 'Keine Beschreibung'}</p>
        
        <div class="project-meta">
          ${project.sphere ? `
            <span class="badge" style="background: var(--color-sphere-${project.sphere});">
              ${project.sphere}
            </span>
          ` : ''}
          ${project.status === 'completed' ? `
            <span class="badge bg-success">Abgeschlossen</span>
          ` : ''}
        </div>
        
        <div class="project-progress">
          <div class="progress-header">
            <span>${tasks.length} Tasks</span>
            <span>${progress}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%; background: ${project.sphere ? `var(--color-sphere-${project.sphere})` : 'var(--color-accent)'}"></div>
          </div>
        </div>
        
        ${project.deadline ? `
          <div class="project-deadline">
            ${NexusUI.icon('calendar', 14)}
            <span>${NexusUI.formatDate(new Date(project.deadline))}</span>
          </div>
        ` : ''}
        
        <button class="btn btn-secondary btn-sm w-full mt-3" data-action="open">
          Öffnen ${NexusUI.icon('chevron-right', 14)}
        </button>
      </div>
    `;
  },
  
  // Show add project modal
  showAddProjectModal() {
    const content = `
      <div class="p-4">
        <div class="mb-4">
          <label class="input-label">Name *</label>
          <input type="text" class="input" id="new-project-name" placeholder="z.B. Website Redesign">
        </div>
        <div class="mb-4">
          <label class="input-label">Icon</label>
          <input type="text" class="input" id="new-project-icon" placeholder="📁" value="📁">
        </div>
        <div class="mb-4">
          <label class="input-label">Beschreibung</label>
          <textarea class="input" id="new-project-description" rows="3" placeholder="Worum geht es?"></textarea>
        </div>
        <div class="grid gap-4" style="grid-template-columns: 1fr 1fr;">
          <div>
            <label class="input-label">Sphäre</label>
            <select class="input" id="new-project-sphere">
              <option value="">Keine</option>
              <option value="geschaeft">💼 Geschäft</option>
              <option value="projekte">🚀 Projekte</option>
              <option value="schule">📚 Schule</option>
              <option value="sport">💪 Sport</option>
              <option value="freizeit">🎮 Freizeit</option>
            </select>
          </div>
          <div>
            <label class="input-label">Deadline</label>
            <input type="date" class="input" id="new-project-deadline">
          </div>
        </div>
        <div class="mb-4 mt-4">
          <label class="input-label">Notizen</label>
          <textarea class="input" id="new-project-notes" rows="2" placeholder="Zusätzliche Notizen..."></textarea>
        </div>
        <div class="flex gap-2 justify-end mt-6">
          <button class="btn btn-secondary" onclick="NexusUI.closeModal()">Abbrechen</button>
          <button class="btn btn-primary" onclick="ProjectsModule.createProject()">Erstellen</button>
        </div>
      </div>
    `;
    
    NexusUI.openModal('Neues Projekt', content);
  },
  
  // Create project
  createProject() {
    const name = document.getElementById('new-project-name')?.value;
    if (!name) {
      NexusUI.showToast('Name ist erforderlich', 'error');
      return;
    }
    
    const project = {
      name,
      icon: document.getElementById('new-project-icon')?.value || '📁',
      description: document.getElementById('new-project-description')?.value || '',
      sphere: document.getElementById('new-project-sphere')?.value || null,
      deadline: document.getElementById('new-project-deadline')?.value || null,
      notes: document.getElementById('new-project-notes')?.value || '',
      status: 'active',
      progress: 0
    };
    
    NexusStore.addProject(project);
    NexusUI.closeModal();
    NexusUI.showToast('Projekt erstellt!', 'success');
    this.render();
  },
  
  // Open project detail
  openProject(projectId) {
    const project = NexusStore.getProjects().find(p => p.id === projectId);
    if (!project) return;
    
    const tasks = NexusStore.getTasks().filter(t => t.projectId === projectId);
    const completedTasks = tasks.filter(t => t.status === 'completed');
    
    const content = `
      <div class="p-4">
        <div class="flex items-center gap-4 mb-6">
          <div class="text-4xl">${project.icon || '📁'}</div>
          <div class="flex-1">
            <h3 class="text-xl font-medium">${project.name}</h3>
            <p class="text-secondary">${project.description || 'Keine Beschreibung'}</p>
          </div>
          ${project.sphere ? `
            <span class="badge" style="background: var(--color-sphere-${project.sphere});">
              ${project.sphere}
            </span>
          ` : ''}
        </div>
        
        <div class="grid gap-4 mb-6" style="grid-template-columns: repeat(3, 1fr);">
          <div class="stat-card">
            <div class="stat-label">Fortschritt</div>
            <div class="stat-value">${project.progress || 0}%</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Tasks</div>
            <div class="stat-value">${completedTasks.length}/${tasks.length}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Deadline</div>
            <div class="stat-value">${project.deadline ? NexusUI.formatDate(new Date(project.deadline)) : '-'}</div>
          </div>
        </div>
        
        <div class="mb-4">
          <h4 class="font-medium mb-2">Verknüpfte Tasks</h4>
          ${tasks.length === 0 ? `
            <div class="text-tertiary text-center py-4">Keine Tasks verknüpft</div>
          ` : `
            <div class="content-stack gap-2" style="max-height: 200px; overflow-y: auto;">
              ${tasks.map(t => `
                <div class="task-item ${t.status === 'completed' ? 'completed' : ''}">
                  <span>${t.status === 'completed' ? '✓' : '○'}</span>
                  <span class="${t.status === 'completed' ? 'text-tertiary' : ''}">${t.title}</span>
                </div>
              `).join('')}
            </div>
          `}
        </div>
        
        ${project.notes ? `
          <div class="mb-4">
            <h4 class="font-medium mb-2">Notizen</h4>
            <div class="text-secondary">${project.notes}</div>
          </div>
        ` : ''}
        
        <div class="flex gap-2 justify-end mt-6">
          <button class="btn btn-secondary" onclick="NexusUI.closeModal()">Schließen</button>
          <button class="btn btn-primary" onclick="ProjectsModule.editProject('${projectId}')">Bearbeiten</button>
        </div>
      </div>
    `;
    
    NexusUI.openModal(`${project.icon || '📁'} ${project.name}`, content, { size: 'large' });
  },
  
  // Edit project
  editProject(projectId) {
    NexusUI.closeModal();
    
    const project = NexusStore.getProjects().find(p => p.id === projectId);
    if (!project) return;
    
    setTimeout(() => {
      const content = `
        <div class="p-4">
          <div class="mb-4">
            <label class="input-label">Name *</label>
            <input type="text" class="input" id="edit-project-name" value="${project.name}">
          </div>
          <div class="mb-4">
            <label class="input-label">Icon</label>
            <input type="text" class="input" id="edit-project-icon" value="${project.icon || '📁'}">
          </div>
          <div class="mb-4">
            <label class="input-label">Beschreibung</label>
            <textarea class="input" id="edit-project-description" rows="3">${project.description || ''}</textarea>
          </div>
          <div class="grid gap-4" style="grid-template-columns: 1fr 1fr;">
            <div>
              <label class="input-label">Sphäre</label>
              <select class="input" id="edit-project-sphere">
                <option value="">Keine</option>
                <option value="geschaeft" ${project.sphere === 'geschaeft' ? 'selected' : ''}>💼 Geschäft</option>
                <option value="projekte" ${project.sphere === 'projekte' ? 'selected' : ''}>🚀 Projekte</option>
                <option value="schule" ${project.sphere === 'schule' ? 'selected' : ''}>📚 Schule</option>
                <option value="sport" ${project.sphere === 'sport' ? 'selected' : ''}>💪 Sport</option>
                <option value="freizeit" ${project.sphere === 'freizeit' ? 'selected' : ''}>🎮 Freizeit</option>
              </select>
            </div>
            <div>
              <label class="input-label">Status</label>
              <select class="input" id="edit-project-status">
                <option value="active" ${project.status === 'active' ? 'selected' : ''}>Aktiv</option>
                <option value="paused" ${project.status === 'paused' ? 'selected' : ''}>Pausiert</option>
                <option value="completed" ${project.status === 'completed' ? 'selected' : ''}>Abgeschlossen</option>
              </select>
            </div>
          </div>
          <div class="grid gap-4 mt-4" style="grid-template-columns: 1fr 1fr;">
            <div>
              <label class="input-label">Deadline</label>
              <input type="date" class="input" id="edit-project-deadline" value="${project.deadline || ''}">
            </div>
            <div>
              <label class="input-label">Fortschritt (%)</label>
              <input type="number" class="input" id="edit-project-progress" min="0" max="100" value="${project.progress || 0}">
            </div>
          </div>
          <div class="mb-4 mt-4">
            <label class="input-label">Notizen</label>
            <textarea class="input" id="edit-project-notes" rows="2">${project.notes || ''}</textarea>
          </div>
          <div class="flex gap-2 justify-end mt-6">
            <button class="btn btn-secondary" onclick="NexusUI.closeModal()">Abbrechen</button>
            <button class="btn btn-primary" onclick="ProjectsModule.saveProject('${projectId}')">Speichern</button>
          </div>
        </div>
      `;
      
      NexusUI.openModal('Projekt bearbeiten', content);
    }, 100);
  },
  
  // Save project
  saveProject(projectId) {
    const name = document.getElementById('edit-project-name')?.value;
    if (!name) {
      NexusUI.showToast('Name ist erforderlich', 'error');
      return;
    }
    
    NexusStore.updateProject(projectId, {
      name,
      icon: document.getElementById('edit-project-icon')?.value || '📁',
      description: document.getElementById('edit-project-description')?.value || '',
      sphere: document.getElementById('edit-project-sphere')?.value || null,
      status: document.getElementById('edit-project-status')?.value || 'active',
      deadline: document.getElementById('edit-project-deadline')?.value || null,
      progress: parseInt(document.getElementById('edit-project-progress')?.value) || 0,
      notes: document.getElementById('edit-project-notes')?.value || ''
    });
    
    NexusUI.closeModal();
    NexusUI.showToast('Projekt gespeichert!', 'success');
    this.render();
  },
  
  // Delete project
  deleteProject(projectId) {
    if (!confirm('Projekt wirklich löschen? Verknüpfte Tasks werden nicht gelöscht.')) return;
    NexusStore.deleteProject(projectId);
    NexusUI.showToast('Projekt gelöscht', 'success');
    this.render();
  },
  
  // Setup event listeners
  setupEventListeners() {
    if (this._listenersInitialized) return;
    this._listenersInitialized = true;
    
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#page-projects')) return;
      
      // Filter clicks
      const filterCard = e.target.closest('[data-filter]');
      if (filterCard) {
        this.filter = filterCard.dataset.filter;
        this.render();
        return;
      }
      
      // Sphere filter
      const sphereBtn = e.target.closest('[data-sphere]');
      if (sphereBtn) {
        this.sphereFilter = sphereBtn.dataset.sphere || null;
        this.render();
        return;
      }
      
      // Add project buttons
      if (e.target.closest('#add-project-btn') || e.target.closest('#add-project-btn-empty')) {
        this.showAddProjectModal();
        return;
      }
      
      // Project card actions
      const projectCard = e.target.closest('[data-project-id]');
      if (projectCard) {
        const projectId = projectCard.dataset.projectId;
        const action = e.target.closest('[data-action]')?.dataset.action;
        
        if (action === 'edit') {
          this.editProject(projectId);
        } else if (action === 'delete') {
          this.deleteProject(projectId);
        } else if (action === 'open') {
          this.openProject(projectId);
        }
        return;
      }
    });
    
    document.addEventListener('change', (e) => {
      if (e.target.id === 'project-sort') {
        this.sortBy = e.target.value;
        this.render();
      }
    });
  }
};

// Initialize on navigation
window.addEventListener('nexus:navigate', (e) => {
  if (e.detail.page === 'projects') {
    ProjectsModule.init();
  }
});

// Export
window.ProjectsModule = ProjectsModule;
