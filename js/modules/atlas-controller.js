/* ═══════════════════════════════════════════════════════════════════════════════
   ATLAS OMNISCIENT - Command Intelligence Center Controller
   Handles UI interactions, chat management, and system integration
   ═══════════════════════════════════════════════════════════════════════════════ */

const AtlasController = {
  
  isOpen: false,
  
  // Initialize controller
  init() {
    // Initialize chat sessions in AI service
    if (typeof AtlasAI !== 'undefined') {
      AtlasAI.initChatSessions();
    }
    
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
    this.renderChatList();
  },
  
  // Setup event listeners
  setupEventListeners() {
    // New chat button
    const newChatBtn = document.getElementById('atlas-new-chat');
    if (newChatBtn) {
      newChatBtn.addEventListener('click', () => this.createNewChat());
    }
    
    // Close button
    const closeBtn = document.getElementById('atlas-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
    
    // Backdrop click
    const backdrop = document.getElementById('atlas-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', () => this.close());
    }
    
    // Send button
    const sendBtn = document.getElementById('atlas-send-btn');
    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.sendMessage());
    }
    
    // Input field
    const input = document.getElementById('atlas-input');
    if (input) {
      // Auto-resize textarea
      input.addEventListener('input', (e) => {
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
      });
      
      // Enter to send (Shift+Enter for new line)
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }
    
    // Settings button
    const settingsBtn = document.getElementById('atlas-settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.close();
        NexusRouter.navigate('settings');
      });
    }
    
    // Quick actions
    document.addEventListener('click', (e) => {
      const quickAction = e.target.closest('[data-quick-action]');
      if (quickAction) {
        this.handleQuickAction(quickAction.dataset.quickAction);
      }
    });
  },
  
  // Setup keyboard shortcuts
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // CMD/CTRL + K to toggle Atlas
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.toggle();
      }
      
      // ESC to close
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  },
  
  // Toggle Atlas panel
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  },
  
  // Open Atlas
  open() {
    const panel = document.getElementById('atlas-command-center');
    if (panel) {
      panel.classList.add('active');
      this.isOpen = true;
      
      // Focus input
      setTimeout(() => {
        const input = document.getElementById('atlas-input');
        if (input) input.focus();
      }, 300);
      
      // Update UI
      this.renderChatList();
      this.renderCurrentChat();
      
      // Refresh Lucide icons
      if (window.lucide) lucide.createIcons();
    }
  },
  
  // Close Atlas
  close() {
    const panel = document.getElementById('atlas-command-center');
    if (panel) {
      panel.classList.remove('active');
      this.isOpen = false;
    }
  },
  
  // Create new chat session
  createNewChat() {
    if (typeof AtlasAI !== 'undefined') {
      AtlasAI.createNewSession();
      this.renderChatList();
      this.renderCurrentChat();
    }
  },
  
  // Render chat list in sidebar
  renderChatList() {
    const container = document.getElementById('atlas-chat-list');
    if (!container || typeof AtlasAI === 'undefined') return;
    
    const sessions = AtlasAI.chatSessions;
    
    if (sessions.length === 0) {
      container.innerHTML = `
        <div class="text-center text-tertiary p-4" style="font-size: 13px;">
          Keine Chats vorhanden.<br>
          Starte einen neuen Chat!
        </div>
      `;
      return;
    }
    
    container.innerHTML = sessions.map(session => {
      const isActive = session.id === AtlasAI.currentSessionId;
      const timestamp = new Date(session.updatedAt);
      const timeStr = this.formatTimestamp(timestamp);
      const messageCount = session.messages.length;
      
      return `
        <div class="atlas-chat-item ${isActive ? 'active' : ''} ${session.isPinned ? 'pinned' : ''}"
             data-session-id="${session.id}"
             onclick="AtlasController.switchChat('${session.id}')">
          <div class="atlas-chat-icon">
            ${session.isPinned ? '<i data-lucide="pin"></i>' : '<i data-lucide="message-circle"></i>'}
          </div>
          <div class="atlas-chat-info">
            <div class="atlas-chat-title">${this.escapeHtml(session.title)}</div>
            <div class="atlas-chat-meta">
              <span>${timeStr}</span>
              <span>•</span>
              <span>${messageCount} ${messageCount === 1 ? 'Nachricht' : 'Nachrichten'}</span>
            </div>
          </div>
          <div class="atlas-chat-actions">
            <button class="atlas-chat-action-btn" 
                    onclick="event.stopPropagation(); AtlasController.togglePinChat('${session.id}')">
              <i data-lucide="${session.isPinned ? 'pin-off' : 'pin'}"></i>
            </button>
            <button class="atlas-chat-action-btn" 
                    onclick="event.stopPropagation(); AtlasController.deleteChat('${session.id}')">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
    
    if (window.lucide) lucide.createIcons();
  },
  
  // Switch to different chat
  switchChat(sessionId) {
    if (typeof AtlasAI !== 'undefined') {
      AtlasAI.switchSession(sessionId);
      this.renderChatList();
      this.renderCurrentChat();
    }
  },
  
  // Toggle pin status
  togglePinChat(sessionId) {
    if (typeof AtlasAI !== 'undefined') {
      AtlasAI.togglePinSession(sessionId);
      this.renderChatList();
    }
  },
  
  // Delete chat
  deleteChat(sessionId) {
    if (!confirm('Chat wirklich löschen?')) return;
    
    if (typeof AtlasAI !== 'undefined') {
      AtlasAI.deleteSession(sessionId);
      this.renderChatList();
      this.renderCurrentChat();
    }
  },
  
  // Render current chat messages
  renderCurrentChat() {
    const container = document.getElementById('atlas-messages');
    const titleEl = document.getElementById('atlas-session-title');
    
    if (!container || typeof AtlasAI === 'undefined') return;
    
    const session = AtlasAI.getCurrentSession();
    if (!session) {
      container.innerHTML = '<div class="text-center text-tertiary p-4">Keine Session aktiv</div>';
      return;
    }
    
    // Update title
    if (titleEl) {
      titleEl.textContent = session.title === 'Neue Konversation' ? 'Command Intelligence Center' : session.title;
    }
    
    // Render messages
    const messages = session.messages;
    
    if (messages.length === 0) {
      // Show welcome message
      container.innerHTML = this.getWelcomeMessage();
    } else {
      container.innerHTML = messages.map(msg => this.renderMessage(msg)).join('');
    }
    
    // Scroll to bottom
    const messagesContainer = document.getElementById('atlas-messages-container');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    if (window.lucide) lucide.createIcons();
  },
  
  // Get welcome message HTML
  getWelcomeMessage() {
    return `
      <div class="atlas-message assistant">
        <div class="atlas-quick-actions" style="width: 100%; margin: 0;">
          <button class="atlas-quick-action" data-quick-action="briefing">
            <i data-lucide="sunrise"></i>
            Briefing
          </button>
          <button class="atlas-quick-action" data-quick-action="forgotten">
            <i data-lucide="alert-triangle"></i>
            Vergessene Tasks
          </button>
          <button class="atlas-quick-action" data-quick-action="insights">
            <i data-lucide="bar-chart"></i>
            Insights
          </button>
        </div>
      </div>
    `;
  },
  
  // Render single message
  renderMessage(msg) {
    const isUser = msg.role === 'user';
    
    return `
      <div class="atlas-message ${isUser ? 'user' : 'assistant'}">
        <div class="atlas-message-avatar">
          ${isUser ? '👤' : '<i data-lucide="brain-circuit"></i>'}
        </div>
        <div class="atlas-message-content">
          ${this.formatMessageContent(msg.content)}
        </div>
      </div>
    `;
  },
  
  // Format message content (markdown-like)
  formatMessageContent(text) {
    if (!text) return '';
    
    // Convert bold
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert line breaks
    text = text.replace(/\n\n/g, '</p><p>');
    text = text.replace(/\n/g, '<br>');
    
    // Wrap in paragraph if not already
    if (!text.startsWith('<p>')) {
      text = '<p>' + text + '</p>';
    }
    
    return text;
  },
  
  // Send message
  async sendMessage() {
    const input = document.getElementById('atlas-input');
    if (!input) return;
    
    const message = input.value.trim();
    if (!message) return;
    
    // Clear input
    input.value = '';
    input.style.height = 'auto';
    
    // Add to session
    if (typeof AtlasAI !== 'undefined') {
      AtlasAI.addMessage('user', message);
      this.renderCurrentChat();
      
      // Show thinking indicator
      this.showThinking();
      
      try {
        // Send to AI
        if (AtlasAI.hasApiKey()) {
          const response = await AtlasAI.sendMessage(message);
          
          // Remove thinking, add response
          this.hideThinking();
          AtlasAI.addMessage('assistant', response);
          this.renderCurrentChat();
        } else {
          // No API key - show message
          this.hideThinking();
          AtlasAI.addMessage('assistant', 
            'Bitte konfiguriere einen OpenAI API-Key in den Einstellungen, um die volle ATLAS-Funktionalität zu nutzen.');
          this.renderCurrentChat();
        }
      } catch (error) {
        this.hideThinking();
        AtlasAI.addMessage('assistant', 
          'Es gab einen Fehler bei der Verarbeitung deiner Nachricht. Bitte versuche es erneut.');
        this.renderCurrentChat();
        console.error('Atlas error:', error);
      }
    }
  },
  
  // Show thinking indicator
  showThinking() {
    const container = document.getElementById('atlas-messages');
    if (!container) return;
    
    const thinkingDiv = document.createElement('div');
    thinkingDiv.id = 'atlas-thinking-indicator';
    thinkingDiv.className = 'atlas-message assistant';
    thinkingDiv.innerHTML = `
      <div class="atlas-message-avatar">
        <i data-lucide="brain-circuit"></i>
      </div>
      <div class="atlas-message-content">
        <div class="atlas-loading">
          <span>Denke nach</span>
          <div class="atlas-loading-dots">
            <div class="atlas-loading-dot"></div>
            <div class="atlas-loading-dot"></div>
            <div class="atlas-loading-dot"></div>
          </div>
        </div>
      </div>
    `;
    
    container.appendChild(thinkingDiv);
    
    // Scroll to bottom
    const messagesContainer = document.getElementById('atlas-messages-container');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    if (window.lucide) lucide.createIcons();
  },
  
  // Hide thinking indicator
  hideThinking() {
    const indicator = document.getElementById('atlas-thinking-indicator');
    if (indicator) {
      indicator.remove();
    }
  },
  
  // Handle quick actions
  async handleQuickAction(action) {
    const input = document.getElementById('atlas-input');
    
    switch (action) {
      case 'briefing':
        if (input) {
          input.value = 'Gib mir ein Morning Briefing mit meinen heutigen Tasks, Habits und Prioritäten.';
          this.sendMessage();
        }
        break;
        
      case 'forgotten':
        if (input) {
          input.value = 'Zeige mir vernachlässigte Tasks, Projekte und Ventures. Was habe ich vergessen?';
          this.sendMessage();
        }
        break;
        
      case 'insights':
        if (input) {
          input.value = 'Gib mir Insights und Empfehlungen basierend auf meiner Produktivität und Analytics.';
          this.sendMessage();
        }
        break;
    }
  },
  
  // Utility: Format timestamp
  formatTimestamp(date) {
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (days > 7) {
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    } else if (days > 0) {
      return `vor ${days} ${days === 1 ? 'Tag' : 'Tagen'}`;
    } else if (hours > 0) {
      return `vor ${hours}h`;
    } else if (minutes > 0) {
      return `vor ${minutes}min`;
    } else {
      return 'gerade eben';
    }
  },
  
  // Utility: Escape HTML
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  AtlasController.init();
});

// Export globally
window.AtlasController = AtlasController;
