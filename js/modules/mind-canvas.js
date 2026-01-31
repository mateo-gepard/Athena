/* ═══════════════════════════════════════════════════════════════════════════════
   NEXUS ULTRA - Mind Canvas Module
   Bidirektionales Notiz- und Wissens-System
   ═══════════════════════════════════════════════════════════════════════════════ */

const MindCanvas = {
  
  notes: [],
  selectedNote: null,
  canvasOffset: { x: 0, y: 0 },
  isDraggingNote: false,
  isDraggingCanvas: false,
  draggedNote: null,
  dragStart: { x: 0, y: 0 },
  dragOffset: { x: 0, y: 0 },
  view: 'canvas', // canvas | list | graph
  
  // Initialize
  init() {
    this.notes = NexusStore.getNotes();
    this.render();
    this.setupEventListeners();
  },
  
  // Render the mind canvas
  render() {
    const container = document.getElementById('page-mind-canvas');
    if (!container) return;
    
    container.innerHTML = `
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-4">
          <h2 class="text-xl font-medium">Mind Canvas</h2>
          <span class="badge">${this.notes.length} Notizen</span>
        </div>
        
        <div class="flex items-center gap-3">
          <div class="input-group" style="width: 300px;">
            <span class="input-icon">${NexusUI.icon('search', 16)}</span>
            <input type="text" class="input" id="mc-search" placeholder="Suchen... (auch [[Links]])">
          </div>
          
          <div class="tabs-pills">
            <button class="tab ${this.view === 'canvas' ? 'active' : ''}" data-view="canvas">
              ${NexusUI.icon('layout', 16)}
            </button>
            <button class="tab ${this.view === 'list' ? 'active' : ''}" data-view="list">
              ${NexusUI.icon('list', 16)}
            </button>
            <button class="tab ${this.view === 'graph' ? 'active' : ''}" data-view="graph">
              ${NexusUI.icon('share-2', 16)}
            </button>
          </div>
          
          <button class="btn btn-primary" id="mc-new-note">
            ${NexusUI.icon('plus', 16)}
            Neue Notiz
          </button>
        </div>
      </div>
      
      <div class="layout-two-col">
        <div class="layout-two-col-main">
          ${this.view === 'canvas' ? this.renderCanvasView() : 
            this.view === 'list' ? this.renderListView() : 
            this.renderGraphView()}
        </div>
        
        <div class="layout-two-col-aside">
          ${this.renderNoteSidebar()}
        </div>
      </div>
    `;
    
    NexusUI.refreshIcons();
  },
  
  // Render canvas view
  renderCanvasView() {
    if (this.notes.length === 0) {
      return `
        <div class="panel canvas-container empty-canvas">
          <div class="text-center p-12">
            <div class="text-4xl mb-4">💭</div>
            <h3 class="text-lg mb-2">Dein Mind Canvas ist leer</h3>
            <p class="text-secondary mb-4">Erstelle deine erste Notiz oder Idee</p>
            <button class="btn btn-primary" id="mc-first-note">
              ${NexusUI.icon('plus', 16)}
              Erste Notiz erstellen
            </button>
          </div>
        </div>
      `;
    }
    
    return `
      <div class="panel canvas-container">
        <div class="canvas-toolbar">
          <div class="flex items-center gap-2">
            <button class="btn btn-sm btn-ghost" title="Zoom In">
              ${NexusUI.icon('zoom-in', 14)}
            </button>
            <button class="btn btn-sm btn-ghost" title="Zoom Out">
              ${NexusUI.icon('zoom-out', 14)}
            </button>
            <button class="btn btn-sm btn-ghost" title="Fit View">
              ${NexusUI.icon('maximize', 14)}
            </button>
          </div>
          <div class="flex items-center gap-2">
            <button class="btn btn-sm btn-ghost" title="Verbindungen anzeigen">
              ${NexusUI.icon('link', 14)}
            </button>
          </div>
        </div>
        
        <div class="canvas-area" id="canvas-area" 
             style="transform: translate(${this.canvasOffset.x}px, ${this.canvasOffset.y}px);">
          ${this.notes.map(note => this.renderCanvasNote(note)).join('')}
          ${this.renderConnections()}
        </div>
      </div>
    `;
  },
  
  // Render single canvas note
  renderCanvasNote(note) {
    const x = note.position?.x || Math.random() * 600;
    const y = note.position?.y || Math.random() * 400;
    const width = note.position?.width || 280;
    
    const typeIcon = note.type === 'idea' ? '💡' : 
                     note.type === 'research' ? '🔬' :
                     note.type === 'decision' ? '⚖️' :
                     note.type === 'question' ? '❓' : '📝';
    
    return `
      <div class="canvas-note ${this.selectedNote?.id === note.id ? 'selected' : ''}" 
           data-note-id="${note.id}"
           style="left: ${x}px; top: ${y}px; width: ${width}px;">
        <div class="canvas-note-header">
          <span class="canvas-note-icon">${typeIcon}</span>
          <span class="canvas-note-type">${this.getNoteTypeLabel(note.type)}</span>
          ${note.sphere ? `
            <span class="sphere-dot" style="background: var(--color-sphere-${note.sphere})"></span>
          ` : ''}
          <div class="canvas-note-actions">
            <button class="btn-icon-sm" data-action="edit-note" title="Bearbeiten">
              ${NexusUI.icon('edit-2', 12)}
            </button>
            <button class="btn-icon-sm" data-action="delete-note" title="Löschen">
              ${NexusUI.icon('trash-2', 12)}
            </button>
          </div>
        </div>
        <div class="canvas-note-content">
          ${this.formatNoteContent(note.content)}
        </div>
        ${note.links?.length > 0 ? `
          <div class="canvas-note-links">
            ${note.links.slice(0, 3).map(linkId => {
              const linkedNote = this.notes.find(n => n.id === linkId);
              return linkedNote ? `
                <span class="note-link-tag" data-link-id="${linkId}">
                  [[${linkedNote.content.substring(0, 15)}...]]
                </span>
              ` : '';
            }).join('')}
            ${note.links.length > 3 ? `<span class="text-tertiary text-xs">+${note.links.length - 3}</span>` : ''}
          </div>
        ` : ''}
        <div class="canvas-note-footer">
          <span class="text-tertiary text-xs">${NexusUI.formatDate(new Date(note.createdAt))}</span>
        </div>
        <div class="canvas-note-resize-handle"></div>
      </div>
    `;
  },
  
  // Render connections between notes
  renderConnections() {
    // SVG for drawing connections
    return `
      <svg class="canvas-connections" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;">
        ${this.notes.filter(n => n.links?.length > 0).map(note => {
          const noteX = (note.position?.x || 100) + 140;
          const noteY = (note.position?.y || 100) + 50;
          
          return note.links.map(linkId => {
            const linkedNote = this.notes.find(n => n.id === linkId);
            if (!linkedNote) return '';
            
            const linkedX = (linkedNote.position?.x || 100) + 140;
            const linkedY = (linkedNote.position?.y || 100) + 50;
            
            // Curved path
            const midX = (noteX + linkedX) / 2;
            const midY = (noteY + linkedY) / 2 - 30;
            
            return `
              <path d="M ${noteX} ${noteY} Q ${midX} ${midY} ${linkedX} ${linkedY}" 
                    class="connection-line" 
                    stroke="var(--color-accent)" 
                    stroke-width="2" 
                    stroke-opacity="0.3"
                    fill="none" />
            `;
          }).join('');
        }).join('')}
      </svg>
    `;
  },
  
  // Render list view
  renderListView() {
    if (this.notes.length === 0) {
      return NexusUI.renderEmptyState('file-text', 'Keine Notizen', 'Erstelle deine erste Notiz!');
    }
    
    // Group by type
    const grouped = {
      idea: this.notes.filter(n => n.type === 'idea'),
      note: this.notes.filter(n => n.type === 'note'),
      research: this.notes.filter(n => n.type === 'research'),
      decision: this.notes.filter(n => n.type === 'decision'),
      question: this.notes.filter(n => n.type === 'question')
    };
    
    return `
      <div class="panel">
        <div class="panel-body">
          ${Object.entries(grouped).filter(([_, notes]) => notes.length > 0).map(([type, notes]) => `
            <div class="mb-6">
              <div class="text-caption mb-3">${this.getNoteTypeEmoji(type)} ${this.getNoteTypeLabel(type).toUpperCase()} (${notes.length})</div>
              <div class="content-stack gap-2">
                ${notes.map(note => `
                  <div class="note-list-item ${this.selectedNote?.id === note.id ? 'selected' : ''}" 
                       data-note-id="${note.id}">
                    <div class="flex items-start gap-3">
                      ${note.sphere ? `
                        <div class="sphere-dot mt-2" style="background: var(--color-sphere-${note.sphere})"></div>
                      ` : ''}
                      <div class="flex-1 min-w-0">
                        <div class="note-content-preview">${this.formatNoteContent(note.content)}</div>
                        <div class="flex items-center gap-3 mt-2 text-xs text-tertiary">
                          <span>${NexusUI.formatDate(new Date(note.createdAt))}</span>
                          ${note.links?.length > 0 ? `
                            <span>🔗 ${note.links.length} Links</span>
                          ` : ''}
                        </div>
                      </div>
                      <button class="btn-icon-sm">
                        ${NexusUI.icon('more-vertical', 14)}
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },
  
  // Render graph view
  renderGraphView() {
    return `
      <div class="panel graph-container">
        <div class="graph-placeholder">
          <svg viewBox="0 0 400 300" class="graph-viz">
            <!-- Demo graph visualization -->
            ${this.notes.slice(0, 8).map((note, i) => {
              const angle = (i / 8) * Math.PI * 2;
              const radius = 100;
              const x = 200 + Math.cos(angle) * radius;
              const y = 150 + Math.sin(angle) * radius;
              
              return `
                <g class="graph-node" data-note-id="${note.id}">
                  <circle cx="${x}" cy="${y}" r="20" 
                          fill="${note.sphere ? `var(--color-sphere-${note.sphere})` : 'var(--color-surface-3)'}" />
                  <text x="${x}" y="${y + 4}" 
                        text-anchor="middle" 
                        fill="var(--color-text)" 
                        font-size="10">
                    ${note.content.substring(0, 3)}
                  </text>
                </g>
              `;
            }).join('')}
            
            <!-- Center node (Knowledge Hub) -->
            <circle cx="200" cy="150" r="30" fill="var(--color-accent)" opacity="0.8" />
            <text x="200" y="154" text-anchor="middle" fill="white" font-size="10">HUB</text>
            
            <!-- Connection lines -->
            ${this.notes.slice(0, 8).map((note, i) => {
              const angle = (i / 8) * Math.PI * 2;
              const radius = 100;
              const x = 200 + Math.cos(angle) * radius;
              const y = 150 + Math.sin(angle) * radius;
              
              return `
                <line x1="200" y1="150" x2="${x}" y2="${y}" 
                      stroke="var(--color-border)" 
                      stroke-width="1" 
                      stroke-dasharray="4,4" />
              `;
            }).join('')}
          </svg>
          
          <div class="graph-legend">
            <div class="legend-item">
              <div class="legend-color" style="background: var(--color-sphere-geschaeft)"></div>
              <span>Geschäft</span>
            </div>
            <div class="legend-item">
              <div class="legend-color" style="background: var(--color-sphere-projekte)"></div>
              <span>Projekte</span>
            </div>
            <div class="legend-item">
              <div class="legend-color" style="background: var(--color-accent)"></div>
              <span>Knowledge Hub</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },
  
  // Render note sidebar
  renderNoteSidebar() {
    if (!this.selectedNote) {
      return `
        <div class="panel">
          <div class="panel-body text-center p-8">
            <div class="text-tertiary">
              <div class="mb-2">${NexusUI.icon('mouse-pointer', 24)}</div>
              <p>Wähle eine Notiz zum Bearbeiten</p>
            </div>
          </div>
        </div>
      `;
    }
    
    const note = this.selectedNote;
    
    return `
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">${this.getNoteTypeEmoji(note.type)} ${this.getNoteTypeLabel(note.type)}</span>
          <div class="flex items-center gap-2">
            <button class="btn-icon-sm" title="Löschen">
              ${NexusUI.icon('trash-2', 14)}
            </button>
            <button class="btn-icon-sm" title="Mehr">
              ${NexusUI.icon('more-vertical', 14)}
            </button>
          </div>
        </div>
        <div class="panel-body">
          <!-- Note Content Editor -->
          <div class="mb-4">
            <textarea class="input note-editor" id="note-content-editor" rows="8">${note.content}</textarea>
          </div>
          
          <!-- Metadata -->
          <div class="mb-4">
            <label class="input-label">Typ</label>
            <select class="input" id="note-type-select">
              <option value="note" ${note.type === 'note' ? 'selected' : ''}>📝 Notiz</option>
              <option value="idea" ${note.type === 'idea' ? 'selected' : ''}>💡 Idee</option>
              <option value="research" ${note.type === 'research' ? 'selected' : ''}>🔬 Research</option>
              <option value="decision" ${note.type === 'decision' ? 'selected' : ''}>⚖️ Entscheidung</option>
              <option value="question" ${note.type === 'question' ? 'selected' : ''}>❓ Frage</option>
            </select>
          </div>
          
          <div class="mb-4">
            <label class="input-label">Sphäre</label>
            <select class="input" id="note-sphere-select">
              <option value="">Keine</option>
              <option value="geschaeft" ${note.sphere === 'geschaeft' ? 'selected' : ''}>💼 Geschäft</option>
              <option value="projekte" ${note.sphere === 'projekte' ? 'selected' : ''}>🚀 Projekte</option>
              <option value="schule" ${note.sphere === 'schule' ? 'selected' : ''}>📚 Schule</option>
              <option value="sport" ${note.sphere === 'sport' ? 'selected' : ''}>💪 Sport</option>
              <option value="freizeit" ${note.sphere === 'freizeit' ? 'selected' : ''}>🎮 Freizeit</option>
            </select>
          </div>
          
          <!-- Links -->
          <div class="mb-4">
            <label class="input-label">Verknüpfungen</label>
            <div class="linked-notes">
              ${note.linkedEntities?.length > 0 ? note.linkedEntities.map(link => {
                let entityName = 'Unknown';
                let entityIcon = '🔗';
                
                // Resolve entity name based on type
                if (link.type === 'note') {
                  const linkedNote = this.notes.find(n => n.id === link.id);
                  entityName = linkedNote ? linkedNote.content.substring(0, 30) : 'Deleted note';
                  entityIcon = '📝';
                } else if (link.type === 'venture') {
                  const venture = NexusStore.getVentures().find(v => v.id === link.id);
                  entityName = venture ? venture.name : 'Deleted venture';
                  entityIcon = '🚀';
                } else if (link.type === 'project') {
                  const project = NexusStore.getProjects().find(p => p.id === link.id);
                  entityName = project ? project.name : 'Deleted project';
                  entityIcon = '📦';
                } else if (link.type === 'goal') {
                  const goal = NexusStore.getGoals().find(g => g.id === link.id);
                  entityName = goal ? goal.name : 'Deleted goal';
                  entityIcon = '🎯';
                } else if (link.type === 'task') {
                  const task = NexusStore.getTaskById(link.id);
                  entityName = task ? task.title : 'Deleted task';
                  entityIcon = '✅';
                } else if (link.type === 'contact') {
                  const contact = NexusStore.getContactById(link.id);
                  entityName = contact ? contact.name : 'Deleted contact';
                  entityIcon = '👤';
                }
                
                return `
                  <div class="linked-note-item">
                    <span class="linked-note-content">${entityIcon} ${entityName}</span>
                    <button class="btn-icon-sm remove-link" data-link-type="${link.type}" data-link-id="${link.id}">
                      ${NexusUI.icon('x', 12)}
                    </button>
                  </div>
                `;
              }).join('') : '<div class="text-tertiary text-sm">Keine Verknüpfungen</div>'}
            </div>
            <button class="btn btn-sm btn-ghost mt-2" id="add-link-btn">
              ${NexusUI.icon('link', 14)}
              Link hinzufügen
            </button>
          </div>
          
          <!-- Backlinks -->
          ${this.getBacklinks(note.id).length > 0 ? `
            <div class="mb-4">
              <label class="input-label">Backlinks</label>
              <div class="backlinks">
                ${this.getBacklinks(note.id).map(backlink => `
                  <div class="backlink-item" data-note-id="${backlink.id}">
                    ← ${backlink.content.substring(0, 30)}...
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          <!-- Actions -->
          <div class="flex gap-2 mt-4">
            <button class="btn btn-primary flex-1" id="save-note-btn">
              ${NexusUI.icon('check', 14)}
              Speichern
            </button>
          </div>
        </div>
      </div>
    `;
  },
  
  // Get backlinks (notes that link to this note)
  getBacklinks(noteId) {
    return this.notes.filter(n => n.links?.includes(noteId));
  },
  
  // Format note content (handle [[links]])
  formatNoteContent(content) {
    if (!content) return '';
    
    // Replace [[...]] with styled links
    return content.replace(/\[\[([^\]]+)\]\]/g, (match, text) => {
      return `<span class="note-wiki-link">[[${text}]]</span>`;
    });
  },
  
  // Get note type label
  getNoteTypeLabel(type) {
    const labels = {
      note: 'Notiz',
      idea: 'Idee',
      research: 'Research',
      decision: 'Entscheidung',
      question: 'Frage'
    };
    return labels[type] || 'Notiz';
  },
  
  // Get note type emoji
  getNoteTypeEmoji(type) {
    const emojis = {
      note: '📝',
      idea: '💡',
      research: '🔬',
      decision: '⚖️',
      question: '❓'
    };
    return emojis[type] || '📝';
  },
  
  // Select note
  selectNote(noteId) {
    this.selectedNote = this.notes.find(n => n.id === noteId) || null;
    this.render();
  },
  
  // Create new note
  createNote(content = '', type = 'note') {
    const note = {
      id: 'note_' + Date.now(),
      content: content || 'Neue Notiz...',
      type: type,
      sphere: null,
      links: [],
      position: {
        x: 100 + Math.random() * 200,
        y: 100 + Math.random() * 200,
        width: 280
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    NexusStore.addNote(note);
    this.notes = NexusStore.getNotes();
    this.selectedNote = note;
    this.render();
    
    NexusUI.showToast('Notiz erstellt', 'success');
  },
  
  // Delete note
  deleteNote(noteId) {
    if (!confirm('Notiz wirklich löschen?')) return;
    
    NexusStore.deleteNote(noteId);
    this.notes = NexusStore.getNotes();
    
    if (this.selectedNote?.id === noteId) {
      this.selectedNote = null;
    }
    
    this.render();
    NexusUI.showToast('Notiz gelöscht', 'success');
  },
  
  // Remove link from note
  removeLink(linkType, linkId) {
    if (!this.selectedNote) return;
    
    const linkedEntities = this.selectedNote.linkedEntities || [];
    const updatedLinks = linkedEntities.filter(link => 
      !(link.type === linkType && link.id === linkId)
    );
    
    NexusStore.updateNote(this.selectedNote.id, { linkedEntities: updatedLinks });
    this.selectedNote.linkedEntities = updatedLinks;
    this.render();
    
    NexusUI.showToast('Verknüpfung entfernt', 'success');
  },
  
  // Save current note
  saveNote() {
    if (!this.selectedNote) return;
    
    const content = document.getElementById('note-content-editor')?.value;
    const type = document.getElementById('note-type-select')?.value;
    const sphere = document.getElementById('note-sphere-select')?.value;
    
    if (content !== undefined) {
      this.selectedNote.content = content;
    }
    if (type) {
      this.selectedNote.type = type;
    }
    if (sphere !== undefined) {
      this.selectedNote.sphere = sphere || null;
    }
    this.selectedNote.updatedAt = new Date().toISOString();
    
    NexusStore.updateNote(this.selectedNote.id, this.selectedNote);
    this.notes = NexusStore.getNotes();
    this.render();
    
    NexusUI.showToast('Notiz gespeichert', 'success');
  },
  
  // Switch view
  switchView(view) {
    this.view = view;
    this.render();
  },
  
  // Setup event listeners
  setupEventListeners() {
    document.addEventListener('click', (e) => {
      // Delete note
      const deleteBtn = e.target.closest('[data-action="delete-note"]');
      if (deleteBtn) {
        const noteEl = deleteBtn.closest('[data-note-id]');
        if (noteEl) {
          e.stopPropagation();
          this.deleteNote(noteEl.dataset.noteId);
        }
        return;
      }
      
      // New note button
      if (e.target.closest('#mc-new-note') || e.target.closest('#mc-first-note')) {
        this.createNote();
        return;
      }
      
      // View switching
      const viewTab = e.target.closest('.tabs-pills .tab');
      if (viewTab && viewTab.dataset.view) {
        this.switchView(viewTab.dataset.view);
        return;
      }
      
      // Note selection (but not when clicking action buttons)
      const noteEl = e.target.closest('.canvas-note, .note-list-item, .graph-node');
      if (noteEl && noteEl.dataset.noteId && !e.target.closest('.canvas-note-actions')) {
        this.selectNote(noteEl.dataset.noteId);
        return;
      }
      
      // Save button
      if (e.target.closest('#save-note-btn')) {
        this.saveNote();
        return;
      }
      
      // Backlink click
      const backlink = e.target.closest('.backlink-item');
      if (backlink && backlink.dataset.noteId) {
        this.selectNote(backlink.dataset.noteId);
        return;
      }
      
      // Remove link button
      const removeLink = e.target.closest('.remove-link');
      if (removeLink) {
        e.stopPropagation();
        this.removeLink(removeLink.dataset.linkType, removeLink.dataset.linkId);
        return;
      }
    });
    
    // Drag & Drop for canvas notes
    document.addEventListener('mousedown', (e) => {
      const noteEl = e.target.closest('.canvas-note');
      if (noteEl && !e.target.closest('.canvas-note-actions') && !e.target.closest('.canvas-note-resize-handle')) {
        e.preventDefault();
        this.isDraggingNote = true;
        this.draggedNote = this.notes.find(n => n.id === noteEl.dataset.noteId);
        
        const rect = noteEl.getBoundingClientRect();
        const canvasRect = document.getElementById('canvas-area')?.getBoundingClientRect();
        
        if (this.draggedNote && canvasRect) {
          this.dragOffset.x = e.clientX - rect.left;
          this.dragOffset.y = e.clientY - rect.top;
        }
      }
    });
    
    document.addEventListener('mousemove', (e) => {
      if (this.isDraggingNote && this.draggedNote) {
        e.preventDefault();
        
        const canvasRect = document.getElementById('canvas-area')?.getBoundingClientRect();
        if (!canvasRect) return;
        
        const newX = e.clientX - canvasRect.left - this.dragOffset.x - this.canvasOffset.x;
        const newY = e.clientY - canvasRect.top - this.dragOffset.y - this.canvasOffset.y;
        
        // Update position
        if (!this.draggedNote.position) this.draggedNote.position = {};
        this.draggedNote.position.x = Math.max(0, newX);
        this.draggedNote.position.y = Math.max(0, newY);
        
        // Update visual position immediately
        const noteEl = document.querySelector(`[data-note-id="${this.draggedNote.id}"]`);
        if (noteEl) {
          noteEl.style.left = `${this.draggedNote.position.x}px`;
          noteEl.style.top = `${this.draggedNote.position.y}px`;
        }
      }
    });
    
    document.addEventListener('mouseup', (e) => {
      if (this.isDraggingNote && this.draggedNote) {
        // Save position to store
        NexusStore.updateNote(this.draggedNote.id, {
          position: this.draggedNote.position
        });
        
        this.isDraggingNote = false;
        this.draggedNote = null;
      }
    });
    
    // Search
    document.addEventListener('input', (e) => {
      if (e.target.id === 'mc-search') {
        this.search(e.target.value);
      }
    });
  },
  
  // Search notes
  search(query) {
    if (!query.trim()) {
      this.notes = NexusStore.getNotes();
    } else {
      const q = query.toLowerCase();
      this.notes = NexusStore.getNotes().filter(n => 
        n.content.toLowerCase().includes(q) ||
        n.type.toLowerCase().includes(q)
      );
    }
    this.render();
  }
};

// Initialize on navigation
window.addEventListener('nexus:navigate', (e) => {
  if (e.detail.page === 'mind-canvas') {
    MindCanvas.init();
  }
});

// Export
window.MindCanvas = MindCanvas;
