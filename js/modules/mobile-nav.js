/* ═══════════════════════════════════════════════════════════════════════════════
   Athena Ultra - Mobile Navigation
   Hamburger Menu und Tab Bar für Mobile
   ═══════════════════════════════════════════════════════════════════════════════ */

const MobileNav = {
  
  init() {
    this.setupEventListeners();
    this.syncCloudStatus();
  },
  
  setupEventListeners() {
    // Hamburger Menu Toggle
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (menuToggle && sidebar && overlay) {
      menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
        overlay.classList.toggle('active');
      });
      
      // Close on overlay click
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
      });
      
      // Close on nav item click
      const navItems = sidebar.querySelectorAll('.nav-item');
      navItems.forEach(item => {
        item.addEventListener('click', () => {
          sidebar.classList.remove('mobile-open');
          overlay.classList.remove('active');
        });
      });
    }
    
    // Mobile Tab Bar (Command Center / Atlas)
    const ccTab = document.getElementById('mobile-tab-command-center');
    const atlasTab = document.getElementById('mobile-tab-atlas');
    const atlasPanel = document.querySelector('.atlas-panel');
    const ccView = document.getElementById('page-command-center');
    
    if (ccTab && atlasTab && atlasPanel) {
      ccTab.addEventListener('click', () => {
        ccTab.classList.add('active');
        atlasTab.classList.remove('active');
        atlasPanel.classList.remove('mobile-active');
        if (ccView) ccView.style.display = 'block';
      });
      
      atlasTab.addEventListener('click', () => {
        atlasTab.classList.add('active');
        ccTab.classList.remove('active');
        atlasPanel.classList.add('mobile-active');
        if (ccView) ccView.style.display = 'none';
      });
    }
    
    // Sync Atlas toggle button with mobile tab
    const atlasToggle = document.getElementById('atlas-toggle');
    if (atlasToggle && atlasTab) {
      atlasToggle.addEventListener('click', () => {
        // On mobile, switch to Atlas tab
        if (window.innerWidth <= 768) {
          atlasTab.click();
        }
      });
    }
  },
  
  // Sync cloud status between desktop and mobile
  syncCloudStatus() {
    const desktopStatus = document.getElementById('cloud-sync-status');
    const mobileStatus = document.getElementById('cloud-sync-status-mobile');
    
    if (!desktopStatus || !mobileStatus) return;
    
    // Create observer to watch desktop status changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          mobileStatus.className = desktopStatus.className;
        }
      });
    });
    
    observer.observe(desktopStatus, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    // Initial sync
    mobileStatus.className = desktopStatus.className;
    
    // Also sync icon changes
    const iconObserver = new MutationObserver(() => {
      const desktopIcon = desktopStatus.querySelector('i');
      const mobileIcon = mobileStatus.querySelector('i');
      if (desktopIcon && mobileIcon) {
        mobileIcon.setAttribute('data-lucide', desktopIcon.getAttribute('data-lucide'));
        if (window.lucide) lucide.createIcons();
      }
    });
    
    iconObserver.observe(desktopStatus, {
      childList: true,
      subtree: true
    });
  },
  
  // Check if mobile view
  isMobile() {
    return window.innerWidth <= 768;
  }
};

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => MobileNav.init());
} else {
  MobileNav.init();
}

// Export
window.MobileNav = MobileNav;
