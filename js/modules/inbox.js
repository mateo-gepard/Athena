/* ═══════════════════════════════════════════════════════════════════════════════
   NEXUS ULTRA - Inbox Module
   Universal Inbox for all unprocessed items
   ═══════════════════════════════════════════════════════════════════════════════ */

const InboxModule = {
  
  filter: 'all', // all | task | idea | note
  _listenersInitialized: false,
  
  // Initialize
  init() {
    this.render();
  },
  
  // Render the inbox
  render() {
    const container = document.getElementById('page-inbox');
    if (!container) return;
    
    const inboxItems = this.getInboxItems();
    
    container.innerHTML = `
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-medium">Inbox</h2>
          <p class="text-secondary">${inboxItems.length} Items warten auf Verarbeitung</p>
        </div>
        
        <div class="flex items-center gap-3">
          <button class="btn btn-secondary" id="inbox-process-all">
            ${NexusUI.icon('check-circle', 16)}
            Alle verarbeiten
          </button>
          <button class="btn btn-primary open-capture">
            ${NexusUI.icon('plus', 16)}
            Hinzufügen
          </button>
        </div>
      </div>
      
      <!-- Filters -->
      <div class="tabs-pills mb-6">
        <button class="tab ${this.filter === 'all' ? 'active' : ''}" data-filter="all">
          Alle (${inboxItems.length})
        </button>
        <button class="tab ${this.filter === 'task' ? 'active' : ''}" data-filter="task">
          Tasks (${inboxItems.filter(i => i.type === 'task').length})
        </button>
        <button class="tab ${this.filter === 'idea' ? 'active' : ''}" data-filter="idea">
          Ideen (${inboxItems.filter(i => i.type === 'idea').length})
        </button>
        <button class="tab ${this.filter === 'note' ? 'active' : ''}" data-filter="note">
          Notizen (${inboxItems.filter(i => i.type === 'note').length})
        </button>
      </div>
      
      <!-- Inbox Items -->
      <div class="panel">
        <div class="panel-body">
          ${this.renderInboxItems(inboxItems)}
        </div>
      </div>
    `;
    
    NexusUI.refreshIcons();
  },
  
  // Get inbox items (unprocessed tasks, ideas, notes)
  getInboxItems() {
    const tasks = NexusStore.getTasks().filter(t => !t.projectId && !t.sphere && t.status !== 'completed');
    const notes = NexusStore.getNotes().filter(n => !n.sphere && n.type !== 'idea');
    const ideas = NexusStore.getNotes().filter(n => n.type === 'idea' && !n.processed);
    
    const items = [
      ...tasks.map(t => ({ ...t, itemType: 'task' })),
      ...notes.map(n => ({ ...n, itemType: 'note' })),
      ...ideas.map(i => ({ ...i, itemType: 'idea' }))
    ];
    
    // Filter
    if (this.filter !== 'all') {
      return items.filter(i => i.itemType === this.filter || i.type === this.filter);
    }
    
    // Sort by date
    return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  
  // Render inbox items
  renderInboxItems(items) {
    if (items.length === 0) {
      return `
        <div class="empty-state p-8">
          <div class="text-4xl mb-4">📭</div>
          <h3 class="text-lg mb-2">Inbox ist leer!</h3>
          <p class="text-secondary mb-4">Alle Items sind verarbeitet. Gut gemacht!</p>
        </div>
      `;
    }
    
    return `
      <div class="inbox-list">
        ${items.map(item => this.renderInboxItem(item)).join('')}
      </div>
    `;
  },
  
  // Render single inbox item
  renderInboxItem(item) {
    const typeIcon = item.itemType === 'task' ? '☐' : 
                     item.itemType === 'idea' ? '💡' : '📝';
    
    return `
      <div class="inbox-item" data-item-id="${item.id}" data-item-type="${item.itemType}">
        <div class="flex items-center gap-4">
          <span class="text-lg">${typeIcon}</span>
          <div class="flex-1 min-w-0">
            <div class="font-medium">${item.title || item.content}</div>
            <div class="text-sm text-tertiary">
              ${NexusUI.formatDate(new Date(item.createdAt))}
            </div>
          </div>
          <div class="inbox-item-actions flex items-center gap-2">
            <select class="input input-sm sphere-select" style="width: 120px;">
              <option value="">Sphäre...</option>
              <option value="geschaeft">💼 Geschäft</option>
              <option value="projekte">🚀 Projekte</option>
              <option value="schule">📚 Schule</option>
              <option value="sport">💪 Sport</option>
              <option value="freizeit">🎮 Freizeit</option>
            </select>
            <button class="btn btn-sm btn-primary process-item">
              Verarbeiten
            </button>
            <button class="btn btn-sm btn-ghost delete-item">
              ${NexusUI.icon('trash-2', 14)}
            </button>
          </div>
        </div>
      </div>
    `;
  },
  
  // Process item (assign sphere and move out of inbox)
  processItem(itemId, itemType, sphere) {
    if (itemType === 'task') {
      NexusStore.updateTask(itemId, { sphere: sphere || 'geschaeft' });
    } else {
      NexusStore.updateNote(itemId, { sphere: sphere || 'geschaeft', processed: true });
    }
    
    NexusUI.showToast('Item verarbeitet!', 'success');
    this.render();
  },
  
  // Delete item
  deleteItem(itemId, itemType) {
    if (!confirm('Item wirklich löschen?')) return;
    
    if (itemType === 'task') {
      NexusStore.deleteTask(itemId);
    } else {
      NexusStore.deleteNote(itemId);
    }
    
    NexusUI.showToast('Item gelöscht', 'success');
    this.render();
  },
  
  // Process all items
  processAll() {
    const items = this.getInboxItems();
    items.forEach(item => {
      if (item.itemType === 'task') {
        NexusStore.updateTask(item.id, { sphere: 'geschaeft' });
      } else {
        NexusStore.updateNote(item.id, { sphere: 'geschaeft', processed: true });
      }
    });
    
    NexusUI.showToast(`${items.length} Items verarbeitet!`, 'success');
    this.render();
  },
  
  // Setup event listeners
  setupEventListeners() {
    if (this._listenersInitialized) return;
    this._listenersInitialized = true;
    
    document.addEventListener('click', (e) => {
      // Filter
      const filterTab = e.target.closest('.tabs-pills .tab');
      if (filterTab && filterTab.dataset.filter && e.target.closest('#page-inbox')) {
        this.filter = filterTab.dataset.filter;
        this.render();
        return;
      }
      
      // Process item
      if (e.target.closest('.process-item')) {
        const item = e.target.closest('.inbox-item');
        const itemId = item.dataset.itemId;
        const itemType = item.dataset.itemType;
        const sphere = item.querySelector('.sphere-select')?.value;
        this.processItem(itemId, itemType, sphere);
        return;
      }
      
      // Delete item
      if (e.target.closest('.delete-item')) {
        const item = e.target.closest('.inbox-item');
        this.deleteItem(item.dataset.itemId, item.dataset.itemType);
        return;
      }
      
      // Process all
      if (e.target.closest('#inbox-process-all')) {
        this.processAll();
        return;
      }
    });
  }
};

// Initialize on navigation
window.addEventListener('nexus:navigate', (e) => {
  if (e.detail.page === 'inbox') {
    InboxModule.init();
  }
});

// Export
window.InboxModule = InboxModule;
