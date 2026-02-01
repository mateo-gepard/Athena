/* ═══════════════════════════════════════════════════════════════════════════════
   NEXUS ULTRA - Tasks Module
   Full task management view
   ═══════════════════════════════════════════════════════════════════════════════ */

const TasksModule = {
  
  view: 'list', // list | kanban | map
  filter: 'all', // all | today | week | overdue | completed
  sphereFilter: null,
  sortBy: 'dueDate', // dueDate | priority | createdAt
  _listenersInitialized: false,
  
  // Task Map state
  mapSelectedTasks: new Set(),
  mapPlacedTasks: [], // Cache for placed task positions
  
  // Initialize
  init() {
    this.render();
  },
  
  // Render the tasks page
  render() {
    const container = document.getElementById('page-tasks');
    if (!container) return;
    
    const tasks = this.getFilteredTasks();
    const stats = this.getStats();
    
    container.innerHTML = `
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-medium">Tasks</h2>
          <p class="text-secondary">${stats.pending} offen, ${stats.completed} erledigt</p>
        </div>
        
        <div class="flex items-center gap-3">
          <div class="tabs-pills">
            <button class="tab ${this.view === 'list' ? 'active' : ''}" data-view="list" title="Liste">
              ${NexusUI.icon('list', 16)}
            </button>
            <button class="tab ${this.view === 'kanban' ? 'active' : ''}" data-view="kanban" title="Kanban">
              ${NexusUI.icon('columns', 16)}
            </button>
            <button class="tab ${this.view === 'map' ? 'active' : ''}" data-view="map" title="Task Map">
              ${NexusUI.icon('target', 16)}
            </button>
          </div>
          <button class="btn btn-primary" id="add-task-btn">
            ${NexusUI.icon('plus', 16)}
            Neuer Task
          </button>
        </div>
      </div>
      
      <!-- Stats Bar -->
      <div class="grid gap-4 mb-6" style="grid-template-columns: repeat(5, 1fr);">
        <div class="stat-card clickable ${this.filter === 'all' ? 'active' : ''}" data-filter="all">
          <div class="stat-label">Alle</div>
          <div class="stat-value">${stats.total}</div>
        </div>
        <div class="stat-card clickable ${this.filter === 'today' ? 'active' : ''}" data-filter="today">
          <div class="stat-label">Heute</div>
          <div class="stat-value">${stats.today}</div>
        </div>
        <div class="stat-card clickable ${this.filter === 'week' ? 'active' : ''}" data-filter="week">
          <div class="stat-label">Diese Woche</div>
          <div class="stat-value">${stats.week}</div>
        </div>
        <div class="stat-card clickable ${this.filter === 'overdue' ? 'active' : ''}" data-filter="overdue" 
             style="${stats.overdue > 0 ? 'border-color: var(--color-critical);' : ''}">
          <div class="stat-label text-critical">Überfällig</div>
          <div class="stat-value text-critical">${stats.overdue}</div>
        </div>
        <div class="stat-card clickable ${this.filter === 'completed' ? 'active' : ''}" data-filter="completed">
          <div class="stat-label">Erledigt</div>
          <div class="stat-value text-success">${stats.completed}</div>
        </div>
      </div>
      
      <div class="layout-two-col">
        <div class="layout-two-col-main">
          <!-- Filters & Sort -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              ${this.renderSphereFilters()}
            </div>
            <div class="flex items-center gap-2">
              <span class="text-tertiary text-sm">Sortieren:</span>
              <select class="input input-sm" id="task-sort" style="width: 150px;">
                <option value="dueDate" ${this.sortBy === 'dueDate' ? 'selected' : ''}>Fälligkeitsdatum</option>
                <option value="priority" ${this.sortBy === 'priority' ? 'selected' : ''}>Priorität</option>
                <option value="createdAt" ${this.sortBy === 'createdAt' ? 'selected' : ''}>Erstelldatum</option>
              </select>
            </div>
          </div>
          
          <!-- Task List, Kanban or Map -->
          <div class="panel">
            <div class="panel-body ${this.view === 'kanban' ? 'p-0' : ''} ${this.view === 'map' ? 'p-0' : ''}">
              ${this.view === 'list' ? this.renderListView(tasks) : 
                this.view === 'kanban' ? this.renderKanbanView(tasks) :
                this.renderMapView(tasks)}
            </div>
          </div>
        </div>
        
        <div class="layout-two-col-aside">
          <!-- Quick Add -->
          <div class="panel mb-6">
            <div class="panel-header">
              <span class="panel-title">Quick Add</span>
            </div>
            <div class="panel-body">
              <input type="text" class="input mb-3" id="quick-task-input" 
                     placeholder="Task eingeben... (Enter zum Speichern)">
              <div class="text-xs text-tertiary">
                Tipp: Nutze <code>@projekt</code>, <code>!!</code> für Priorität
              </div>
            </div>
          </div>
          
          <!-- Sphere Stats -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Nach Sphäre</span>
            </div>
            <div class="panel-body">
              ${this.renderSphereStats()}
            </div>
          </div>
        </div>
      </div>
    `;
    
    NexusUI.refreshIcons();
  },
  
  // Get filtered tasks
  getFilteredTasks() {
    let tasks = NexusStore.getTasks();
    const today = new Date().toISOString().split('T')[0];
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndStr = weekEnd.toISOString().split('T')[0];
    
    // Filter by status
    switch (this.filter) {
      case 'today':
        // Show tasks scheduled for today OR with deadline today OR without any date
        tasks = tasks.filter(t => {
          if (t.status === 'completed') return false;
          const hasScheduledToday = t.scheduledDate?.startsWith(today);
          const hasDeadlineToday = t.deadline?.startsWith(today);
          const hasNoDate = !t.scheduledDate && !t.deadline;
          return hasScheduledToday || hasDeadlineToday || hasNoDate;
        });
        break;
      case 'week':
        tasks = tasks.filter(t => {
          if (t.status === 'completed') return false;
          const scheduledThisWeek = t.scheduledDate && t.scheduledDate <= weekEndStr;
          const deadlineThisWeek = t.deadline && t.deadline <= weekEndStr;
          return scheduledThisWeek || deadlineThisWeek;
        });
        break;
      case 'overdue':
        tasks = tasks.filter(t => {
          if (t.status === 'completed') return false;
          return t.deadline && t.deadline < today;
        });
        break;
      case 'completed':
        tasks = tasks.filter(t => t.status === 'completed');
        break;
      case 'no-date':
        tasks = tasks.filter(t => !t.scheduledDate && !t.deadline && t.status !== 'completed');
        break;
      case 'someday':
        tasks = tasks.filter(t => t.taskType === 'someday' && t.status !== 'completed');
        break;
      default:
        tasks = tasks.filter(t => t.status !== 'completed');
    }
    
    // Filter by sphere
    if (this.sphereFilter) {
      tasks = tasks.filter(t => t.spheres && t.spheres.includes(this.sphereFilter));
    }
    
    // Sort using effective priority (considers deadline urgency)
    tasks.sort((a, b) => {
      switch (this.sortBy) {
        case 'priority':
          // Use effective priority which boosts deadline tasks as they approach
          const scoreA = NexusStore.getEffectivePriority(a);
          const scoreB = NexusStore.getEffectivePriority(b);
          return scoreB - scoreA; // Higher priority first
        case 'createdAt':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'type':
          // Group by type: scheduled > deadline > someday
          const typeOrder = { scheduled: 0, deadline: 1, someday: 2 };
          return (typeOrder[a.taskType] || 2) - (typeOrder[b.taskType] || 2);
        default: // dueDate
          // Tasks with dates come first, sorted by earliest date (scheduledDate or deadline)
          const dateA = a.scheduledDate || a.deadline;
          const dateB = b.scheduledDate || b.deadline;
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return new Date(dateA) - new Date(dateB);
      }
    });
    
    return tasks;
  },
  
  // Get stats
  getStats() {
    const tasks = NexusStore.getTasks();
    const today = new Date().toISOString().split('T')[0];
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndStr = weekEnd.toISOString().split('T')[0];
    
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status !== 'completed').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      today: tasks.filter(t => t.dueDate?.startsWith(today) && t.status !== 'completed').length,
      week: tasks.filter(t => t.dueDate && t.dueDate <= weekEndStr && t.status !== 'completed').length,
      overdue: tasks.filter(t => t.dueDate && t.dueDate < today && t.status !== 'completed').length
    };
  },
  
  // Render sphere filters
  renderSphereFilters() {
    const spheres = NexusStore.state.spheres || [];

    return `
      <button class="btn btn-sm ${!this.sphereFilter ? 'btn-primary' : 'btn-ghost'}" 
              data-sphere-filter="">
        Alle
      </button>
      ${spheres.map(s => `
        <button class="btn btn-sm ${this.sphereFilter === s.id ? 'btn-primary' : 'btn-ghost'}" 
                data-sphere-filter="${s.id}">
          ${s.icon}
        </button>
      `).join('')}
    `;
  },
  
  // Render sphere stats
  renderSphereStats() {
    const tasks = NexusStore.getTasks().filter(t => t.status !== 'completed');
    const spheres = NexusStore.state.spheres || [];

    return spheres.map(s => {
      const count = tasks.filter(t => t.spheres && t.spheres.includes(s.id)).length;
      const percentage = tasks.length > 0 ? Math.round((count / tasks.length) * 100) : 0;
      const color = s.color || NexusUI.getSphereColor(s.id) || `var(--color-sphere-${s.id})`;

      return `
        <div class="flex items-center gap-3 mb-3 cursor-pointer hover:bg-surface-2 p-2 rounded-md"
             data-sphere-filter="${s.id}">
          <div class="w-3 h-3 rounded-full" style="background: ${color}"></div>
          <span class="flex-1">${s.name || s.label || s.id}</span>
          <span class="mono text-sm">${count}</span>
        </div>
      `;
    }).join('');
  },
  
  // Render list view
  renderListView(tasks) {
    if (tasks.length === 0) {
      return `
        <div class="empty-state p-8">
          <div class="text-4xl mb-4">✅</div>
          <h3 class="text-lg mb-2">Keine Tasks</h3>
          <p class="text-secondary">Erstelle einen neuen Task oder ändere den Filter</p>
        </div>
      `;
    }
    
    return `
      <div class="task-list">
        ${tasks.map(task => this.renderTaskItem(task)).join('')}
      </div>
    `;
  },
  
  // Render single task item
  renderTaskItem(task) {
    const isOverdue = task.deadline && task.deadline < new Date().toISOString().split('T')[0] && task.status !== 'completed';
    const sphere = task.spheres && task.spheres[0] ? task.spheres[0] : null;
    const sphereColor = sphere ? NexusUI.getSphereColor(sphere) : null;
    const priorityScore = task.priorityScore || 5;
    const priorityClass = priorityScore >= 8 ? 'critical' : priorityScore >= 6 ? 'high' : priorityScore >= 4 ? 'medium' : 'low';
    
    return `
      <div class="task-item ${task.status === 'completed' ? 'completed' : ''}" data-task-id="${task.id}">
        <div class="flex items-center gap-3">
          <button class="task-checkbox ${task.status === 'completed' ? 'checked' : ''}" 
                  data-action="toggle-complete">
            ${task.status === 'completed' ? '✓' : ''}
          </button>
          
          ${sphere ? `
            <div class="sphere-indicator" style="background: ${sphereColor}"></div>
          ` : ''}
          
          <div class="flex-1 min-w-0">
            <div class="task-title ${task.status === 'completed' ? 'line-through text-tertiary' : ''}">
              ${task.title}
            </div>
            <div class="flex items-center gap-2 mt-2">
              <span class="badge badge-${priorityClass}">${priorityScore}/10</span>
              ${sphere ? `<span class="badge badge-${sphere}">${sphere}</span>` : ''}
              ${task.deadline ? `
                <span class="badge ${isOverdue ? 'badge-overdue' : ''}">
                  📅 ${NexusUI.formatDate(new Date(task.deadline))}
                </span>
              ` : ''}
              ${task.timeEstimate ? `<span class="badge">⏱️ ${task.timeEstimate}min</span>` : ''}
              ${task.projectId ? `<span class="badge">📁 ${this.getProjectName(task.projectId)}</span>` : ''}
            </div>
          </div>
          
          <div class="task-actions flex items-center gap-1">
            <button class="btn-icon-sm" data-action="edit" title="Bearbeiten">
              ${NexusUI.icon('edit-2', 14)}
            </button>
            <button class="btn-icon-sm" data-action="delete" title="Löschen">
              ${NexusUI.icon('trash-2', 14)}
            </button>
          </div>
        </div>
      </div>
    `;
  },
  
  // Render kanban view
  renderKanbanView(tasks) {
    const allTasks = NexusStore.getTasks();
    
    const columns = [
      { id: 'todo', label: 'To Do', tasks: allTasks.filter(t => t.status === 'todo' || !t.status) },
      { id: 'in-progress', label: 'In Progress', tasks: allTasks.filter(t => t.status === 'in-progress') },
      { id: 'completed', label: 'Done', tasks: allTasks.filter(t => t.status === 'completed') }
    ];
    
    return `
      <div class="kanban-board">
        ${columns.map(col => `
          <div class="kanban-column" data-status="${col.id}">
            <div class="kanban-column-header">
              <span class="kanban-column-title">${col.label}</span>
              <span class="badge">${col.tasks.length}</span>
            </div>
            <div class="kanban-column-body">
              ${col.tasks.map(task => `
                <div class="kanban-card" data-task-id="${task.id}">
                  ${task.sphere ? `
                    <div class="kanban-card-sphere" style="background: var(--color-sphere-${task.sphere})"></div>
                  ` : ''}
                  <div class="kanban-card-title">${task.title}</div>
                  ${task.dueDate ? `
                    <div class="kanban-card-meta">
                      📅 ${NexusUI.formatDate(new Date(task.dueDate))}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TASK MAP VIEW - Visual Sphere-based Task Representation
  // ═══════════════════════════════════════════════════════════════════════════
  
  renderMapView(tasks) {
    // Filter out completed tasks for the map
    const activeTasks = tasks.filter(t => t.status !== 'completed');
    
    // Calculate positions for all tasks
    this.mapPlacedTasks = this.calculateTaskPositions(activeTasks);
    
    const hasSelectedTasks = this.mapSelectedTasks.size > 0;
    
    return `
      <div class="task-map-container" id="task-map-container">
        <!-- Action Bar -->
        <div class="task-map-actions">
          <div class="task-map-legend">
            <div class="legend-item"><span class="legend-dot" style="background: var(--color-sphere-geschaeft)"></span> Geschäft</div>
            <div class="legend-item"><span class="legend-dot" style="background: var(--color-sphere-schule)"></span> Schule</div>
            <div class="legend-item"><span class="legend-dot" style="background: var(--color-sphere-sport)"></span> Sport</div>
            <div class="legend-item"><span class="legend-dot" style="background: var(--color-sphere-projekte)"></span> Projekte</div>
            <div class="legend-item"><span class="legend-dot" style="background: var(--color-sphere-freizeit)"></span> Freizeit</div>
          </div>
          ${hasSelectedTasks ? `
            <div class="task-map-selected-actions">
              <span class="text-sm text-secondary">${this.mapSelectedTasks.size} ausgewählt</span>
              <button class="btn btn-sm btn-ghost" data-map-action="clear-selection">
                ${NexusUI.icon('x', 14)} Auswahl aufheben
              </button>
              <div class="task-map-block-selector">
                <button class="btn btn-sm btn-primary" data-map-action="add-to-morning">
                  🌅 Morgen
                </button>
                <button class="btn btn-sm btn-primary" data-map-action="add-to-afternoon">
                  ☀️ Nachmittag
                </button>
                <button class="btn btn-sm btn-primary" data-map-action="add-to-evening">
                  🌙 Abend
                </button>
              </div>
            </div>
          ` : `
            <div class="task-map-hint">
              <span class="text-sm text-tertiary">Klicke auf Tasks um sie für deinen Tag auszuwählen</span>
            </div>
          `}
        </div>
        
        <!-- SVG Map -->
        <svg class="task-map-svg" id="task-map-svg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
          <defs>
            <!-- Gradients for spheres -->
            <radialGradient id="grad-freizeit" cx="50%" cy="50%" r="50%">
              <stop offset="0%" style="stop-color: #6B6862; stop-opacity: 0.1"/>
              <stop offset="100%" style="stop-color: #6B6862; stop-opacity: 0.05"/>
            </radialGradient>
            <radialGradient id="grad-geschaeft" cx="50%" cy="50%" r="50%">
              <stop offset="0%" style="stop-color: #4A7C94; stop-opacity: 0.25"/>
              <stop offset="100%" style="stop-color: #4A7C94; stop-opacity: 0.1"/>
            </radialGradient>
            <radialGradient id="grad-schule" cx="50%" cy="50%" r="50%">
              <stop offset="0%" style="stop-color: #94854A; stop-opacity: 0.25"/>
              <stop offset="100%" style="stop-color: #94854A; stop-opacity: 0.1"/>
            </radialGradient>
            <radialGradient id="grad-sport" cx="50%" cy="50%" r="50%">
              <stop offset="0%" style="stop-color: #4A946A; stop-opacity: 0.25"/>
              <stop offset="100%" style="stop-color: #4A946A; stop-opacity: 0.1"/>
            </radialGradient>
            <radialGradient id="grad-projekte" cx="50%" cy="50%" r="50%">
              <stop offset="0%" style="stop-color: #7C6A94; stop-opacity: 0.25"/>
              <stop offset="100%" style="stop-color: #7C6A94; stop-opacity: 0.1"/>
            </radialGradient>
            
            <!-- Glow filter for selected tasks -->
            <filter id="glow-selected" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          <!-- Outer Freizeit Circle -->
          <circle cx="400" cy="300" r="280" fill="url(#grad-freizeit)" stroke="#6B6862" stroke-width="2" stroke-opacity="0.3"/>
          <text x="400" y="35" text-anchor="middle" class="sphere-label freizeit">⚪ Freizeit</text>
          
          <!-- Inner Sphere Circles (Venn Diagram style) -->
          <!-- Geschäft (Top-Left) -->
          <circle cx="310" cy="230" r="120" fill="url(#grad-geschaeft)" stroke="#4A7C94" stroke-width="2" stroke-opacity="0.5" class="sphere-circle" data-sphere="geschaeft"/>
          <text x="250" y="170" text-anchor="middle" class="sphere-label geschaeft">💼 Geschäft</text>
          
          <!-- Schule (Top-Right) -->
          <circle cx="490" cy="230" r="120" fill="url(#grad-schule)" stroke="#94854A" stroke-width="2" stroke-opacity="0.5" class="sphere-circle" data-sphere="schule"/>
          <text x="550" y="170" text-anchor="middle" class="sphere-label schule">📚 Schule</text>
          
          <!-- Sport (Bottom-Left) -->
          <circle cx="310" cy="370" r="120" fill="url(#grad-sport)" stroke="#4A946A" stroke-width="2" stroke-opacity="0.5" class="sphere-circle" data-sphere="sport"/>
          <text x="250" y="450" text-anchor="middle" class="sphere-label sport">🏃 Sport</text>
          
          <!-- Projekte (Bottom-Right) -->
          <circle cx="490" cy="370" r="120" fill="url(#grad-projekte)" stroke="#7C6A94" stroke-width="2" stroke-opacity="0.5" class="sphere-circle" data-sphere="projekte"/>
          <text x="550" y="450" text-anchor="middle" class="sphere-label projekte">🚀 Projekte</text>
          
          <!-- Task Nodes -->
          <g id="task-nodes">
            ${this.mapPlacedTasks.map(t => this.renderMapTaskNode(t)).join('')}
          </g>
        </svg>
        
        <!-- Task count info -->
        <div class="task-map-info">
          <span class="text-sm text-tertiary">${activeTasks.length} Tasks visualisiert</span>
        </div>
      </div>
    `;
  },
  
  // Calculate positions for tasks with overlap detection
  calculateTaskPositions(tasks) {
    const sphereCenters = {
      geschaeft: { x: 310, y: 230 },
      schule: { x: 490, y: 230 },
      sport: { x: 310, y: 370 },
      projekte: { x: 490, y: 370 },
      freizeit: { x: 400, y: 300 }
    };
    
    const sphereRadius = 120;
    const outerRadius = 280;
    const placedPositions = [];
    
    return tasks.map((task, index) => {
      const sphere = task.spheres && task.spheres[0] ? task.spheres[0] : 'freizeit';
      const priority = NexusStore.getEffectivePriority(task);
      
      // Task circle size based on priority (8-24px radius)
      const taskRadius = 8 + (priority / 10) * 16;
      
      // Get sphere center
      let center = sphereCenters[sphere] || sphereCenters.freizeit;
      let maxRadius = sphere === 'freizeit' ? outerRadius - 30 : sphereRadius - 10;
      
      // For freizeit, place outside inner circles
      if (sphere === 'freizeit') {
        center = { x: 400, y: 300 };
        // Place in outer ring
        maxRadius = outerRadius - 20;
      }
      
      // Find non-overlapping position
      const pos = this.findNonOverlappingPosition(center, maxRadius, taskRadius, placedPositions, sphere);
      
      placedPositions.push({
        x: pos.x,
        y: pos.y,
        radius: taskRadius
      });
      
      return {
        ...task,
        mapX: pos.x,
        mapY: pos.y,
        mapRadius: taskRadius,
        sphere,
        priority
      };
    });
  },
  
  // Find a position that doesn't overlap with existing tasks
  findNonOverlappingPosition(center, maxRadius, taskRadius, existingPositions, sphere) {
    const sphereCenters = {
      geschaeft: { x: 310, y: 230 },
      schule: { x: 490, y: 230 },
      sport: { x: 310, y: 370 },
      projekte: { x: 490, y: 370 }
    };
    
    // For freizeit, we need to avoid the inner circles
    const innerCircles = Object.values(sphereCenters);
    const innerRadius = 120;
    
    // Try spiral placement from center outward
    const maxAttempts = 100;
    let bestPos = { x: center.x, y: center.y };
    let spiralAngle = Math.random() * Math.PI * 2; // Random start angle
    let spiralRadius = 20;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Spiral outward
      const x = center.x + Math.cos(spiralAngle) * spiralRadius;
      const y = center.y + Math.sin(spiralAngle) * spiralRadius;
      
      // Check bounds
      const distFromCenter = Math.sqrt((x - center.x) ** 2 + (y - center.y) ** 2);
      if (distFromCenter > maxRadius - taskRadius) {
        spiralAngle += 0.5;
        spiralRadius = 20;
        continue;
      }
      
      // For freizeit tasks, check we're outside inner circles
      if (sphere === 'freizeit') {
        let insideInner = false;
        for (const ic of innerCircles) {
          const dist = Math.sqrt((x - ic.x) ** 2 + (y - ic.y) ** 2);
          if (dist < innerRadius + taskRadius + 15) {
            insideInner = true;
            break;
          }
        }
        if (insideInner) {
          spiralAngle += 0.3;
          spiralRadius += 5;
          continue;
        }
      }
      
      // Check overlap with existing tasks
      let hasOverlap = false;
      for (const pos of existingPositions) {
        const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
        if (dist < taskRadius + pos.radius + 5) { // 5px padding
          hasOverlap = true;
          break;
        }
      }
      
      if (!hasOverlap) {
        return { x, y };
      }
      
      spiralAngle += 0.4;
      spiralRadius += 3;
    }
    
    // Fallback: return slightly offset position
    return {
      x: center.x + (Math.random() - 0.5) * maxRadius * 0.5,
      y: center.y + (Math.random() - 0.5) * maxRadius * 0.5
    };
  },
  
  // Render a single task node in the map
  renderMapTaskNode(task) {
    const isSelected = this.mapSelectedTasks.has(task.id);
    const sphereColors = {
      geschaeft: '#4A7C94',
      schule: '#94854A',
      sport: '#4A946A',
      projekte: '#7C6A94',
      freizeit: '#6B6862'
    };
    
    const color = sphereColors[task.sphere] || sphereColors.freizeit;
    const priorityClass = task.priority >= 8 ? 'critical' : task.priority >= 6 ? 'high' : '';
    
    // Truncate title for display
    const displayTitle = task.title.length > 15 ? task.title.substring(0, 12) + '...' : task.title;
    
    return `
      <g class="task-node ${isSelected ? 'selected' : ''} ${priorityClass}" 
         data-task-id="${task.id}"
         data-map-task="true"
         transform="translate(${task.mapX}, ${task.mapY})"
         style="cursor: pointer;">
        <!-- Task circle -->
        <circle r="${task.mapRadius}" 
                fill="${color}" 
                fill-opacity="${isSelected ? 1 : 0.8}"
                stroke="${isSelected ? '#fff' : color}"
                stroke-width="${isSelected ? 3 : 1}"
                ${isSelected ? 'filter="url(#glow-selected)"' : ''}/>
        
        <!-- Priority indicator for high priority -->
        ${task.priority >= 7 ? `
          <circle r="${task.mapRadius + 4}" 
                  fill="none" 
                  stroke="${task.priority >= 9 ? '#ef4444' : '#fbbf24'}"
                  stroke-width="2"
                  stroke-dasharray="4 2"
                  opacity="0.7"/>
        ` : ''}
        
        <!-- Task title (shown for larger nodes) -->
        ${task.mapRadius >= 14 ? `
          <text y="4" text-anchor="middle" 
                class="task-node-label"
                fill="#fff"
                font-size="${Math.max(9, task.mapRadius * 0.6)}">
            ${displayTitle}
          </text>
        ` : ''}
        
        <!-- Tooltip trigger area -->
        <title>${task.title} (${task.priority}/10)</title>
      </g>
    `;
  },
  
  // Add selected tasks to Command Center
  addSelectedToCommandCenter(block) {
    if (this.mapSelectedTasks.size === 0) return;
    
    const today = new Date().toISOString().split('T')[0];
    let addedCount = 0;
    
    this.mapSelectedTasks.forEach(taskId => {
      const task = NexusStore.getTaskById(taskId);
      if (task) {
        // Update task with command center block and today's date
        NexusStore.updateTask(taskId, {
          commandCenterBlock: block,
          scheduledDate: today
        });
        addedCount++;
      }
    });
    
    // Clear selection
    this.mapSelectedTasks.clear();
    
    NexusUI.showToast({
      type: 'success',
      title: 'Tasks hinzugefügt!',
      message: `${addedCount} Task(s) zu "${block === 'morning' ? 'Morgen' : block === 'afternoon' ? 'Nachmittag' : 'Abend'}" hinzugefügt`
    });
    
    this.render();
  },
  
  // Toggle task selection in map
  toggleMapTaskSelection(taskId) {
    if (this.mapSelectedTasks.has(taskId)) {
      this.mapSelectedTasks.delete(taskId);
    } else {
      this.mapSelectedTasks.add(taskId);
    }
    this.render();
  },
  
  // Clear map selection
  clearMapSelection() {
    this.mapSelectedTasks.clear();
    this.render();
  },
  
  // Get project name
  getProjectName(projectId) {
    const project = NexusStore.getProjects().find(p => p.id === projectId);
    return project?.name || 'Unbekannt';
  },
  
  // Add task
  addTask(title) {
    if (!title.trim()) return;
    
    const parsed = SmartParser.parse(title);
    SmartParser.createEntity(parsed);
    
    NexusUI.showToast('Task erstellt!', 'success');
    this.render();
  },
  
  // Toggle task complete
  toggleComplete(taskId) {
    const task = NexusStore.getTasks().find(t => t.id === taskId);
    if (!task) return;
    
    if (task.status === 'completed') {
      NexusStore.updateTask(taskId, { status: 'todo', completedAt: null });
    } else {
      NexusStore.completeTask(taskId);
    }
    
    this.render();
  },
  
  // Delete task
  deleteTask(taskId) {
    if (!confirm('Task wirklich löschen?')) return;
    NexusStore.deleteTask(taskId);
    NexusUI.showToast('Task gelöscht', 'success');
    this.render();
  },
  
  // Edit task
  editTask(taskId) {
    const task = NexusStore.getTasks().find(t => t.id === taskId);
    if (!task) return;
    
    const content = `
      <div class="p-4">
        <div class="mb-4">
          <label class="input-label">Titel</label>
          <input type="text" class="input" id="edit-task-title" value="${task.title}">
        </div>
        <div class="mb-4">
          <label class="input-label">Beschreibung</label>
          <textarea class="input" id="edit-task-description" rows="3">${task.description || ''}</textarea>
        </div>
        <div class="grid gap-4" style="grid-template-columns: 1fr 1fr;">
          <div>
            <label class="input-label">Fällig am</label>
            <input type="date" class="input" id="edit-task-due" value="${task.dueDate || ''}">
          </div>
          <div>
            <label class="input-label">Geschätzte Zeit (min)</label>
            <input type="number" class="input" id="edit-task-time" value="${task.estimatedTime || ''}">
          </div>
        </div>
        <div class="grid gap-4 mt-4" style="grid-template-columns: 1fr 1fr;">
          <div>
            <label class="input-label">Priorität</label>
            <select class="input" id="edit-task-priority">
              <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Niedrig</option>
              <option value="normal" ${task.priority === 'normal' ? 'selected' : ''}>Normal</option>
              <option value="high" ${task.priority === 'high' ? 'selected' : ''}>Hoch</option>
              <option value="critical" ${task.priority === 'critical' ? 'selected' : ''}>Kritisch</option>
            </select>
          </div>
          <div>
            <label class="input-label">Sphäre</label>
            <select class="input" id="edit-task-sphere">
              <option value="">Keine</option>
              <option value="geschaeft" ${task.sphere === 'geschaeft' ? 'selected' : ''}>💼 Geschäft</option>
              <option value="projekte" ${task.sphere === 'projekte' ? 'selected' : ''}>🚀 Projekte</option>
              <option value="schule" ${task.sphere === 'schule' ? 'selected' : ''}>📚 Schule</option>
              <option value="sport" ${task.sphere === 'sport' ? 'selected' : ''}>💪 Sport</option>
              <option value="freizeit" ${task.sphere === 'freizeit' ? 'selected' : ''}>🎮 Freizeit</option>
            </select>
          </div>
        </div>
        <div class="flex gap-2 justify-end mt-6">
          <button class="btn btn-secondary" onclick="NexusUI.closeModal()">Abbrechen</button>
          <button class="btn btn-primary" onclick="TasksModule.saveTask('${taskId}')">Speichern</button>
        </div>
      </div>
    `;
    
    NexusUI.openModal('Task bearbeiten', content);
  },
  
  // Save task
  saveTask(taskId) {
    const title = document.getElementById('edit-task-title')?.value;
    const description = document.getElementById('edit-task-description')?.value;
    const dueDate = document.getElementById('edit-task-due')?.value;
    const estimatedTime = parseInt(document.getElementById('edit-task-time')?.value) || null;
    const priority = document.getElementById('edit-task-priority')?.value;
    const sphere = document.getElementById('edit-task-sphere')?.value || null;
    
    NexusStore.updateTask(taskId, { title, description, dueDate, estimatedTime, priority, sphere });
    NexusUI.closeModal();
    NexusUI.showToast('Task gespeichert!', 'success');
    this.render();
  },
  
  // Show add task modal
  showAddTaskModal() {
    const content = `
      <div class="p-4">
        <div class="mb-4">
          <label class="input-label">Titel</label>
          <input type="text" class="input" id="new-task-title" placeholder="Was muss erledigt werden?">
        </div>
        <div class="mb-4">
          <label class="input-label">Beschreibung</label>
          <textarea class="input" id="new-task-description" rows="3" placeholder="Optional"></textarea>
        </div>
        <div class="grid gap-4" style="grid-template-columns: 1fr 1fr;">
          <div>
            <label class="input-label">Fällig am</label>
            <input type="date" class="input" id="new-task-due">
          </div>
          <div>
            <label class="input-label">Geschätzte Zeit (min)</label>
            <input type="number" class="input" id="new-task-time" placeholder="30">
          </div>
        </div>
        <div class="grid gap-4 mt-4" style="grid-template-columns: 1fr 1fr;">
          <div>
            <label class="input-label">Priorität</label>
            <select class="input" id="new-task-priority">
              <option value="normal">Normal</option>
              <option value="low">Niedrig</option>
              <option value="high">Hoch</option>
              <option value="critical">Kritisch</option>
            </select>
          </div>
          <div>
            <label class="input-label">Sphäre</label>
            <select class="input" id="new-task-sphere">
              <option value="">Keine</option>
              <option value="geschaeft">💼 Geschäft</option>
              <option value="projekte">🚀 Projekte</option>
              <option value="schule">📚 Schule</option>
              <option value="sport">💪 Sport</option>
              <option value="freizeit">🎮 Freizeit</option>
            </select>
          </div>
        </div>
        <div class="flex gap-2 justify-end mt-6">
          <button class="btn btn-secondary" onclick="NexusUI.closeModal()">Abbrechen</button>
          <button class="btn btn-primary" onclick="TasksModule.createTask()">Erstellen</button>
        </div>
      </div>
    `;
    
    NexusUI.openModal('Neuer Task', content);
  },
  
  // Create task from modal
  createTask() {
    const title = document.getElementById('new-task-title')?.value;
    if (!title) {
      NexusUI.showToast('Titel ist erforderlich', 'error');
      return;
    }
    
    const task = {
      title,
      description: document.getElementById('new-task-description')?.value || '',
      dueDate: document.getElementById('new-task-due')?.value || null,
      estimatedTime: parseInt(document.getElementById('new-task-time')?.value) || null,
      priority: document.getElementById('new-task-priority')?.value || 'normal',
      sphere: document.getElementById('new-task-sphere')?.value || null
    };
    
    NexusStore.addTask(task);
    NexusUI.closeModal();
    NexusUI.showToast('Task erstellt!', 'success');
    this.render();
  },
  
  // Setup event listeners
  setupEventListeners() {
    if (this._listenersInitialized) return;
    this._listenersInitialized = true;
    
    document.addEventListener('click', (e) => {
      // Debug: log all clicks
      console.log('🖱️ Tasks click:', e.target.tagName, e.target.className, e.target.id);
      
      // Task Map actions
      const mapAction = e.target.closest('[data-map-action]');
      if (mapAction && e.target.closest('#page-tasks')) {
        const action = mapAction.dataset.mapAction;
        console.log('  → Map action:', action);
        
        switch (action) {
          case 'clear-selection':
            this.clearMapSelection();
            break;
          case 'add-to-morning':
            this.addSelectedToCommandCenter('morning');
            break;
          case 'add-to-afternoon':
            this.addSelectedToCommandCenter('afternoon');
            break;
          case 'add-to-evening':
            this.addSelectedToCommandCenter('evening');
            break;
        }
        return;
      }
      
      // Task Map node click
      const taskNode = e.target.closest('[data-map-task]');
      if (taskNode && e.target.closest('#page-tasks')) {
        const taskId = taskNode.dataset.taskId;
        console.log('  → Map task clicked:', taskId);
        this.toggleMapTaskSelection(taskId);
        return;
      }
      
      // View toggle
      const viewTab = e.target.closest('[data-view]');
      if (viewTab && e.target.closest('#page-tasks')) {
        console.log('  → View toggle');
        this.view = viewTab.dataset.view;
        this.render();
        return;
      }
      
      // Filter by stats
      const statCard = e.target.closest('.stat-card.clickable');
      if (statCard && statCard.dataset.filter && e.target.closest('#page-tasks')) {
        console.log('  → Filter toggle');
        this.filter = statCard.dataset.filter;
        this.render();
        return;
      }
      
      // Sphere filter
      const sphereBtn = e.target.closest('[data-sphere-filter]');
      if (sphereBtn && e.target.closest('#page-tasks')) {
        console.log('  → Sphere filter');
        this.sphereFilter = sphereBtn.dataset.sphereFilter || null;
        this.render();
        return;
      }
      
      // Add task button
      if (e.target.closest('#add-task-btn')) {
        console.log('  → Add task button clicked!');
        this.showAddTaskModal();
        return;
      }
      
      // Task actions
      const taskItem = e.target.closest('.task-item');
      if (taskItem) {
        const taskId = taskItem.dataset.taskId;
        const action = e.target.closest('[data-action]')?.dataset.action;
        console.log('  → Task action:', action, 'on', taskId);
        
        if (action === 'toggle-complete') {
          this.toggleComplete(taskId);
        } else if (action === 'edit') {
          this.editTask(taskId);
        } else if (action === 'delete') {
          this.deleteTask(taskId);
        }
        return;
      }
    });
    
    // Sort change
    document.addEventListener('change', (e) => {
      if (e.target.id === 'task-sort') {
        this.sortBy = e.target.value;
        this.render();
      }
    });
    
    // Quick add
    document.addEventListener('keydown', (e) => {
      if (e.target.id === 'quick-task-input' && e.key === 'Enter') {
        this.addTask(e.target.value);
        e.target.value = '';
      }
    });
  }
};

// Initialize on navigation
window.addEventListener('nexus:navigate', (e) => {
  if (e.detail.page === 'tasks') {
    TasksModule.init();
  }
});

// Export
window.TasksModule = TasksModule;
