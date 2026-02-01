/* ═══════════════════════════════════════════════════════════════════════════════
   NEXUS ULTRA - Cloud Sync Service (CLEANED)
   Minimal cloud sync wrapper. Expects `window.NEXUS_FIREBASE_CONFIG` to be provided
   in a local non-committed file `js/config.local.js`.
   DO NOT PUT SECRETS IN THE REPOSITORY.
   ═══════════════════════════════════════════════════════════════════════════════ */

const CloudSync = {
  firebaseConfig: (typeof window !== 'undefined' && window.NEXUS_FIREBASE_CONFIG) ? window.NEXUS_FIREBASE_CONFIG : {
    apiKey: "REPLACE_ME",
    authDomain: "REPLACE_ME",
    databaseURL: "REPLACE_ME",
    projectId: "REPLACE_ME",
    storageBucket: "REPLACE_ME",
    messagingSenderId: "REPLACE_ME",
    appId: "REPLACE_ME",
    measurementId: "REPLACE_ME"
  },

  isInitialized: false,
  isOnline: true,
  isSyncing: false,
  lastSyncTime: null,
  userId: null,
  database: null,
  listeners: [],

  SAVE_DEBOUNCE_MS: 1000,
  saveTimeout: null,

  async init() {
    if (typeof firebase === 'undefined') {
      console.warn('Firebase SDK not loaded');
      this.isOnline = false;
      this.notifyStatus();
      return false;
    }
    if (!firebase.apps.length) {
      firebase.initializeApp(this.firebaseConfig);
    }
    this.database = firebase.database();
    this.userId = this.getUserId();
    this.setupConnectivityListener();
    this.isInitialized = true;
    this.notifyStatus();
    return true;
  },

  getUserId() {
    let userId = localStorage.getItem('nexus_cloud_user_id');
    if (!userId) { userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2,9); localStorage.setItem('nexus_cloud_user_id', userId); }
    return userId;
  },

  setupConnectivityListener() {
    if (!this.database) return;
    const connectedRef = this.database.ref('.info/connected');
    connectedRef.on('value', (snap) => { this.isOnline = snap.val() === true; this.notifyStatus(); });
    window.addEventListener('online', () => { this.isOnline = true; this.notifyStatus(); if (typeof NexusStore !== 'undefined') this.saveToCloud(NexusStore.state); });
    window.addEventListener('offline', () => { this.isOnline = false; this.notifyStatus(); });
  },

  notifyStatus() { this.listeners.forEach(cb => cb({ isOnline: this.isOnline, isSyncing: this.isSyncing, lastSyncTime: this.lastSyncTime })); this.updateStatusIndicator(); },

  updateStatusIndicator() { const indicator = document.getElementById('cloud-sync-status'); if (!indicator) return; if (this.isSyncing) { indicator.className='cloud-status syncing'; indicator.title='Synchronisiere...'; indicator.innerHTML = '<i data-lucide="cloud-upload"></i>'; } else if (this.isOnline) { indicator.className='cloud-status online'; indicator.title = `Cloud verbunden. Letzte Sync: ${this.lastSyncTime? new Date(this.lastSyncTime).toLocaleString() : 'nie'}`; indicator.innerHTML = '<i data-lucide="cloud"></i>'; } else { indicator.className='cloud-status offline'; indicator.title='Offline - Daten lokal'; indicator.innerHTML = '<i data-lucide="cloud-off"></i>'; } if (window.lucide) lucide.createIcons({ icons: lucide.icons, nameAttr: 'data-lucide' }); },

  async saveToCloud(data) {
    if (!this.isInitialized || !this.isOnline || !this.database) return false;
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    return new Promise((resolve) => {
      this.saveTimeout = setTimeout(async () => {
        try {
          this.isSyncing = true; this.notifyStatus();
          const userRef = this.database.ref(`users/${this.userId}/data`);
          await userRef.set({ ...data, _lastUpdated: firebase.database.ServerValue.TIMESTAMP, _version: Date.now() });
          this.lastSyncTime = Date.now(); this.isSyncing = false; this.notifyStatus(); resolve(true);
        } catch (e) { console.error('Cloud save failed', e); this.isSyncing=false; this.notifyStatus(); resolve(false); }
      }, this.SAVE_DEBOUNCE_MS);
    });
  },

  async loadFromCloud() { if (!this.isInitialized || !this.isOnline || !this.database) return null; try { this.isSyncing=true; this.notifyStatus(); const userRef = this.database.ref(`users/${this.userId}/data`); const snap = await userRef.once('value'); this.isSyncing=false; this.lastSyncTime=Date.now(); this.notifyStatus(); const data = snap.val(); if (data) { delete data._lastUpdated; delete data._version; return data; } return null; } catch (e) { console.error('Cloud load failed', e); this.isSyncing=false; this.notifyStatus(); return null; } },

  onStatusChange(cb) { this.listeners.push(cb); return () => { this.listeners = this.listeners.filter(x=>x!==cb); }; },

  exportData(data) { const blob = new Blob([JSON.stringify(data,null,2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=`nexus-backup-${new Date().toISOString().split('T')[0]}.json`; a.click(); URL.revokeObjectURL(url); }
};

window.CloudSync = CloudSync;
