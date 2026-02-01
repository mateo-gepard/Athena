/* ═══════════════════════════════════════════════════════════════════════════════
   NEXUS ULTRA - Cloud Sync Service
   Firebase Realtime Database for cloud storage with localStorage cache
   ═══════════════════════════════════════════════════════════════════════════════ */

const CloudSync = {
  // Firebase configuration
  firebaseConfig: {
    apiKey: "AIzaSyBR0ecmgOa-rUVEzWi2SiUXEuyfoLRJRPw",
    authDomain: "athena-1df6d.firebaseapp.com",
    databaseURL: "https://athena-1df6d-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "athena-1df6d",
    storageBucket: "athena-1df6d.firebasestorage.app",
    messagingSenderId: "687796502304",
    appId: "1:687796502304:web:7097f4cd395af831b46145",
    measurementId: "G-E3WSL6SJ6T"
  },
  
  // State
  isInitialized: false,
  isOnline: true,
  isSyncing: false,
  lastSyncTime: null,
  userId: null,
  database: null,
  listeners: [],
  
  // Debounce timer for saves
  saveTimeout: null,
  SAVE_DEBOUNCE_MS: 1000,
  
  // Delete all cloud data for current user
  async deleteAll() {
    if (!this.isInitialized || !this.database || !this.userId) return false;
    try {
      await this.database.ref(`users/${this.userId}`).remove();
      return true;
    } catch (e) {
      console.error('Cloud delete failed:', e);
      return false;
    }
  },
  
  // Initialize Firebase
  async init() {
    try {
      // Check if Firebase is loaded
      if (typeof firebase === 'undefined') {
        console.warn('⚠️ Firebase SDK not loaded, falling back to localStorage only');
        this.isOnline = false;
        this.notifyStatus();
        return false;
      }
      
      // Check if already initialized
      if (!firebase.apps.length) {
        firebase.initializeApp(this.firebaseConfig);
      }
      
      this.database = firebase.database();
      
      // Generate or load user ID (anonymous user identifier)
      this.userId = this.getUserId();
      
      // Set up online/offline detection
      this.setupConnectivityListener();
      
      this.isInitialized = true;
      console.log('☁️ Cloud Sync initialized for user:', this.userId);
      
      this.notifyStatus();
      return true;
    } catch (error) {
      console.error('❌ Cloud Sync init failed:', error);
      this.isOnline = false;
      this.notifyStatus();
      return false;
    }
  },
  
  // Get or create anonymous user ID
  getUserId() {
    let userId = localStorage.getItem('nexus_cloud_user_id');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('nexus_cloud_user_id', userId);
    }
    return userId;
  },
  
  // Setup connectivity listener
  setupConnectivityListener() {
    if (!this.database) return;
    
    const connectedRef = this.database.ref('.info/connected');
    connectedRef.on('value', (snap) => {
      this.isOnline = snap.val() === true;
      console.log('☁️ Cloud connection:', this.isOnline ? 'Online' : 'Offline');
      this.notifyStatus();
    });
    
    // Also listen for browser online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyStatus();
      // Sync any pending changes
      if (typeof NexusStore !== 'undefined') {
        this.saveToCloud(NexusStore.state);
      }
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyStatus();
    });
  },
  
  // Subscribe to status changes
  onStatusChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  },
  
  // Notify status listeners
  notifyStatus() {
    const status = {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      isInitialized: this.isInitialized
    };
    this.listeners.forEach(cb => cb(status));
    
    // Update UI indicator
    this.updateStatusIndicator();
  },
  
  // Update visual status indicator
  updateStatusIndicator() {
    const indicator = document.getElementById('cloud-sync-status');
    if (!indicator) return;
    
    if (this.isSyncing) {
      indicator.className = 'cloud-status syncing';
      indicator.title = 'Synchronisiere...';
      indicator.innerHTML = '<i data-lucide="cloud-upload"></i>';
    } else if (this.isOnline) {
      indicator.className = 'cloud-status online';
      indicator.title = `Cloud verbunden. Letzte Sync: ${this.lastSyncTime ? new Date(this.lastSyncTime).toLocaleTimeString('de-DE') : 'nie'}`;
      indicator.innerHTML = '<i data-lucide="cloud"></i>';
    } else {
      indicator.className = 'cloud-status offline';
      indicator.title = 'Offline - Daten werden lokal gespeichert';
      indicator.innerHTML = '<i data-lucide="cloud-off"></i>';
    }
    
    // Refresh Lucide icons
    if (window.lucide) {
      lucide.createIcons({ icons: lucide.icons, nameAttr: 'data-lucide' });
    }
  },
  
  // Sanitize data - remove undefined values (Firebase doesn't accept them)
  sanitizeData(obj) {
    if (obj === null || obj === undefined) return null;
    if (typeof obj !== 'object') return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeData(item));
    }
    
    const cleaned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && obj[key] !== undefined) {
        cleaned[key] = this.sanitizeData(obj[key]);
      }
    }
    return cleaned;
  },
  
  // Save to cloud (debounced)
  saveToCloud(data) {
    if (!this.isInitialized || !this.isOnline || !this.database) {
      return Promise.resolve(false);
    }
    
    // Clear existing timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    // Debounce saves to avoid too many writes
    return new Promise((resolve) => {
      this.saveTimeout = setTimeout(async () => {
        try {
          this.isSyncing = true;
          this.notifyStatus();
          
          const userRef = this.database.ref(`users/${this.userId}/data`);
          
          // Sanitize data to remove undefined values
          const cleanData = this.sanitizeData(data);
          
          // Save with timestamp
          await userRef.set({
            ...cleanData,
            _lastUpdated: firebase.database.ServerValue.TIMESTAMP,
            _version: Date.now()
          });
          
          this.lastSyncTime = Date.now();
          this.isSyncing = false;
          this.notifyStatus();
          
          console.log('☁️ Saved to cloud at', new Date().toLocaleTimeString());
          resolve(true);
        } catch (error) {
          console.error('❌ Cloud save failed:', error);
          this.isSyncing = false;
          this.notifyStatus();
          resolve(false);
        }
      }, this.SAVE_DEBOUNCE_MS);
    });
  },
  
  // Load from cloud
  async loadFromCloud() {
    if (!this.isInitialized || !this.isOnline || !this.database) {
      return null;
    }
    
    try {
      this.isSyncing = true;
      this.notifyStatus();
      
      const userRef = this.database.ref(`users/${this.userId}/data`);
      const snapshot = await userRef.once('value');
      const data = snapshot.val();
      
      this.isSyncing = false;
      this.lastSyncTime = Date.now();
      this.notifyStatus();
      
      if (data) {
        console.log('☁️ Loaded from cloud, version:', data._version);
        // Remove metadata before returning
        delete data._lastUpdated;
        delete data._version;
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Cloud load failed:', error);
      this.isSyncing = false;
      this.notifyStatus();
      return null;
    }
  },
  
  // Setup real-time sync listener
  setupRealtimeSync(onDataChange) {
    if (!this.isInitialized || !this.database) return;
    
    const userRef = this.database.ref(`users/${this.userId}/data`);
    
    userRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data && onDataChange) {
        // Remove metadata
        delete data._lastUpdated;
        delete data._version;
        onDataChange(data);
      }
    });
  },
  
  // Force sync now
  async forceSync(data) {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    
    // Temporarily set debounce to 0
    const originalDebounce = this.SAVE_DEBOUNCE_MS;
    this.SAVE_DEBOUNCE_MS = 0;
    
    const result = await this.saveToCloud(data);
    
    this.SAVE_DEBOUNCE_MS = originalDebounce;
    return result;
  },
  
  // Export data as JSON (backup)
  exportData(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },
  
  // Import data from JSON (restore)
  async importData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          resolve(data);
        } catch (error) {
          reject(new Error('Invalid JSON file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
};

// Export
window.CloudSync = CloudSync;
