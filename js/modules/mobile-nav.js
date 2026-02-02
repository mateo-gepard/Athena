/* ═══════════════════════════════════════════════════════════════════════════════
   Athena Ultra - Mobile Navigation Controller
   Hamburger Menu, Tab Bar, und Touch Handling
   ═══════════════════════════════════════════════════════════════════════════════ */

const MobileNav = {
  
  isInitialized: false,
  currentTab: 'command-center', // 'command-center' or 'atlas'
  
  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    
    console.log('📱 MobileNav initializing...');
    
    // Wait for DOM and icons to be ready
    this.setupEventListeners();
    this.setupMobileAtlas();
    this.syncCloudStatus();
    
    // Set initial state - ensure mobile atlas is hidden on startup
    const mobileAtlasChat = document.getElementById('mobile-atlas-chat');
    if (mobileAtlasChat) {
      mobileAtlasChat.classList.remove('active');
      mobileAtlasChat.style.display = 'none';
    }
    
    this.setActiveTab('command-center');
    
    console.log('✅ MobileNav initialized');
  },
  
  setupEventListeners() {
    // Mobile Cloud Status Click - Force Sync
    const mobileCloudStatus = document.getElementById('cloud-sync-status-mobile');
    if (mobileCloudStatus) {
      mobileCloudStatus.addEventListener('click', async () => {
        if (window.CloudSync && CloudSync.isInitialized) {
          if (window.NexusUI) {
            NexusUI.showToast({ type: 'info', title: 'Synchronisiere...', message: 'Lade Daten aus der Cloud' });
          }
          const success = await CloudSync.forceSync(window.NexusStore.state);
          if (success && window.NexusUI) {
            NexusUI.showToast({ type: 'success', title: '✅ Synchronisiert', message: 'Daten erfolgreich geladen' });
          }
          // Reload store to get latest cloud data
          if (window.NexusStore) {
            await NexusStore.reload();
          }
        }
      });
      // Make it look clickable
      mobileCloudStatus.style.cursor = 'pointer';
    }
    
    // Hamburger Menu Toggle
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (menuToggle) {
      menuToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleSidebar();
      });
    }
    
    if (overlay) {
      overlay.addEventListener('click', () => {
        this.closeSidebar();
      });
    }
    
    // Close sidebar on nav item click
    if (sidebar) {
      const navItems = sidebar.querySelectorAll('.nav-item');
      navItems.forEach(item => {
        item.addEventListener('click', () => {
          this.closeSidebar();
          // Also switch back to command center tab
          this.setActiveTab('command-center');
        });
      });
    }
    
    // Tab Bar
    const ccTab = document.getElementById('mobile-tab-command-center');
    const atlasTab = document.getElementById('mobile-tab-atlas');
    
    if (ccTab) {
      ccTab.addEventListener('click', (e) => {
        e.preventDefault();
        this.setActiveTab('command-center');
      });
    }
    
    if (atlasTab) {
      atlasTab.addEventListener('click', (e) => {
        e.preventDefault();
        this.setActiveTab('atlas');
      });
    }
    
    // Desktop Atlas toggle should work on mobile too
    const atlasToggle = document.getElementById('atlas-toggle');
    if (atlasToggle) {
      atlasToggle.addEventListener('click', () => {
        if (this.isMobile()) {
          this.setActiveTab('atlas');
        }
      });
    }
    
    // Handle escape key to close sidebar
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeSidebar();
      }
    });
    
    // Handle resize
    window.addEventListener('resize', () => {
      if (!this.isMobile()) {
        this.closeSidebar();
        // Reset atlas panel on desktop
        const atlasPanel = document.querySelector('.atlas-panel');
        if (atlasPanel) {
          atlasPanel.classList.remove('mobile-active');
        }
      }
    });
  },
  
  toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (!sidebar) return;
    
    const isOpen = sidebar.classList.contains('mobile-open');
    
    if (isOpen) {
      this.closeSidebar();
    } else {
      sidebar.classList.add('mobile-open');
      if (overlay) overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },
  
  closeSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
  },
  
  setActiveTab(tab) {
    this.currentTab = tab;
    
    const ccTab = document.getElementById('mobile-tab-command-center');
    const atlasTab = document.getElementById('mobile-tab-atlas');
    const mobileAtlasChat = document.getElementById('mobile-atlas-chat');
    const ccView = document.getElementById('page-command-center');
    const pageContent = document.querySelector('.page-content');
    
    console.log('📱 MobileNav: Setting active tab to', tab);
    console.log('📱 Elements found:', {
      ccTab: !!ccTab,
      atlasTab: !!atlasTab,
      mobileAtlasChat: !!mobileAtlasChat,
      pageContent: !!pageContent
    });
    
    if (tab === 'command-center') {
      // Activate Command Center
      if (ccTab) ccTab.classList.add('active');
      if (atlasTab) atlasTab.classList.remove('active');
      if (mobileAtlasChat) {
        mobileAtlasChat.classList.remove('active');
        mobileAtlasChat.style.display = 'none';
      }
      if (pageContent) {
        pageContent.style.display = '';
        pageContent.style.visibility = 'visible';
      }
      // Allow body scroll
      document.body.classList.remove('atlas-chat-open');
    } else if (tab === 'atlas') {
      // Activate Atlas
      if (atlasTab) atlasTab.classList.add('active');
      if (ccTab) ccTab.classList.remove('active');
      if (mobileAtlasChat) {
        mobileAtlasChat.classList.add('active');
        mobileAtlasChat.style.display = 'flex';
      }
      if (pageContent) {
        pageContent.style.display = 'none';
        pageContent.style.visibility = 'hidden';
      }
      // Lock body scroll when chat is open
      document.body.classList.add('atlas-chat-open');
      
      // Scroll messages to bottom
      const messagesContainer = document.getElementById('mobile-atlas-messages');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }
    
    // Refresh icons
    if (window.lucide) {
      setTimeout(() => lucide.createIcons(), 50);
    }
  },
  
  // Sync cloud status indicator between desktop and mobile
  syncCloudStatus() {
    const desktopStatus = document.getElementById('cloud-sync-status');
    const mobileStatus = document.getElementById('cloud-sync-status-mobile');
    
    if (!desktopStatus || !mobileStatus) return;
    
    // Initial sync
    this.copyCloudStatus(desktopStatus, mobileStatus);
    
    // Observe changes
    const observer = new MutationObserver(() => {
      this.copyCloudStatus(desktopStatus, mobileStatus);
    });
    
    observer.observe(desktopStatus, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['class']
    });
  },
  
  copyCloudStatus(source, target) {
    if (!source || !target) return;
    
    // Copy class
    target.className = source.className;
    
    // Copy icon
    const sourceIcon = source.querySelector('i');
    const targetIcon = target.querySelector('i');
    
    if (sourceIcon && targetIcon) {
      const iconName = sourceIcon.getAttribute('data-lucide');
      if (iconName) {
        targetIcon.setAttribute('data-lucide', iconName);
        if (window.lucide) lucide.createIcons();
      }
    }
  },
  
  setupMobileAtlas() {
    const sendBtn = document.getElementById('mobile-atlas-send-btn');
    const input = document.getElementById('mobile-atlas-input');
    const messagesContainer = document.getElementById('mobile-atlas-messages');
    const chatContainer = document.getElementById('mobile-atlas-chat');
    const inputArea = chatContainer?.querySelector('.mobile-atlas-input-area');
    const quickActions = document.querySelectorAll('.mobile-atlas-quick-action');
    
    if (!sendBtn || !input || !messagesContainer) {
      console.warn('Mobile Atlas elements not found');
      return;
    }
    
    // ═══ KEYBOARD HANDLING ═══
    // Use CSS custom property for keyboard height - cleaner than inline styles
    const setKeyboardHeight = (height) => {
      document.documentElement.style.setProperty('--keyboard-height', `${height}px`);
    };
    
    let isKeyboardOpen = false;
    let resizeTimeout = null;
    const initialHeight = window.innerHeight;
    
    // Debounced viewport resize handler
    const handleKeyboard = () => {
      if (!document.body.classList.contains('atlas-chat-open')) return;
      
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const keyboardHeight = Math.max(0, initialHeight - viewportHeight);
      const keyboardVisible = keyboardHeight > 150;
      
      if (keyboardVisible && !isKeyboardOpen) {
        // Keyboard just opened
        isKeyboardOpen = true;
        document.body.classList.add('keyboard-open');
        setKeyboardHeight(keyboardHeight - 40);
        
        // Scroll to bottom after transition
        setTimeout(() => {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
      } else if (keyboardVisible && isKeyboardOpen) {
        // Keyboard height changed (e.g., predictive text toggle)
        setKeyboardHeight(keyboardHeight - 40);
      } else if (!keyboardVisible && isKeyboardOpen) {
        // Keyboard closed
        isKeyboardOpen = false;
        document.body.classList.remove('keyboard-open');
        setKeyboardHeight(0);
      }
    };
    
    // Listen to viewport changes with debounce
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(handleKeyboard, 50);
      });
      
      // Prevent page scroll when keyboard opens
      window.visualViewport.addEventListener('scroll', () => {
        if (document.body.classList.contains('atlas-chat-open') && isKeyboardOpen) {
          window.scrollTo(0, 0);
        }
      });
    }
    
    // Focus/blur for immediate keyboard state
    input.addEventListener('focus', () => {
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        window.scrollTo(0, 0);
      }, 350);
    });
    
    input.addEventListener('blur', () => {
      // Delay to prevent flicker when tapping send button
      setTimeout(() => {
        if (document.activeElement !== input && !document.activeElement?.closest('.mobile-atlas-input-area')) {
          isKeyboardOpen = false;
          document.body.classList.remove('keyboard-open');
          setKeyboardHeight(0);
        }
      }, 150);
    });
    
    // Send on button click
    sendBtn.addEventListener('click', () => this.sendMobileMessage());
    
    // Send on Enter (but allow Shift+Enter for new line)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMobileMessage();
      }
    });
    
    // Auto-resize textarea as user types
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      const newHeight = Math.min(input.scrollHeight, 120);
      input.style.height = newHeight + 'px';
      // Scroll messages to bottom when input grows
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
    
    // Quick actions
    quickActions.forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.quickAction;
        this.handleQuickAction(action);
      });
    });
    
    // Scroll to bottom initially
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  },
  
  async sendMobileMessage() {
    const input = document.getElementById('mobile-atlas-input');
    const messagesContainer = document.getElementById('mobile-atlas-messages');
    
    if (!input || !messagesContainer) {
      console.error('📱 Mobile Atlas: Input or messages container not found');
      return;
    }
    
    const message = input.value.trim();
    if (!message) return;
    
    console.log('📱 Mobile Atlas: Sending message:', message);
    
    // Add user message
    this.addMobileMessage('user', message);
    input.value = '';
    input.style.height = 'auto';
    
    // Show loading
    const loadingId = this.addMobileMessage('assistant', '<div class="mobile-atlas-loading"><i data-lucide="loader-2" style="animation: spin 1s linear infinite;"></i> Atlas denkt...</div>');
    
    // Refresh icons for loading spinner
    if (window.lucide) lucide.createIcons();
    
    try {
      // Use the Atlas AI Service
      if (window.AtlasAI && AtlasAI.isConfigured()) {
        console.log('📱 Mobile Atlas: Using AtlasAI...');
        const response = await AtlasAI.sendMessage(message);
        console.log('📱 Mobile Atlas: Got response');
        
        // Remove loading and add response
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();
        
        // Format response with markdown support
        const formattedResponse = this.formatResponse(response);
        this.addMobileMessage('assistant', formattedResponse);
      } else if (window.AtlasAI && !AtlasAI.isConfigured()) {
        console.error('📱 Mobile Atlas: AtlasAI not configured (no API key)');
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();
        this.addMobileMessage('assistant', '⚠️ Kein API Key konfiguriert. Gehe zu <strong>Einstellungen → Atlas AI</strong> und füge deinen OpenAI API Key hinzu.');
      } else {
        console.error('📱 Mobile Atlas: AtlasAI not available');
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();
        this.addMobileMessage('assistant', '❌ AI Service nicht verfügbar. Bitte lade die Seite neu.');
      }
    } catch (error) {
      console.error('📱 Mobile Atlas error:', error);
      const loadingEl = document.getElementById(loadingId);
      if (loadingEl) loadingEl.remove();
      this.addMobileMessage('assistant', '❌ Fehler: ' + (error.message || 'Unbekannter Fehler'));
    }
  },
  
  formatResponse(text) {
    // Basic markdown formatting for mobile
    let formatted = text
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Line breaks
      .replace(/\n/g, '<br>')
      // Lists
      .replace(/^- (.*?)(<br>|$)/gm, '• $1$2');
    
    return formatted;
  },
  
  addMobileMessage(role, content) {
    const messagesContainer = document.getElementById('mobile-atlas-messages');
    if (!messagesContainer) return null;
    
    const id = 'msg-' + Date.now();
    const messageEl = document.createElement('div');
    messageEl.id = id;
    messageEl.className = `mobile-atlas-message ${role}`;
    messageEl.innerHTML = content;
    
    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return id;
  },
  
  async handleQuickAction(action) {
    const prompts = {
      'briefing': 'Gib mir mein Tagesbriefing. Was steht heute an?',
      'forgotten': 'Welche Tasks habe ich vergessen oder vernachlässigt?',
      'insights': 'Gib mir Insights zu meiner Produktivität.'
    };
    
    const prompt = prompts[action];
    if (prompt) {
      const input = document.getElementById('mobile-atlas-input');
      if (input) {
        input.value = prompt;
        this.sendMobileMessage();
      }
    }
  },
  
  isMobile() {
    return window.innerWidth <= 768;
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  MobileNav.init();
});

// Also try to init if DOM already loaded
if (document.readyState !== 'loading') {
  MobileNav.init();
}

// Export
window.MobileNav = MobileNav;
