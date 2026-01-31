/* ═══════════════════════════════════════════════════════════════════════════════
   NEXUS ULTRA - Data Store
   Zentrale Datenverwaltung mit LocalStorage Persistenz
   ═══════════════════════════════════════════════════════════════════════════════ */

// Memory fallback when localStorage is blocked
const MemoryStorage = {
  _data: {},
  getItem(key) { return this._data[key] || null; },
  setItem(key, value) { this._data[key] = value; },
  removeItem(key) { delete this._data[key]; }
};

// Check if localStorage is available
function getStorage() {
  try {
    localStorage.setItem('__test__', '1');
    localStorage.removeItem('__test__');
    return localStorage;
  } catch (e) {
    console.warn('⚠️ LocalStorage blocked, using memory storage (data will not persist)');
    return MemoryStorage;
  }
}

const storage = getStorage();

const NexusStore = {
  // Store key for localStorage
  STORAGE_KEY: 'nexus_ultra_data',
  
  // Current state
  state: {
    // User settings
    user: {
      name: 'Mateo',
      email: '',
      preferences: {
        theme: 'dark',
        startPage: 'command-center',
        defaultSphere: 'freizeit'
      }
    },
    
    // Life Spheres
    spheres: [
      { id: 'geschaeft', name: 'Geschäft', color: '#4A7C94', icon: '💼' },
      { id: 'projekte', name: 'Projekte', color: '#7C6A94', icon: '🚀' },
      { id: 'schule', name: 'Schule', color: '#94854A', icon: '📚' },
      { id: 'sport', name: 'Sport', color: '#4A946A', icon: '🏃' },
      { id: 'freizeit', name: 'Freizeit', color: '#6B6862', icon: '⚪' }
    ],
    
    // All entities
    tasks: [],
    habits: [],
    projects: [],
    ventures: [],
    goals: [],
    bucketItems: [],
    notes: [],
    events: [],
    contacts: [],
    markedDays: [], // Feiertage, Urlaub, Ferien, Besuche etc.
    
    // Snapshots
    snapshots: [],
    
    // Current view state
    currentPage: 'command-center',
    selectedDate: new Date().toISOString().split('T')[0]
  },
  
  // Listeners for state changes
  listeners: [],
  
  // Initialize store
  init() {
    this.load();
    this.seedDemoData();
    return this;
  },
  
  // Load from localStorage
  load() {
    try {
      const saved = storage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = { ...this.state, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load state:', e);
    }
  },
  
  // Save to localStorage
  save() {
    try {
      storage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save state:', e);
    }
  },
  
  // Subscribe to changes
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  },
  
  // Notify listeners
  notify(action, data) {
    this.listeners.forEach(listener => listener(action, data, this.state));
  },
  
  // Generate unique ID
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },
  
  // ═══ TASKS ═══
  
  getTasks() {
    return this.state.tasks;
  },
  
  getTaskById(id) {
    return this.state.tasks.find(t => t.id === id);
  },
  
  getTasksForDate(date) {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    return this.state.tasks.filter(t => {
      if (!t.scheduledDate) return false;
      return t.scheduledDate.split('T')[0] === dateStr;
    });
  },
  
  getTasksByStatus(status) {
    return this.state.tasks.filter(t => t.status === status);
  },
  
  getOverdueTasks() {
    const today = new Date().toISOString().split('T')[0];
    return this.state.tasks.filter(t => 
      t.status !== 'completed' && 
      t.deadline && 
      t.deadline < today
    );
  },
  
  addTask(taskData) {
    const task = {
      id: this.generateId(),
      title: taskData.title,
      description: taskData.description || '',
      status: 'pending',
      priority: taskData.priority || 'normal',
      spheres: taskData.spheres || ['freizeit'],
      projectId: taskData.projectId || null,
      deadline: taskData.deadline || null,
      scheduledDate: taskData.scheduledDate || null,
      scheduledTime: taskData.scheduledTime || null,
      timeEstimate: taskData.timeEstimate || null,
      timeActual: null,
      dependencies: taskData.dependencies || [],
      tags: taskData.tags || [],
      checklist: taskData.checklist || [],
      linkedNotes: taskData.linkedNotes || [],
      linkedContacts: taskData.linkedContacts || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null
    };
    
    this.state.tasks.push(task);
    this.save();
    this.notify('task:added', task);
    return task;
  },
  
  updateTask(id, updates) {
    const index = this.state.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      this.state.tasks[index] = {
        ...this.state.tasks[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.save();
      this.notify('task:updated', this.state.tasks[index]);
      return this.state.tasks[index];
    }
    return null;
  },
  
  completeTask(id) {
    return this.updateTask(id, {
      status: 'completed',
      completedAt: new Date().toISOString()
    });
  },
  
  deleteTask(id) {
    const index = this.state.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      const task = this.state.tasks.splice(index, 1)[0];
      this.save();
      this.notify('task:deleted', task);
      return task;
    }
    return null;
  },
  
  // ═══ HABITS ═══
  
  getHabits() {
    return this.state.habits;
  },
  
  getHabitById(id) {
    return this.state.habits.find(h => h.id === id);
  },
  
  addHabit(habitData) {
    const habit = {
      id: this.generateId(),
      name: habitData.name,
      description: habitData.description || '',
      icon: habitData.icon || '⚡',
      frequency: habitData.frequency || habitData.interval || 'daily',
      scheduledDays: habitData.scheduledDays || null, // For weekly habits: [0-6] (0=Sunday)
      preferredTime: habitData.preferredTime || null,
      flexibility: habitData.flexibility || 30,
      spheres: habitData.spheres || (habitData.sphere ? [habitData.sphere] : ['freizeit']),
      sphere: habitData.sphere || 'freizeit',
      streak: 0,
      bestStreak: 0,
      completionLog: [],
      linkedGoals: habitData.linkedGoals || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.state.habits.push(habit);
    this.save();
    this.notify('habit:added', habit);
    return habit;
  },
  
  completeHabit(id, date = new Date().toISOString()) {
    const habit = this.getHabitById(id);
    if (habit) {
      const dateStr = date.split('T')[0];
      if (!habit.completionLog.includes(dateStr)) {
        habit.completionLog.push(dateStr);
        habit.streak = this.calculateStreak(habit);
        if (habit.streak > habit.bestStreak) {
          habit.bestStreak = habit.streak;
        }
        habit.updatedAt = new Date().toISOString();
        this.save();
        this.notify('habit:completed', habit);
      }
      return habit;
    }
    return null;
  },
  
  calculateStreak(habit) {
    const log = habit.completionLog.sort().reverse();
    if (log.length === 0) return 0;
    
    let streak = 0;
    let currentDate = new Date();
    
    for (let i = 0; i < log.length; i++) {
      const logDate = new Date(log[i]);
      const diffDays = Math.floor((currentDate - logDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        streak++;
        currentDate = logDate;
      } else {
        break;
      }
    }
    
    return streak;
  },
  
  isHabitCompletedToday(id) {
    const habit = this.getHabitById(id);
    if (!habit) return false;
    const today = new Date().toISOString().split('T')[0];
    return habit.completionLog.includes(today);
  },
  
  updateHabit(id, updates) {
    const index = this.state.habits.findIndex(h => h.id === id);
    if (index !== -1) {
      this.state.habits[index] = {
        ...this.state.habits[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.save();
      this.notify('habit:updated', this.state.habits[index]);
      return this.state.habits[index];
    }
    return null;
  },
  
  deleteHabit(id) {
    const index = this.state.habits.findIndex(h => h.id === id);
    if (index !== -1) {
      const habit = this.state.habits.splice(index, 1)[0];
      this.save();
      this.notify('habit:deleted', habit);
      return habit;
    }
    return null;
  },
  
  // ═══ PROJECTS ═══
  
  getProjects() {
    return this.state.projects;
  },
  
  getProjectById(id) {
    return this.state.projects.find(p => p.id === id);
  },
  
  getActiveProjects() {
    return this.state.projects.filter(p => p.status === 'active');
  },
  
  addProject(projectData) {
    const project = {
      id: this.generateId(),
      name: projectData.name,
      description: projectData.description || '',
      status: projectData.status || 'active',
      spheres: projectData.spheres || [],
      phases: projectData.phases || [],
      milestones: projectData.milestones || [],
      actionItems: [],
      team: projectData.team || [],
      variables: projectData.variables || {},
      startDate: projectData.startDate || new Date().toISOString(),
      targetEnd: projectData.targetEnd || null,
      progress: 0,
      linkedNotes: [],
      linkedContacts: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.state.projects.push(project);
    this.save();
    this.notify('project:added', project);
    return project;
  },
  
  updateProject(id, updates) {
    const index = this.state.projects.findIndex(p => p.id === id);
    if (index !== -1) {
      this.state.projects[index] = {
        ...this.state.projects[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.save();
      this.notify('project:updated', this.state.projects[index]);
      return this.state.projects[index];
    }
    return null;
  },
  
  deleteProject(id) {
    const index = this.state.projects.findIndex(p => p.id === id);
    if (index !== -1) {
      const project = this.state.projects.splice(index, 1)[0];
      this.save();
      this.notify('project:deleted', project);
      return project;
    }
    return null;
  },
  
  // ═══ VENTURES ═══
  
  getVentures() {
    return this.state.ventures;
  },
  
  getVentureById(id) {
    return this.state.ventures.find(v => v.id === id);
  },
  
  addVenture(ventureData) {
    const venture = {
      id: this.generateId(),
      name: ventureData.name,
      description: ventureData.description || '',
      status: ventureData.status || 'active',
      spheres: ventureData.spheres || ['geschaeft', 'projekte'],
      roadmap: ventureData.roadmap || [],
      roiProjection: ventureData.roiProjection || null,
      riskMatrix: ventureData.riskMatrix || [],
      bestCase: ventureData.bestCase || '',
      worstCase: ventureData.worstCase || '',
      barriers: ventureData.barriers || [],
      pivotOptions: ventureData.pivotOptions || [],
      evaluation: ventureData.evaluation || {},
      progress: 0,
      effortInvested: 0,
      effortRemaining: null,
      team: [],
      linkedProjects: [],
      linkedNotes: [],
      linkedGoals: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.state.ventures.push(venture);
    this.save();
    this.notify('venture:added', venture);
    return venture;
  },
  
  // ═══ GOALS ═══
  
  getGoals() {
    return this.state.goals;
  },
  
  addGoal(goalData) {
    const goal = {
      id: this.generateId(),
      title: goalData.title,
      description: goalData.description || '',
      horizon: goalData.horizon || '1-year',
      spheres: goalData.spheres || [],
      realizationPath: goalData.realizationPath || [],
      linkedProjects: [],
      linkedHabits: [],
      progress: 0,
      yearlyMilestones: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.state.goals.push(goal);
    this.save();
    this.notify('goal:added', goal);
    return goal;
  },
  
  // ═══ NOTES ═══
  
  getNotes() {
    return this.state.notes;
  },
  
  addNote(noteData) {
    const note = {
      id: this.generateId(),
      content: noteData.content,
      type: noteData.type || 'note',
      canvasPosition: noteData.canvasPosition || null,
      linkedEntities: noteData.linkedEntities || [],
      tags: noteData.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.state.notes.push(note);
    this.save();
    this.notify('note:added', note);
    return note;
  },
  
  // ═══ CONTACTS ═══
  
  getContacts() {
    return this.state.contacts;
  },
  
  addContact(contactData) {
    const contact = {
      id: this.generateId(),
      name: contactData.name,
      email: contactData.email || '',
      phone: contactData.phone || '',
      role: contactData.role || '',
      company: contactData.company || '',
      category: contactData.category || null,
      address: contactData.address || '',
      linkedProjects: [],
      notes: contactData.notes || '',
      lastContact: null,
      interactions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.state.contacts.push(contact);
    this.save();
    this.notify('contact:added', contact);
    return contact;
  },
  
  updateContact(id, updates) {
    const index = this.state.contacts.findIndex(c => c.id === id);
    if (index !== -1) {
      this.state.contacts[index] = {
        ...this.state.contacts[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.save();
      this.notify('contact:updated', this.state.contacts[index]);
      return this.state.contacts[index];
    }
    return null;
  },
  
  deleteContact(id) {
    const index = this.state.contacts.findIndex(c => c.id === id);
    if (index !== -1) {
      const contact = this.state.contacts.splice(index, 1)[0];
      this.save();
      this.notify('contact:deleted', contact);
      return contact;
    }
    return null;
  },
  
  // ═══ MARKED DAYS (Feiertage, Urlaub, Besuche, etc.) ═══
  
  getMarkedDays() {
    return this.state.markedDays || [];
  },
  
  getMarkedDaysForDate(dateStr) {
    return this.getMarkedDays().filter(d => d.date === dateStr);
  },
  
  getMarkedDaysInRange(startDate, endDate) {
    return this.getMarkedDays().filter(d => d.date >= startDate && d.date <= endDate);
  },
  
  addMarkedDay(markedDayData) {
    const markedDay = {
      id: this.generateId(),
      date: markedDayData.date, // YYYY-MM-DD
      endDate: markedDayData.endDate || null, // For multi-day events like Urlaub
      title: markedDayData.title,
      type: markedDayData.type || 'event', // holiday, vacation, visit, birthday, event
      color: markedDayData.color || this.getMarkedDayColor(markedDayData.type),
      icon: markedDayData.icon || this.getMarkedDayIcon(markedDayData.type),
      recurring: markedDayData.recurring || null, // yearly, monthly, null
      notes: markedDayData.notes || '',
      createdAt: new Date().toISOString()
    };
    
    if (!this.state.markedDays) this.state.markedDays = [];
    this.state.markedDays.push(markedDay);
    this.save();
    this.notify('markedDay:added', markedDay);
    return markedDay;
  },
  
  getMarkedDayColor(type) {
    const colors = {
      holiday: '#FF6B6B',     // Feiertag - Rot
      vacation: '#4ECDC4',    // Urlaub - Türkis
      visit: '#95E1D3',       // Besuch - Hellgrün
      birthday: '#F38181',    // Geburtstag - Rosa
      event: '#7C6A94',       // Event - Lila
      school_break: '#FFE66D' // Schulferien - Gelb
    };
    return colors[type] || colors.event;
  },
  
  getMarkedDayIcon(type) {
    const icons = {
      holiday: '🎉',
      vacation: '🏖️',
      visit: '👥',
      birthday: '🎂',
      event: '📅',
      school_break: '🎒'
    };
    return icons[type] || icons.event;
  },
  
  updateMarkedDay(id, updates) {
    const index = this.state.markedDays.findIndex(d => d.id === id);
    if (index !== -1) {
      this.state.markedDays[index] = {
        ...this.state.markedDays[index],
        ...updates
      };
      this.save();
      this.notify('markedDay:updated', this.state.markedDays[index]);
      return this.state.markedDays[index];
    }
    return null;
  },
  
  deleteMarkedDay(id) {
    const index = this.state.markedDays.findIndex(d => d.id === id);
    if (index !== -1) {
      const markedDay = this.state.markedDays.splice(index, 1)[0];
      this.save();
      this.notify('markedDay:deleted', markedDay);
      return markedDay;
    }
    return null;
  },
  
  // ═══ SNAPSHOTS ═══
  
  createSnapshot() {
    const today = new Date().toISOString().split('T')[0];
    const existingIndex = this.state.snapshots.findIndex(s => s.date === today);
    
    const snapshot = {
      date: today,
      tasksCompleted: this.state.tasks.filter(t => t.completedAt?.startsWith(today)).length,
      tasksTotal: this.getTasksForDate(today).length,
      habitsCompleted: this.state.habits.filter(h => h.completionLog.includes(today)).length,
      habitsTotal: this.state.habits.length,
      projectProgress: this.state.projects.map(p => ({ id: p.id, progress: p.progress })),
      sphereTime: {},
      energy: null,
      mood: null,
      notes: '',
      createdAt: new Date().toISOString()
    };
    
    if (existingIndex !== -1) {
      this.state.snapshots[existingIndex] = snapshot;
    } else {
      this.state.snapshots.push(snapshot);
    }
    
    this.save();
    return snapshot;
  },
  
  // ═══ DEMO DATA ═══
  
  seedDemoData() {
    // No longer auto-seeds - user can choose during onboarding
  },
  
  // Create sample data if user wants it during onboarding
  createSampleData() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Sample project
    const project = this.addProject({
      name: 'Beispiel Projekt',
      description: 'Ein Beispielprojekt zum Erkunden der Features',
      spheres: ['projekte'],
      status: 'active'
    });
    
    // Sample habits
    this.addHabit({
      name: 'Sport',
      icon: '🏃',
      interval: 'daily',
      preferredTime: '07:00',
      spheres: ['sport'],
      completionLog: []
    });
    
    this.addHabit({
      name: 'Lesen',
      icon: '📖',
      interval: 'daily',
      preferredTime: '20:00',
      spheres: ['freizeit'],
      completionLog: []
    });
    
    // Sample tasks
    this.addTask({
      title: 'Willkommen bei NEXUS ULTRA! 👋',
      description: 'Klicke auf das Häkchen um diese Task als erledigt zu markieren.',
      spheres: ['freizeit'],
      priority: 'normal',
      scheduledDate: todayStr
    });
    
    this.addTask({
      title: 'Erkunde die verschiedenen Module',
      description: 'Nutze die Sidebar links um zwischen den verschiedenen Ansichten zu wechseln.',
      spheres: ['freizeit'],
      priority: 'low',
      scheduledDate: tomorrowStr
    });
    
    this.save();
  },

  generateStreakDates(days) {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  },
  
  // Clear all data
  clearAll() {
    console.log('🗑️ Clearing ALL NEXUS data...');
    
    // Clear localStorage completely (not just nexus keys, to be thorough)
    try {
      // First, remove known keys explicitly
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem('nexus_onboarding_complete');
      localStorage.removeItem('nexus_atlas_api_key');
      localStorage.removeItem('nexus_atlas_model');
      
      // Then remove any other keys that might be nexus-related
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.toLowerCase().includes('nexus')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => {
        console.log('  Removing:', k);
        localStorage.removeItem(k);
      });
      
      console.log('✅ LocalStorage cleared');
    } catch (e) {
      console.warn('Could not clear localStorage:', e);
    }
    
    // Also clear MemoryStorage if it was used
    if (MemoryStorage._data) {
      MemoryStorage._data = {};
      console.log('✅ MemoryStorage cleared');
    }
    
    // Reset in-memory state completely
    this.state = {
      user: { name: '', email: '', preferences: { theme: 'dark', startPage: 'command-center', defaultSphere: 'freizeit' }},
      spheres: [
        { id: 'geschaeft', name: 'Geschäft', color: '#4A7C94', icon: '💼' },
        { id: 'projekte', name: 'Projekte', color: '#7C6A94', icon: '🚀' },
        { id: 'schule', name: 'Schule', color: '#94854A', icon: '📚' },
        { id: 'sport', name: 'Sport', color: '#4A946A', icon: '🏃' },
        { id: 'freizeit', name: 'Freizeit', color: '#6B6862', icon: '⚪' }
      ],
      tasks: [],
      habits: [],
      projects: [],
      ventures: [],
      goals: [],
      bucketItems: [],
      notes: [],
      events: [],
      contacts: [],
      inbox: [],
      snapshots: [],
      currentPage: 'command-center',
      selectedDate: new Date().toISOString().split('T')[0]
    };
    
    console.log('✅ In-memory state reset');
    console.log('🔄 Reloading page...');
    
    // Force a hard reload to clear any cached state
    location.href = location.href.split('?')[0] + '?cleared=' + Date.now();
  },
  
  // ═══ SETTINGS ═══
  
  getSettings() {
    return {
      user: this.state.user,
      apiKey: storage.getItem('nexus_atlas_api_key') || '',
      aiModel: storage.getItem('nexus_atlas_model') || 'gpt-4o-mini'
    };
  },
  
  updateSettings(key, value) {
    if (key === 'apiKey') {
      storage.setItem('nexus_atlas_api_key', value);
    } else if (key === 'aiModel') {
      storage.setItem('nexus_atlas_model', value);
    } else if (key === 'user') {
      this.state.user = { ...this.state.user, ...value };
      this.save();
    } else if (key === 'user.preferences') {
      this.state.user.preferences = { ...this.state.user.preferences, ...value };
      this.save();
    } else if (key === 'spheres') {
      this.state.spheres = value;
      this.save();
    }
    this.notify('settings:updated', { key, value });
  },
  
  // ═══ INBOX ═══
  
  getInboxItems() {
    return this.state.inbox || [];
  },
  
  addInboxItem(item) {
    if (!this.state.inbox) this.state.inbox = [];
    
    const inboxItem = {
      id: this.generateId(),
      content: item.content,
      type: item.type || 'note',
      source: item.source || 'manual',
      processed: false,
      createdAt: new Date().toISOString()
    };
    
    this.state.inbox.push(inboxItem);
    this.save();
    this.notify('inbox:added', inboxItem);
    return inboxItem;
  },
  
  processInboxItem(id, targetType, targetData) {
    const index = this.state.inbox?.findIndex(i => i.id === id);
    if (index === -1) return null;
    
    const item = this.state.inbox[index];
    
    // Convert to target type
    if (targetType === 'task') {
      this.addTask({ title: item.content, ...targetData });
    } else if (targetType === 'note') {
      this.addNote({ content: item.content, ...targetData });
    } else if (targetType === 'project') {
      this.addProject({ name: item.content, ...targetData });
    }
    
    // Remove from inbox
    this.state.inbox.splice(index, 1);
    this.save();
    this.notify('inbox:processed', item);
    return item;
  },
  
  deleteInboxItem(id) {
    const index = this.state.inbox?.findIndex(i => i.id === id);
    if (index !== -1) {
      const item = this.state.inbox.splice(index, 1)[0];
      this.save();
      this.notify('inbox:deleted', item);
      return item;
    }
    return null;
  },
  
  // ═══ EXPORT / IMPORT ═══
  
  exportAll() {
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: this.state,
      settings: {
        apiKey: localStorage.getItem('nexus_atlas_api_key') || '',
        aiModel: localStorage.getItem('nexus_atlas_model') || ''
      }
    };
  },
  
  importAll(data) {
    try {
      if (!data || !data.data) {
        throw new Error('Invalid import data');
      }
      
      this.state = { ...this.state, ...data.data };
      this.save();
      
      if (data.settings?.apiKey) {
        localStorage.setItem('nexus_atlas_api_key', data.settings.apiKey);
      }
      if (data.settings?.aiModel) {
        localStorage.setItem('nexus_atlas_model', data.settings.aiModel);
      }
      
      this.notify('data:imported', data);
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  },
  
  // Storage info
  getStorageInfo() {
    const data = localStorage.getItem(this.STORAGE_KEY) || '';
    const bytes = new Blob([data]).size;
    const kb = (bytes / 1024).toFixed(1);
    const maxKb = 5120; // 5MB localStorage limit
    
    return {
      used: bytes,
      usedKb: parseFloat(kb),
      maxKb,
      percentage: Math.round((bytes / (maxKb * 1024)) * 100),
      counts: {
        tasks: this.state.tasks.length,
        habits: this.state.habits.length,
        projects: this.state.projects.length,
        notes: this.state.notes.length,
        contacts: this.state.contacts.length,
        ventures: this.state.ventures.length,
        goals: this.state.goals.length
      }
    };
  }
};

// Export
window.NexusStore = NexusStore.init();
