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

[ACTION:ADD_TASK:{"title":"Task Titel","description":"Beschreibung oder null","priority":"low|normal|high|critical","sphere":"geschaeft|projekte|schule|sport|freizeit","projectId":"projekt-id oder null","dueDate":"YYYY-MM-DD oder null","time":"HH:MM oder null","timeEstimate":60,"tags":["tag1","tag2"]}]

[ACTION:COMPLETE_TASK:{"id":"task-id"}]
[ACTION:ADD_HABIT:{"name":"Habit Name","frequency":"daily|weekly","scheduledDays":[1,2,3],"sphere":"..."}]
[ACTION:ADD_PROJECT:{"name":"Projekt Name","description":"..."}]
[ACTION:NAVIGATE:{"page":"command-center|tasks|habits|projects|calendar|settings"}]
[ACTION:SHOW_TASKS]
[ACTION:SHOW_HABITS]
[ACTION:SHOW_SUMMARY]

HABIT PARAMETER:
- scheduledDays: Nur für weekly habits - Array von Wochentagen [0-6] (0=Sonntag, 1=Montag, ..., 6=Samstag)
  Beispiele: "jeden Dienstag" → scheduledDays:[2], "Mo/Mi/Fr" → scheduledDays:[1,3,5]

TASK PARAMETER ERKLÄRUNG:
- title: Pflichtfeld - Titel der Task
- description: Optional - Detaillierte Beschreibung
- priority: low, normal, high, critical (Standard: normal)
- sphere: Lebensbereich (geschaeft, projekte, schule, sport, freizeit)
- projectId: Wenn Task zu einem Projekt gehört, nutze die Projekt-ID aus dem Kontext
- dueDate: Fälligkeitsdatum im Format YYYY-MM-DD
- time: Uhrzeit im Format HH:MM (z.B. "14:00")
- timeEstimate: Geschätzte Dauer in Minuten (z.B. 30, 60, 120)
- tags: Array von Tags zur Kategorisierung

ZEIT-INTERPRETATION:
- "um 14 Uhr" → time: "14:00"
- "morgen früh" → dueDate: morgen, time: "09:00"
- "heute nachmittag" → dueDate: heute, time: "14:00"
- "in 2 Stunden" → berechne die Zeit
- "dauert etwa 1 Stunde" → timeEstimate: 60

KONTEXT-INFOS DIE DU ERHÄLTST:
- Aktuelle Tasks, Habits, Projekte (mit IDs)
- Heutiges Datum und Uhrzeit
- Überfällige Aufgaben

RICHTLINIEN:
- Führe Aktionen aus wenn der Nutzer darum bittet
- Gib immer eine kurze Bestätigung nach einer Aktion
- Sei freundlich, professionell und hilfsbereit
- Antworte IMMER auf Deutsch
- Erinnere dich an vorherige Nachrichten in dieser Konversation
- Wenn du eine Aktion ausführst, schreibe den Befehl UND eine natürliche Antwort
- Setze nur die Parameter die der Nutzer erwähnt, andere können null sein`,

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
    const completedToday = tasks.filter(t => {
      const today = new Date().toISOString().split('T')[0];
      return t.completedAt && t.completedAt.startsWith(today);
    });
    const habits = NexusStore.getHabits();
    const projects = NexusStore.getProjects();
    const ventures = NexusStore.getVentures();
    const goals = NexusStore.state.goals || [];
    const today = new Date().toISOString().split('T')[0];
    
    const overdueTasks = openTasks.filter(t => {
      const dueDate = t.scheduledDate || t.deadline;
      return dueDate && dueDate < today;
    });
    const todayTasks = openTasks.filter(t => {
      const dueDate = t.scheduledDate || t.deadline;
      return dueDate && dueDate.startsWith(today);
    });
    const thisWeekTasks = openTasks.filter(t => {
      const dueDate = t.scheduledDate || t.deadline;
      if (!dueDate) return false;
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() + 7);
      return dueDate <= weekEnd.toISOString().split('T')[0];
    });
    
    // Calculate total time for today
    const totalMinutes = todayTasks.reduce((sum, t) => sum + (t.timeEstimate || 0), 0);
    const totalHours = (totalMinutes / 60).toFixed(1);
    
    // Habit status
    const completedHabits = habits.filter(h => NexusStore.isHabitCompletedToday(h.id));
    const highestStreak = habits.reduce((max, h) => h.streak > max.streak ? h : max, { streak: 0 });
    
    return `
