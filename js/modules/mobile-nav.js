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
    this.syncCloudStatus();
    
    // Set initial state
    this.setActiveTab('command-center');
    
    console.log('✅ MobileNav initialized');
  },
  
  setupEventListeners() {
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
    const atlasPanel = document.querySelector('.atlas-panel');
    const ccView = document.getElementById('page-command-center');
    
    if (tab === 'command-center') {
      // Activate Command Center
      if (ccTab) ccTab.classList.add('active');
      if (atlasTab) atlasTab.classList.remove('active');
      if (atlasPanel) atlasPanel.classList.remove('mobile-active');
      if (ccView) ccView.style.display = '';
    } else if (tab === 'atlas') {
      // Activate Atlas
      if (atlasTab) atlasTab.classList.add('active');
      if (ccTab) ccTab.classList.remove('active');
      if (atlasPanel) atlasPanel.classList.add('mobile-active');
      if (ccView) ccView.style.display = 'none';
      
      // Focus atlas input
      setTimeout(() => {
        const atlasInput = document.getElementById('atlas-input');
        if (atlasInput && this.isMobile()) {
          // Don't auto-focus on mobile to prevent keyboard popup
        }
      }, 300);
    }
    
    // Refresh icons
    if (window.lucide) {
      lucide.createIcons();
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
