/* ═══════════════════════════════════════════════════════════════════════════════
   NEXUS ULTRA - Atlas AI Service
   OpenAI Integration for Intelligent Assistance with Memory & Actions
   ═══════════════════════════════════════════════════════════════════════════════ */

const AtlasAI = {
  
  // API Configuration
  config: {
    model: 'gpt-4o-mini', // Cost-effective, fast model
    maxTokens: 1000,
    temperature: 0.7
  },
  
  // Conversation history for memory
  conversationHistory: [],
  maxHistoryLength: 20,
  
  // System prompts for different contexts
  systemPrompts: {
    operator: `Du bist Atlas, der intelligente Operator von NEXUS ULTRA - einem Life Operating System.

DEINE FÄHIGKEITEN:
Du kannst das System für den Nutzer bedienen. Wenn der Nutzer dich bittet, etwas zu tun, antworte mit speziellen Befehlen die das System ausführt.

VERFÜGBARE BEFEHLE (nutze exakt dieses Format):
[ACTION:ADD_TASK:{"title":"Task Titel","priority":"normal|high|critical","sphere":"geschaeft|projekte|schule|sport|freizeit","dueDate":"YYYY-MM-DD oder null"}]
[ACTION:COMPLETE_TASK:{"id":"task-id"}]
[ACTION:ADD_HABIT:{"name":"Habit Name","frequency":"daily|weekly","sphere":"..."}]
[ACTION:ADD_PROJECT:{"name":"Projekt Name","description":"..."}]
[ACTION:NAVIGATE:{"page":"command-center|tasks|habits|projects|calendar|settings"}]
[ACTION:SHOW_TASKS]
[ACTION:SHOW_HABITS]
[ACTION:SHOW_SUMMARY]

KONTEXT-INFOS DIE DU ERHÄLTST:
- Aktuelle Tasks, Habits, Projekte
- Heutiges Datum und Uhrzeit
- Überfällige Aufgaben

RICHTLINIEN:
- Führe Aktionen aus wenn der Nutzer darum bittet
- Gib immer eine kurze Bestätigung nach einer Aktion
- Sei freundlich, professionell und hilfsbereit
- Antworte IMMER auf Deutsch
- Erinnere dich an vorherige Nachrichten in dieser Konversation
- Wenn du eine Aktion ausführst, schreibe den Befehl UND eine natürliche Antwort`,

    briefing: `Du bist Atlas, der persönliche AI-Assistent in NEXUS ULTRA - einem Life Operating System.
Deine Aufgabe ist es, dem Nutzer einen hilfreichen, motivierenden Morgen-Briefing zu geben.

Richtlinien:
- Sei warm, persönlich aber professionell
- Nutze Emojis sparsam aber effektiv
- Gib konkrete, actionable Empfehlungen
- Berücksichtige Prioritäten und Deadlines
- Identifiziere potenzielle Konflikte oder Überbelastung
- Sprich Deutsch

Format dein Briefing so:
1. Kurze Begrüßung passend zur Tageszeit
2. Überblick: Tasks, Meetings, Habits
3. Top-Priorität des Tages
4. Ein konkreter Tipp oder Empfehlung
5. Motivierender Abschluss`,

    taskSuggestion: `Du bist Atlas, ein AI-Assistent für Produktivität.
Basierend auf den aktuellen Tasks und Projekten, schlage sinnvolle nächste Schritte vor.
Sei konkret und actionable. Antworte auf Deutsch.`,

    weeklyReview: `Du bist Atlas, ein AI-Assistent für Life Management.
Erstelle eine Wochenübersicht mit:
- Erreichte Ziele
- Habit-Statistiken
- Verbesserungsvorschläge
- Fokus für nächste Woche
Sei analytisch aber motivierend. Antworte auf Deutsch.`,

    smartParse: `Du bist ein Parser für natürliche Sprache.
Extrahiere aus dem Input strukturierte Task-Informationen.
Antworte NUR mit validem JSON im Format:
{
  "title": "Task Titel",
  "type": "task|event|habit|note|idea",
  "priority": "critical|high|normal|low",
  "sphere": "geschaeft|projekte|schule|sport|freizeit|null",
  "project": "Projektname oder null",
  "dueDate": "YYYY-MM-DD oder null",
  "estimatedTime": "Minuten als Zahl oder null",
  "tags": ["tag1", "tag2"]
}`
  },
  
  // Build current context for the AI
  buildContext() {
    const tasks = NexusStore.getTasks();
    const openTasks = tasks.filter(t => t.status !== 'completed');
    const habits = NexusStore.getHabits();
    const projects = NexusStore.getProjects();
    const today = new Date().toISOString().split('T')[0];
    
    const overdueTasks = openTasks.filter(t => t.dueDate && t.dueDate < today);
    const todayTasks = openTasks.filter(t => t.dueDate && t.dueDate.startsWith(today));
    
    return `
AKTUELLER KONTEXT:
Datum: ${new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
Uhrzeit: ${new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}

OFFENE TASKS (${openTasks.length} total):
${openTasks.slice(0, 10).map(t => `- [${t.id}] "${t.title}" (${t.priority}, ${t.sphere || 'allgemein'}${t.dueDate ? `, fällig: ${t.dueDate}` : ''})`).join('\n') || 'Keine offenen Tasks'}
${openTasks.length > 10 ? `... und ${openTasks.length - 10} weitere` : ''}

ÜBERFÄLLIG (${overdueTasks.length}):
${overdueTasks.map(t => `- "${t.title}" seit ${t.dueDate}`).join('\n') || 'Keine überfälligen Tasks'}

HEUTE FÄLLIG (${todayTasks.length}):
${todayTasks.map(t => `- "${t.title}"`).join('\n') || 'Keine Tasks für heute'}

HABITS (${habits.length}):
${habits.map(h => `- "${h.name}" (${h.frequency}, Streak: ${h.streak || 0})`).join('\n') || 'Keine Habits'}

PROJEKTE (${projects.length}):
${projects.map(p => `- "${p.name}"`).join('\n') || 'Keine Projekte'}
`;
  },
  
  // Clear conversation history
  clearHistory() {
    this.conversationHistory = [];
  },
  
  // Check if API key is configured
  isConfigured() {
    return !!this.getApiKey();
  },
  
  // Check if API key exists (alias)
  hasApiKey() {
    return this.isConfigured();
  },
  
  // Get API key from settings
  getApiKey() {
    const settings = NexusStore.getSettings();
    return settings.apiKey || null;
  },
  
  // Save API key
  setApiKey(key) {
    NexusStore.updateSettings('apiKey', key);
  },
  
  // Remove API key
  removeApiKey() {
    NexusStore.updateSettings('apiKey', '');
  },
  
  // Test API connection
  async testConnection() {
    if (!this.isConfigured()) {
      return { success: false, error: 'Kein API Key konfiguriert' };
    }
    
    try {
      const response = await this.chat([
        { role: 'user', content: 'Antworte nur mit "OK"' }
      ], { maxTokens: 10 });
      
      return { success: true, message: 'Verbindung erfolgreich!' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Simple chat with string input (for Atlas panel) - WITH MEMORY & ACTIONS
  async sendMessage(userMessage, options = {}) {
    // Build context with current system state
    const context = this.buildContext();
    
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage
    });
    
    // Trim history if too long
    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
    }
    
    // Build messages array with system prompt, context, and history
    const messages = [
      {
        role: 'system',
        content: this.systemPrompts.operator + '\n\n' + context
      },
      ...this.conversationHistory
    ];
    
    const response = await this.chat(messages, options);
    
    // Add assistant response to history
    this.conversationHistory.push({
      role: 'assistant',
      content: response
    });
    
    // Parse and execute any actions in the response
    const { cleanResponse, actions } = this.parseActions(response);
    
    // Execute actions
    for (const action of actions) {
      await this.executeAction(action);
    }
    
    return cleanResponse;
  },
  
  // Parse action commands from AI response
  parseActions(response) {
    const actionRegex = /\[ACTION:([A-Z_]+)(?::(.+?))?\]/g;
    const actions = [];
    let cleanResponse = response;
    
    let match;
    while ((match = actionRegex.exec(response)) !== null) {
      const actionType = match[1];
      let actionData = null;
      
      if (match[2]) {
        try {
          actionData = JSON.parse(match[2]);
        } catch (e) {
          actionData = match[2];
        }
      }
      
      actions.push({ type: actionType, data: actionData });
      cleanResponse = cleanResponse.replace(match[0], '');
    }
    
    return { cleanResponse: cleanResponse.trim(), actions };
  },
  
  // Execute an action command
  async executeAction(action) {
    console.log('🤖 Atlas executing action:', action.type, action.data);
    
    switch (action.type) {
      case 'ADD_TASK':
        if (action.data && action.data.title) {
          const newTask = NexusStore.addTask({
            title: action.data.title,
            priority: action.data.priority || 'normal',
            spheres: action.data.sphere ? [action.data.sphere] : ['freizeit'],
            deadline: action.data.dueDate || null,
            scheduledDate: action.data.dueDate || null // Also set scheduledDate for calendar
          });
          console.log('✅ Task created:', newTask);
          // Refresh UI
          if (typeof NexusApp !== 'undefined') {
            NexusApp.refreshCurrentPage();
            NexusApp.updateSidebarBadges();
          }
        }
        break;
        
      case 'COMPLETE_TASK':
        if (action.data && action.data.id) {
          NexusStore.completeTask(action.data.id);
          if (typeof NexusApp !== 'undefined') {
            NexusApp.refreshCurrentPage();
            NexusApp.updateSidebarBadges();
          }
        }
        break;
        
      case 'ADD_HABIT':
        if (action.data && action.data.name) {
          NexusStore.addHabit({
            name: action.data.name,
            frequency: action.data.frequency || 'daily',
            sphere: action.data.sphere || 'freizeit'
          });
          if (typeof NexusApp !== 'undefined') {
            NexusApp.refreshCurrentPage();
          }
        }
        break;
        
      case 'ADD_PROJECT':
        if (action.data && action.data.name) {
          NexusStore.addProject({
            name: action.data.name,
            description: action.data.description || ''
          });
          if (typeof NexusApp !== 'undefined') {
            NexusApp.refreshCurrentPage();
          }
        }
        break;
        
      case 'NAVIGATE':
        if (action.data && action.data.page && typeof NexusApp !== 'undefined') {
          NexusApp.navigateTo(action.data.page);
          NexusApp.closeAtlas();
        }
        break;
        
      case 'SHOW_TASKS':
      case 'SHOW_HABITS':
      case 'SHOW_SUMMARY':
        // These are informational - response already contains the info
        break;
        
      default:
        console.warn('Unknown action type:', action.type);
    }
  },
  
  // Core chat function (expects messages array)
  async chat(messages, options = {}) {
    const apiKey = this.getApiKey();
    
    if (!apiKey) {
      throw new Error('OpenAI API Key nicht konfiguriert. Gehe zu Einstellungen.');
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: options.model || this.config.model,
        messages: messages,
        max_tokens: options.maxTokens || this.config.maxTokens,
        temperature: options.temperature ?? this.config.temperature
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API Fehler');
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  },
  
  // Generate morning briefing
  async generateMorningBriefing() {
    const tasks = NexusStore.getTasks().filter(t => t.status !== 'completed');
    const habits = NexusStore.getHabits();
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's tasks
    const todayTasks = tasks.filter(t => {
      if (!t.dueDate) return false;
      return t.dueDate.startsWith(today);
    });
    
    // Get overdue tasks
    const overdueTasks = tasks.filter(t => {
      if (!t.dueDate) return false;
      return t.dueDate < today;
    });
    
    // Get this week's tasks
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekTasks = tasks.filter(t => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return d <= weekEnd;
    });
    
    // Get habit completion status
    const habitStatus = habits.map(h => ({
      name: h.name,
      streak: h.streak || 0,
      completedToday: h.completedDates?.includes(today) || false
    }));
    
    // Get ventures/projects
    const ventures = NexusStore.getVentures();
    const activeVentures = ventures.filter(v => v.status === 'active');
    
    // Build context for AI
    const context = `
DATUM: ${new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
UHRZEIT: ${new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}

TASKS HEUTE (${todayTasks.length}):
${todayTasks.map(t => `- [${t.priority}] ${t.title} (${t.sphere || 'allgemein'})${t.estimatedTime ? ` ~${t.estimatedTime}min` : ''}`).join('\n') || 'Keine Tasks für heute geplant'}

ÜBERFÄLLIGE TASKS (${overdueTasks.length}):
${overdueTasks.map(t => `- ${t.title} (fällig: ${t.dueDate})`).join('\n') || 'Keine überfälligen Tasks'}

DIESE WOCHE (${weekTasks.length} Tasks gesamt)

HABITS (${habits.length}):
${habitStatus.map(h => `- ${h.name}: ${h.completedToday ? '✓ Erledigt' : '○ Ausstehend'} (Streak: ${h.streak} Tage)`).join('\n') || 'Keine Habits definiert'}

AKTIVE VENTURES (${activeVentures.length}):
${activeVentures.map(v => `- ${v.name}`).join('\n') || 'Keine aktiven Ventures'}

GESAMTE GEPLANTE ZEIT HEUTE: ${todayTasks.reduce((sum, t) => sum + (t.estimatedTime || 0), 0)} Minuten
`;
    
    const messages = [
      { role: 'system', content: this.systemPrompts.briefing },
      { role: 'user', content: context }
    ];
    
    return await this.chat(messages, { maxTokens: 500 });
  },
  
  // Get task suggestions
  async getTaskSuggestions() {
    const tasks = NexusStore.getTasks().filter(t => t.status !== 'completed');
    const projects = NexusStore.getProjects();
    const ventures = NexusStore.getVentures();
    
    const context = `
OFFENE TASKS:
${tasks.slice(0, 20).map(t => `- ${t.title} (${t.project || 'Kein Projekt'}, ${t.priority})`).join('\n')}

PROJEKTE:
${projects.map(p => `- ${p.name}: ${p.description || ''}`).join('\n')}

VENTURES:
${ventures.map(v => `- ${v.name}: ${v.description || ''}`).join('\n')}

Schlage 3-5 sinnvolle nächste Tasks vor, die fehlen könnten.
Format: Eine Task pro Zeile mit kurzem Grund.
`;
    
    const messages = [
      { role: 'system', content: this.systemPrompts.taskSuggestion },
      { role: 'user', content: context }
    ];
    
    return await this.chat(messages, { maxTokens: 400 });
  },
  
  // Generate weekly review
  async generateWeeklyReview() {
    const tasks = NexusStore.getTasks();
    const habits = NexusStore.getHabits();
    const snapshots = NexusStore.getSnapshots();
    
    // Last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];
    
    // Completed this week
    const completedThisWeek = tasks.filter(t => {
      if (t.status !== 'completed') return false;
      return t.completedAt && t.completedAt >= weekAgoStr;
    });
    
    // Habit stats
    const habitStats = habits.map(h => {
      const completedDates = h.completedDates || [];
      const thisWeek = completedDates.filter(d => d >= weekAgoStr).length;
      return {
        name: h.name,
        completedThisWeek: thisWeek,
        target: 7,
        percentage: Math.round((thisWeek / 7) * 100)
      };
    });
    
    const context = `
WOCHENRÜCKBLICK (${weekAgoStr} bis heute)

ERLEDIGTE TASKS (${completedThisWeek.length}):
${completedThisWeek.map(t => `- ${t.title}`).join('\n') || 'Keine Tasks erledigt'}

HABIT-STATISTIKEN:
${habitStats.map(h => `- ${h.name}: ${h.completedThisWeek}/7 Tage (${h.percentage}%)`).join('\n') || 'Keine Habits'}

Erstelle eine motivierende aber ehrliche Wochenübersicht.
`;
    
    const messages = [
      { role: 'system', content: this.systemPrompts.weeklyReview },
      { role: 'user', content: context }
    ];
    
    return await this.chat(messages, { maxTokens: 600 });
  },
  
  // Smart parse with AI enhancement
  async smartParse(input) {
    const messages = [
      { role: 'system', content: this.systemPrompts.smartParse },
      { role: 'user', content: input }
    ];
    
    try {
      const response = await this.chat(messages, { 
        maxTokens: 200,
        temperature: 0.3 // More deterministic for parsing
      });
      
      // Parse JSON response
      const parsed = JSON.parse(response);
      return parsed;
    } catch (error) {
      console.error('AI parse failed, using local parser:', error);
      // Fallback to local parser
      return SmartParser.parse(input);
    }
  },
  
  // Ask Atlas anything
  async ask(question, context = null) {
    const systemPrompt = `Du bist Atlas, der AI-Assistent in NEXUS ULTRA.
Du hilfst bei Produktivität, Planung und Life Management.
Sei hilfreich, konkret und freundlich. Antworte auf Deutsch.
${context ? `\nKontext:\n${context}` : ''}`;
    
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question }
    ];
    
    return await this.chat(messages);
  }
};

// Export
window.AtlasAI = AtlasAI;