AKTUELLER KONTEXT:
Datum: ${new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
Uhrzeit: ${new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}

TASKS ÜBERBLICK:
- Gesamt offen: ${openTasks.length}
- Heute fällig: ${todayTasks.length} (ca. ${totalHours}h geplant)
- Überfällig: ${overdueTasks.length}
- Diese Woche: ${thisWeekTasks.length}
- Heute erledigt: ${completedToday.length}

ÜBERFÄLLIGE TASKS (${overdueTasks.length}):
${overdueTasks.slice(0, 5).map(t => `- [${t.priority.toUpperCase()}] "${t.title}" (seit ${t.scheduledDate || t.deadline})`).join('\n') || 'Keine überfälligen Tasks'}
${overdueTasks.length > 5 ? `... und ${overdueTasks.length - 5} weitere` : ''}

HEUTE FÄLLIG (${todayTasks.length}):
${todayTasks.map(t => `- [${t.priority.toUpperCase()}] "${t.title}"${t.scheduledTime ? ` um ${t.scheduledTime}` : ''}${t.timeEstimate ? ` (~${t.timeEstimate}min)` : ''}`).join('\n') || 'Keine Tasks für heute'}

DIESE WOCHE (Top 10):
${thisWeekTasks.slice(0, 10).map(t => `- "${t.title}" (${t.priority}, ${t.scheduledDate || t.deadline})`).join('\n') || 'Keine Tasks diese Woche'}

HEUTE ERLEDIGT (${completedToday.length}):
${completedToday.slice(0, 5).map(t => `- "${t.title}"`).join('\n') || 'Noch nichts erledigt'}

HABITS (${habits.length}):
${habits.map(h => `- ${h.icon || '🔄'} "${h.name}" (${h.frequency}, Streak: ${h.streak || 0} Tage)${NexusStore.isHabitCompletedToday(h.id) ? ' ✓ Heute erledigt' : ''}`).join('\n') || 'Keine Habits'}
${habits.length > 0 ? `\nHöchster Streak: ${highestStreak.name} mit ${highestStreak.streak} Tagen!` : ''}
${habits.length > 0 ? `\nHeute erledigt: ${completedHabits.length}/${habits.length}` : ''}

PROJEKTE (${projects.length}):
${projects.slice(0, 8).map(p => {
  const projectTasks = tasks.filter(t => t.projectId === p.id);
  const completedProjectTasks = projectTasks.filter(t => t.status === 'completed').length;
  return `- "${p.name}" (${completedProjectTasks}/${projectTasks.length} Tasks erledigt)`;
}).join('\n') || 'Keine Projekte'}

VENTURES (${ventures.length}):
${ventures.map(v => `- 🚀 "${v.name}" - ${v.description}`).join('\n') || 'Keine Ventures'}

ZIELE (${goals.length}):
${goals.slice(0, 5).map(g => `- 🎯 "${g.title}" (${g.progress || 0}%)`).join('\n') || 'Keine Ziele definiert'}
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
    // Match action commands - handle nested JSON with arrays
    const actions = [];
    let cleanResponse = response;
    
    // Find all [ACTION:TYPE: patterns and extract the JSON that follows
    const actionStartRegex = /\[ACTION:([A-Z_]+)(?::)?/g;
    let match;
    
    while ((match = actionStartRegex.exec(response)) !== null) {
      const actionType = match[1];
      const startIndex = match.index;
      let actionData = null;
      let fullMatch = match[0];
      
      // Check if there's a colon and JSON data after the action type
      const afterMatch = response.slice(match.index + match[0].length);
      
      if (afterMatch.startsWith('{')) {
        // Find the matching closing brace, accounting for nested braces and arrays
        let braceCount = 0;
        let bracketCount = 0;
        let inString = false;
        let escapeNext = false;
        let endIndex = -1;
        
        for (let i = 0; i < afterMatch.length; i++) {
          const char = afterMatch[i];
          
          if (escapeNext) {
            escapeNext = false;
            continue;
          }
          
          if (char === '\\') {
            escapeNext = true;
            continue;
          }
          
          if (char === '"' && !escapeNext) {
            inString = !inString;
            continue;
          }
          
          if (!inString) {
            if (char === '{') braceCount++;
            if (char === '}') braceCount--;
            if (char === '[') bracketCount++;
            if (char === ']' && bracketCount > 0) bracketCount--;
            
            if (braceCount === 0 && bracketCount === 0) {
              endIndex = i + 1;
              break;
            }
          }
        }
        
        if (endIndex > 0) {
          const jsonStr = afterMatch.slice(0, endIndex);
          fullMatch = `[ACTION:${actionType}:${jsonStr}]`;
          
          console.log('📋 Parsing action:', actionType, 'Raw JSON:', jsonStr);
          
          try {
            actionData = JSON.parse(jsonStr);
            console.log('   ✓ Parsed JSON:', actionData);
          } catch (e) {
            console.warn('   ⚠️ JSON parse failed:', e.message);
          }
        }
      } else {
        // No JSON data, just the action type
        fullMatch = `[ACTION:${actionType}]`;
        console.log('📋 Parsing action (no data):', actionType);
      }
      
      actions.push({ type: actionType, data: actionData });
      cleanResponse = cleanResponse.replace(fullMatch, '');
    }
    
    return { cleanResponse: cleanResponse.trim(), actions };
  },
  
  // Execute an action command
  async executeAction(action) {
    console.log('🤖 Atlas executing action:', action.type);
    console.log('   Action data:', JSON.stringify(action.data));
    
    switch (action.type) {
      case 'ADD_TASK':
        if (action.data && action.data.title) {
          const newTask = NexusStore.addTask({
            title: action.data.title,
            description: action.data.description || '',
            priority: action.data.priority || 'normal',
            spheres: action.data.sphere ? [action.data.sphere] : ['freizeit'],
            projectId: action.data.projectId && action.data.projectId !== 'null' ? action.data.projectId : null,
            deadline: action.data.dueDate || null,
            scheduledDate: action.data.dueDate || null,
            scheduledTime: action.data.time || null,
            timeEstimate: action.data.timeEstimate || null,
            tags: action.data.tags || [],
            checklist: action.data.checklist || [],
            dependencies: action.data.dependencies || [],
            linkedNotes: action.data.linkedNotes || [],
            linkedContacts: action.data.linkedContacts || []
          });
          console.log('✅ Task created:', newTask.title, '| ID:', newTask.id, '| Time:', newTask.scheduledTime, '| Estimate:', newTask.timeEstimate);
          // Refresh UI
          if (typeof NexusApp !== 'undefined') {
            NexusApp.refreshCurrentPage();
            NexusApp.updateSidebarBadges();
          }
        } else {
          console.warn('⚠️ ADD_TASK failed - missing data or title:', action.data);
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
            scheduledDays: action.data.scheduledDays || null,
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
  },
  
  // Generate Morning Briefing
  async generateMorningBriefing() {
    const context = this.buildContext();
    
    const prompt = `${context}

Erstelle ein motivierendes, prägnantes Morgen-Briefing für den heutigen Tag. 

ANFORDERUNGEN:
- Persönlich und motivierend
- Zeige die 3-5 wichtigsten Tasks von heute
- Erwähne überfällige Tasks falls vorhanden (aber ermutigend!)
- Gib einen kurzen Fokus-Tipp für den Tag
- Würdige erledigte Habits vom Vortag
- Max. 200 Wörter
- Benutze Emojis sparsam aber passend
- Schließe mit einer motivierenden Frage oder Aufgabe ab

FORMAT (HTML):
<div class="ai-briefing">
  <h4>[Persönliche Begrüßung mit Tageszeit]</h4>
  <p>[Überblick]</p>
  <div class="priority-tasks">
    <strong>Heute wichtig:</strong>
    <ul>
      <li>[Task 1]</li>
      <li>[Task 2]</li>
      ...
    </ul>
  </div>
  <p class="focus-tip">[Fokus-Tipp]</p>
  <p class="motivation">[Motivierende Frage]</p>
</div>`;
    
    const messages = [
      { role: 'system', content: 'Du bist Atlas, der persönliche AI-Coach in NEXUS ULTRA. Erstelle motivierende, präzise Morgen-Briefings.' },
      { role: 'user', content: prompt }
    ];
    
    return await this.chat(messages, { maxTokens: 500, temperature: 0.8 });
  },
  
  // Generate Evening Summary
  async generateEveningSummary() {
    const context = this.buildContext();
    
    const prompt = `${context}

Erstelle eine reflektive, wertschätzende Abend-Zusammenfassung des heutigen Tages.

ANFORDERUNGEN:
- Würdige erledigte Tasks (auch wenn wenige)
- Zeige Habit-Erfolge
- Kurzer Ausblick auf morgen
- Ermutigend bei unerledigten Tasks
- Max. 150 Wörter
- Benutze Emojis sparsam
- Schließe mit einer positiven Note

FORMAT (HTML):
<div class="ai-summary">
  <h4>[Abend-Begrüßung]</h4>
  <p>[Tages-Rückblick]</p>
  <div class="accomplishments">
    <strong>Heute geschafft:</strong>
    <ul>
      <li>[Erledigt 1]</li>
      ...
    </ul>
  </div>
  <p class="tomorrow">[Ausblick morgen]</p>
  <p class="goodnight">[Positive Abschluss-Note]</p>
</div>`;
    
    const messages = [
      { role: 'system', content: 'Du bist Atlas, der persönliche AI-Coach in NEXUS ULTRA. Erstelle wertschätzende, reflektive Abend-Zusammenfassungen.' },
      { role: 'user', content: prompt }
    ];
    
    return await this.chat(messages, { maxTokens: 400, temperature: 0.8 });
  },
  
  // Generate Atlas Insights
  async generateInsights(timeframe = 'week') {
    const context = this.buildContext();
    
    const prompt = `${context}

Analysiere die Produktivitätsmuster und erstelle umsetzbare Insights.

ANFORDERUNGEN:
- Erkenne Muster in Task-Erledigung
- Identifiziere Bottlenecks oder überfällige Bereiche
- Gib 2-3 konkrete Optimierungsvorschläge
- Erkenne Habit-Streaks und motiviere
- Beachte Projekt-Fortschritte
- Max. 250 Wörter
- Sei spezifisch, nicht generisch
- Benutze Daten aus dem Kontext

FORMAT (HTML):
<div class="ai-insights">
  <h4>📊 Atlas Insights</h4>
  
  <div class="insight-section">
    <h5>🎯 Produktivitätsmuster</h5>
    <p>[Muster-Analyse]</p>
  </div>
  
  <div class="insight-section">
    <h5>💡 Optimierungsvorschläge</h5>
    <ul>
      <li>[Vorschlag 1]</li>
      <li>[Vorschlag 2]</li>
    </ul>
  </div>
  
  <div class="insight-section">
    <h5>🔥 Streaks & Erfolge</h5>
    <p>[Habit-Erfolge]</p>
  </div>
  
  <p class="action-item">[Nächster konkreter Schritt]</p>
</div>`;
    
    const messages = [
      { role: 'system', content: 'Du bist Atlas, der datengetriebene AI-Analyst in NEXUS ULTRA. Erstelle präzise, umsetzbare Insights basierend auf echten Nutzer-Daten.' },
      { role: 'user', content: prompt }
    ];
    
    return await this.chat(messages, { maxTokens: 600, temperature: 0.7 });
  }
};

// Export
window.AtlasAI = AtlasAI;
