/* ═══════════════════════════════════════════════════════════════════════════════
   NEXUS ULTRA - Contacts Module
   Contact management and relationship tracking
   ═══════════════════════════════════════════════════════════════════════════════ */

const ContactsModule = {
  
  filter: 'all', // all | family | friends | business | other
  searchQuery: '',
  _listenersInitialized: false,
  
  // Initialize
  init() {
    this.render();
  },
  
  // Render
  render() {
    const container = document.getElementById('page-contacts');
    if (!container) return;
    
    let contacts = NexusStore.getContacts();
    contacts = this.applyFilters(contacts);
    
    const stats = this.getStats(NexusStore.getContacts());
    
    container.innerHTML = `
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-medium">Kontakte</h2>
          <p class="text-secondary">${stats.total} Kontakte</p>
        </div>
        
        <button class="btn btn-primary" id="add-contact-btn">
          ${NexusUI.icon('user-plus', 16)}
          Neuer Kontakt
        </button>
      </div>
      
      <!-- Search & Filter -->
      <div class="flex gap-4 mb-6">
        <div class="flex-1 relative">
          <input type="text" 
                 class="input w-full" 
                 id="contact-search"
                 placeholder="Kontakte suchen..."
                 value="${this.searchQuery}">
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary">
            ${NexusUI.icon('search', 16)}
          </span>
        </div>
        
        <div class="flex gap-2">
          <button class="btn ${this.filter === 'all' ? 'btn-primary' : 'btn-secondary'}" data-filter="all">
            Alle
          </button>
          <button class="btn ${this.filter === 'family' ? 'btn-primary' : 'btn-secondary'}" data-filter="family">
            👨‍👩‍👧 Familie
          </button>
          <button class="btn ${this.filter === 'friends' ? 'btn-primary' : 'btn-secondary'}" data-filter="friends">
            👥 Freunde
          </button>
          <button class="btn ${this.filter === 'business' ? 'btn-primary' : 'btn-secondary'}" data-filter="business">
            💼 Business
          </button>
        </div>
      </div>
      
      <!-- Contacts Grid -->
      ${contacts.length === 0 ? `
        <div class="panel">
          <div class="panel-body">
            <div class="empty-state p-8">
              <div class="text-4xl mb-4">👤</div>
              <h3 class="text-lg mb-2">Keine Kontakte</h3>
              <p class="text-secondary mb-4">
                ${this.searchQuery ? 'Keine Ergebnisse für diese Suche' : 'Füge deinen ersten Kontakt hinzu!'}
              </p>
              ${!this.searchQuery ? `
                <button class="btn btn-primary" id="add-contact-btn-empty">
                  ${NexusUI.icon('user-plus', 16)}
                  Kontakt hinzufügen
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      ` : `
        <div class="contacts-grid">
          ${contacts.map(c => this.renderContactCard(c)).join('')}
        </div>
      `}
    `;
    
    NexusUI.refreshIcons();
  },
  
  // Get stats
  getStats(contacts) {
    return {
      total: contacts.length,
      family: contacts.filter(c => c.category === 'family').length,
      friends: contacts.filter(c => c.category === 'friends').length,
      business: contacts.filter(c => c.category === 'business').length
    };
  },
  
  // Apply filters
  applyFilters(contacts) {
    let filtered = [...contacts];
    
    // Category filter
    if (this.filter !== 'all') {
      filtered = filtered.filter(c => c.category === this.filter);
    }
    
    // Search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.company?.toLowerCase().includes(query) ||
        c.role?.toLowerCase().includes(query)
      );
    }
    
    // Sort by name
    filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    
    return filtered;
  },
  
  // Render contact card
  renderContactCard(contact) {
    const initials = this.getInitials(contact.name);
    const categoryIcon = this.getCategoryIcon(contact.category);
    
    return `
      <div class="contact-card" data-contact-id="${contact.id}">
        <div class="contact-avatar" style="background: ${this.getAvatarColor(contact.name)}">
          ${contact.avatar ? `<img src="${contact.avatar}" alt="${contact.name}">` : initials}
        </div>
        
        <div class="contact-info">
          <h3 class="contact-name">${contact.name}</h3>
          ${contact.role ? `<div class="contact-role">${contact.role}</div>` : ''}
          ${contact.company ? `<div class="contact-company">${contact.company}</div>` : ''}
        </div>
        
        <div class="contact-meta">
          ${contact.category ? `
            <span class="contact-category">${categoryIcon}</span>
          ` : ''}
        </div>
        
        <div class="contact-actions">
          ${contact.email ? `
            <a href="mailto:${contact.email}" class="btn-icon-sm" title="E-Mail">
              ${NexusUI.icon('mail', 14)}
            </a>
          ` : ''}
          ${contact.phone ? `
            <a href="tel:${contact.phone}" class="btn-icon-sm" title="Anrufen">
              ${NexusUI.icon('phone', 14)}
            </a>
          ` : ''}
          <button class="btn-icon-sm" data-action="edit" title="Bearbeiten">
            ${NexusUI.icon('edit-2', 14)}
          </button>
          <button class="btn-icon-sm" data-action="delete" title="Löschen">
            ${NexusUI.icon('trash-2', 14)}
          </button>
        </div>
        
        <button class="contact-expand" data-action="view">
          Details ${NexusUI.icon('chevron-right', 14)}
        </button>
      </div>
    `;
  },
  
  // Get initials from name
  getInitials(name) {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  },
  
  // Get avatar color based on name
  getAvatarColor(name) {
    if (!name) return 'var(--color-border)';
    const colors = [
      'var(--color-sphere-geschaeft)',
      'var(--color-sphere-projekte)',
      'var(--color-sphere-schule)',
      'var(--color-sphere-sport)',
      'var(--color-sphere-freizeit)'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  },
  
  // Get category icon
  getCategoryIcon(category) {
    const icons = {
      family: '👨‍👩‍👧',
      friends: '👥',
      business: '💼',
      other: '👤'
    };
    return icons[category] || icons.other;
  },
  
  // Show add contact modal
  showAddContactModal() {
    const content = `
      <div class="p-4">
        <div class="grid gap-4" style="grid-template-columns: 1fr 1fr;">
          <div class="col-span-2">
            <label class="input-label">Name *</label>
            <input type="text" class="input" id="new-contact-name" placeholder="Vor- und Nachname">
          </div>
          <div>
            <label class="input-label">E-Mail</label>
            <input type="email" class="input" id="new-contact-email" placeholder="email@example.com">
          </div>
          <div>
            <label class="input-label">Telefon</label>
            <input type="tel" class="input" id="new-contact-phone" placeholder="+49 ...">
          </div>
          <div>
            <label class="input-label">Kategorie</label>
            <select class="input" id="new-contact-category">
              <option value="">Keine</option>
              <option value="family">👨‍👩‍👧 Familie</option>
              <option value="friends">👥 Freunde</option>
              <option value="business">💼 Business</option>
              <option value="other">👤 Andere</option>
            </select>
          </div>
          <div>
            <label class="input-label">Rolle / Position</label>
            <input type="text" class="input" id="new-contact-role" placeholder="z.B. CEO, Bruder">
          </div>
          <div class="col-span-2">
            <label class="input-label">Firma / Organisation</label>
            <input type="text" class="input" id="new-contact-company" placeholder="Firma">
          </div>
          <div class="col-span-2">
            <label class="input-label">Adresse</label>
            <input type="text" class="input" id="new-contact-address" placeholder="Straße, Stadt">
          </div>
          <div class="col-span-2">
            <label class="input-label">Notizen</label>
            <textarea class="input" id="new-contact-notes" rows="2" placeholder="Zusätzliche Informationen"></textarea>
          </div>
        </div>
        
        <div class="flex gap-2 justify-end mt-6">
          <button class="btn btn-secondary" onclick="NexusUI.closeModal()">Abbrechen</button>
          <button class="btn btn-primary" onclick="ContactsModule.createContact()">Erstellen</button>
        </div>
      </div>
    `;
    
    NexusUI.openModal('Neuer Kontakt', content, { size: 'large' });
  },
  
  // Create contact
  createContact() {
    const name = document.getElementById('new-contact-name')?.value;
    if (!name) {
      NexusUI.showToast('Name ist erforderlich', 'error');
      return;
    }
    
    const contact = {
      name,
      email: document.getElementById('new-contact-email')?.value || '',
      phone: document.getElementById('new-contact-phone')?.value || '',
      category: document.getElementById('new-contact-category')?.value || null,
      role: document.getElementById('new-contact-role')?.value || '',
      company: document.getElementById('new-contact-company')?.value || '',
      address: document.getElementById('new-contact-address')?.value || '',
      notes: document.getElementById('new-contact-notes')?.value || ''
    };
    
    NexusStore.addContact(contact);
    NexusUI.closeModal();
    NexusUI.showToast('Kontakt erstellt!', 'success');
    this.render();
  },
  
  // View contact details
  viewContact(contactId) {
    const contact = NexusStore.getContacts().find(c => c.id === contactId);
    if (!contact) return;
    
    // Find linked projects/ventures
    const projects = NexusStore.getProjects().filter(p => 
      p.contacts?.includes(contactId)
    );
    const ventures = NexusStore.getVentures().filter(v => 
      v.contacts?.includes(contactId)
    );
    
    const content = `
      <div class="p-4">
        <div class="flex items-center gap-4 mb-6">
          <div class="contact-avatar-lg" style="background: ${this.getAvatarColor(contact.name)}">
            ${this.getInitials(contact.name)}
          </div>
          <div>
            <h3 class="text-xl font-medium">${contact.name}</h3>
            ${contact.role ? `<div class="text-secondary">${contact.role}</div>` : ''}
            ${contact.company ? `<div class="text-secondary">${contact.company}</div>` : ''}
          </div>
          ${contact.category ? `
            <span class="badge ml-auto">${this.getCategoryIcon(contact.category)} ${contact.category}</span>
          ` : ''}
        </div>
        
        <div class="grid gap-4 mb-6" style="grid-template-columns: 1fr 1fr;">
          ${contact.email ? `
            <div class="info-row">
              <span class="info-icon">${NexusUI.icon('mail', 16)}</span>
              <div>
                <div class="info-label">E-Mail</div>
                <a href="mailto:${contact.email}" class="info-value link">${contact.email}</a>
              </div>
            </div>
          ` : ''}
          ${contact.phone ? `
            <div class="info-row">
              <span class="info-icon">${NexusUI.icon('phone', 16)}</span>
              <div>
                <div class="info-label">Telefon</div>
                <a href="tel:${contact.phone}" class="info-value link">${contact.phone}</a>
              </div>
            </div>
          ` : ''}
          ${contact.address ? `
            <div class="info-row col-span-2">
              <span class="info-icon">${NexusUI.icon('map-pin', 16)}</span>
              <div>
                <div class="info-label">Adresse</div>
                <div class="info-value">${contact.address}</div>
              </div>
            </div>
          ` : ''}
        </div>
        
        ${projects.length > 0 || ventures.length > 0 ? `
          <div class="mb-4">
            <h4 class="font-medium mb-2">Verknüpfungen</h4>
            <div class="flex flex-wrap gap-2">
              ${projects.map(p => `
                <span class="badge">${p.icon || '📁'} ${p.name}</span>
              `).join('')}
              ${ventures.map(v => `
                <span class="badge">${v.icon || '🚀'} ${v.name}</span>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        ${contact.notes ? `
          <div class="mb-4">
            <h4 class="font-medium mb-2">Notizen</h4>
            <div class="text-secondary">${contact.notes}</div>
          </div>
        ` : ''}
        
        <div class="text-xs text-tertiary mt-4">
          Erstellt: ${NexusUI.formatDate(new Date(contact.createdAt))}
        </div>
        
        <div class="flex gap-2 justify-end mt-6">
          <button class="btn btn-secondary" onclick="NexusUI.closeModal()">Schließen</button>
          <button class="btn btn-primary" onclick="ContactsModule.editContact('${contactId}')">Bearbeiten</button>
        </div>
      </div>
    `;
    
    NexusUI.openModal('Kontaktdetails', content, { size: 'large' });
  },
  
  // Edit contact
  editContact(contactId) {
    NexusUI.closeModal();
    
    const contact = NexusStore.getContacts().find(c => c.id === contactId);
    if (!contact) return;
    
    setTimeout(() => {
      const content = `
        <div class="p-4">
          <div class="grid gap-4" style="grid-template-columns: 1fr 1fr;">
            <div class="col-span-2">
              <label class="input-label">Name *</label>
              <input type="text" class="input" id="edit-contact-name" value="${contact.name}">
            </div>
            <div>
              <label class="input-label">E-Mail</label>
              <input type="email" class="input" id="edit-contact-email" value="${contact.email || ''}">
            </div>
            <div>
              <label class="input-label">Telefon</label>
              <input type="tel" class="input" id="edit-contact-phone" value="${contact.phone || ''}">
            </div>
            <div>
              <label class="input-label">Kategorie</label>
              <select class="input" id="edit-contact-category">
                <option value="">Keine</option>
                <option value="family" ${contact.category === 'family' ? 'selected' : ''}>👨‍👩‍👧 Familie</option>
                <option value="friends" ${contact.category === 'friends' ? 'selected' : ''}>👥 Freunde</option>
                <option value="business" ${contact.category === 'business' ? 'selected' : ''}>💼 Business</option>
                <option value="other" ${contact.category === 'other' ? 'selected' : ''}>👤 Andere</option>
              </select>
            </div>
            <div>
              <label class="input-label">Rolle / Position</label>
              <input type="text" class="input" id="edit-contact-role" value="${contact.role || ''}">
            </div>
            <div class="col-span-2">
              <label class="input-label">Firma / Organisation</label>
              <input type="text" class="input" id="edit-contact-company" value="${contact.company || ''}">
            </div>
            <div class="col-span-2">
              <label class="input-label">Adresse</label>
              <input type="text" class="input" id="edit-contact-address" value="${contact.address || ''}">
            </div>
            <div class="col-span-2">
              <label class="input-label">Notizen</label>
              <textarea class="input" id="edit-contact-notes" rows="2">${contact.notes || ''}</textarea>
            </div>
          </div>
          
          <div class="flex gap-2 justify-end mt-6">
            <button class="btn btn-secondary" onclick="NexusUI.closeModal()">Abbrechen</button>
            <button class="btn btn-primary" onclick="ContactsModule.saveContact('${contactId}')">Speichern</button>
          </div>
        </div>
      `;
      
      NexusUI.openModal('Kontakt bearbeiten', content, { size: 'large' });
    }, 100);
  },
  
  // Save contact
  saveContact(contactId) {
    const name = document.getElementById('edit-contact-name')?.value;
    if (!name) {
      NexusUI.showToast('Name ist erforderlich', 'error');
      return;
    }
    
    NexusStore.updateContact(contactId, {
      name,
      email: document.getElementById('edit-contact-email')?.value || '',
      phone: document.getElementById('edit-contact-phone')?.value || '',
      category: document.getElementById('edit-contact-category')?.value || null,
      role: document.getElementById('edit-contact-role')?.value || '',
      company: document.getElementById('edit-contact-company')?.value || '',
      address: document.getElementById('edit-contact-address')?.value || '',
      notes: document.getElementById('edit-contact-notes')?.value || ''
    });
    
    NexusUI.closeModal();
    NexusUI.showToast('Kontakt gespeichert!', 'success');
    this.render();
  },
  
  // Delete contact
  deleteContact(contactId) {
    if (!confirm('Kontakt wirklich löschen?')) return;
    NexusStore.deleteContact(contactId);
    NexusUI.showToast('Kontakt gelöscht', 'success');
    this.render();
  },
  
  // Setup event listeners
  setupEventListeners() {
    if (this._listenersInitialized) return;
    this._listenersInitialized = true;
    
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#page-contacts')) return;
      
      // Filter buttons
      const filterBtn = e.target.closest('[data-filter]');
      if (filterBtn) {
        this.filter = filterBtn.dataset.filter;
        this.render();
        return;
      }
      
      // Add contact buttons
      if (e.target.closest('#add-contact-btn') || e.target.closest('#add-contact-btn-empty')) {
        this.showAddContactModal();
        return;
      }
      
      // Contact card actions
      const contactCard = e.target.closest('[data-contact-id]');
      if (contactCard) {
        const contactId = contactCard.dataset.contactId;
        const action = e.target.closest('[data-action]')?.dataset.action;
        
        if (action === 'edit') {
          this.editContact(contactId);
        } else if (action === 'delete') {
          this.deleteContact(contactId);
        } else if (action === 'view') {
          this.viewContact(contactId);
        }
        return;
      }
    });
    
    // Search input
    document.addEventListener('input', (e) => {
      if (e.target.id === 'contact-search') {
        this.searchQuery = e.target.value;
        // Debounce
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => this.render(), 300);
      }
    });
  }
};

// Initialize on navigation
window.addEventListener('nexus:navigate', (e) => {
  if (e.detail.page === 'contacts') {
    ContactsModule.init();
  }
});

// Export
window.ContactsModule = ContactsModule;
