/* ═══════════════════════════════════════════════════════════════════════════════
   NEXUS ULTRA - Smart Parser
   Universal Capture Engine mit intelligenter Syntax-Erkennung
   ═══════════════════════════════════════════════════════════════════════════════ */

const SmartParser = {
  
  // Modifier Patterns
  patterns: {
    // @projektname → Projekt-Verknüpfung
    project: /@(\w+)/g,
    
    // #sphäre → Lebensbereich
    sphere: /#(\w+)/g,
    
    // !!! / !! / ! → Priorität
    priority: /(!{1,3})(?!\w)/g,
    
    // +täglich/wöchentlich/monatlich → Wiederkehrend
    recurring: /\+(\w+)/g,
    
    // bis [datum] → Deadline
    deadline: /\bbis\s+(\w+)/gi,
    
    // ~[zeit] → Geschätzter Aufwand
    estimate: /~(\d+(?:\.\d+)?)\s*(h|m|min|stunden?|minuten?)?/gi,
    
    // ?? → Idee/Brainstorm → Mind Canvas
    idea: /^\?\?/,
    
    // >> → Quick Note
    quickNote: /^>>/,
    
    // @@ [name] → Kontakt verknüpfen
    contact: /@@(\w+)/g,
    
    // Zeit erkennung (14:00, 14 Uhr, etc.)
    time: /\b(\d{1,2})(?::(\d{2}))?\s*(uhr)?/gi,
    
    // Datum Erkennung
    dateRelative: /\b(heute|morgen|übermorgen|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)\b/gi,
    dateAbsolute: /\b(\d{1,2})\.(\d{1,2})\.?(\d{2,4})?\b/g
  },
  
  // Sphere Mappings
  sphereMap: {
    'geschäft': 'geschaeft',
    'geschaeft': 'geschaeft',
    'business': 'geschaeft',
    'arbeit': 'geschaeft',
    'projekte': 'projekte',
    'projekt': 'projekte',
    'projects': 'projekte',
    'schule': 'schule',
    'uni': 'schule',
    'studium': 'schule',
    'lernen': 'schule',
    'sport': 'sport',
    'fitness': 'sport',
    'training': 'sport',
    'freizeit': 'freizeit',
    'personal': 'freizeit',
    'privat': 'freizeit'
  },
  
  // Priority Mappings
  priorityMap: {
    '!!!': 'critical',
    '!!': 'high',
    '!': 'normal'
  },
  
  // Parse full input
  parse(input) {
    if (!input || !input.trim()) {
      return null;
    }
    
    const result = {
      originalInput: input,
      cleanedTitle: input,
      type: 'task', // default
      project: null,
      spheres: [],
      priority: 'normal',
      deadline: null,
      scheduledDate: null,
      scheduledTime: null,
      timeEstimate: null,
      recurring: null,
      contacts: [],
      tags: [],
      isIdea: false,
      isQuickNote: false,
      suggestions: []
    };
    
    let cleaned = input;
    
    // Check for special prefixes
    if (this.patterns.idea.test(cleaned)) {
      result.type = 'note';
      result.isIdea = true;
      cleaned = cleaned.replace(this.patterns.idea, '').trim();
    } else if (this.patterns.quickNote.test(cleaned)) {
      result.type = 'note';
      result.isQuickNote = true;
      cleaned = cleaned.replace(this.patterns.quickNote, '').trim();
    }
    
    // Extract project reference
    const projectMatch = cleaned.match(/@(\w+)(?!@)/);
    if (projectMatch) {
      result.project = this.findProject(projectMatch[1]);
      cleaned = cleaned.replace(/@\w+:?\s*/, '');
    }
    
    // Extract spheres
    const sphereMatches = cleaned.matchAll(this.patterns.sphere);
    for (const match of sphereMatches) {
      const sphere = this.sphereMap[match[1].toLowerCase()];
      if (sphere && !result.spheres.includes(sphere)) {
        result.spheres.push(sphere);
      }
    }
    cleaned = cleaned.replace(this.patterns.sphere, '').trim();
    
    // Extract priority
    const priorityMatch = cleaned.match(/(!{1,3})(?!\w)/);
    if (priorityMatch) {
      result.priority = this.priorityMap[priorityMatch[1]] || 'normal';
      cleaned = cleaned.replace(/\s*!{1,3}(?!\w)/, '');
    }
    
    // Extract recurring pattern
    const recurringMatch = cleaned.match(/\+(\w+)/);
    if (recurringMatch) {
      result.recurring = this.parseRecurring(recurringMatch[1]);
      if (result.recurring) {
        result.type = 'habit';
      }
      cleaned = cleaned.replace(/\+\w+\s*/, '');
    }
    
    // Extract deadline
    const deadlineMatch = cleaned.match(/\bbis\s+(\w+)/i);
    if (deadlineMatch) {
      result.deadline = this.parseDate(deadlineMatch[1]);
      cleaned = cleaned.replace(/\bbis\s+\w+\s*/i, '');
    }
    
    // Extract time estimate
    const estimateMatch = cleaned.match(/~(\d+(?:\.\d+)?)\s*(h|m|min|stunden?|minuten?)?/i);
    if (estimateMatch) {
      result.timeEstimate = this.parseTimeEstimate(estimateMatch[1], estimateMatch[2]);
      cleaned = cleaned.replace(/~\d+(?:\.\d+)?\s*(?:h|m|min|stunden?|minuten?)?\s*/i, '');
    }
    
    // Extract contacts
    const contactMatches = cleaned.matchAll(/@@(\w+)/g);
    for (const match of contactMatches) {
      const contact = this.findContact(match[1]);
      if (contact) {
        result.contacts.push(contact);
      }
    }
    cleaned = cleaned.replace(/@@\w+\s*/g, '');
    
    // Extract time - if hours >= 24, wrap to next day (e.g., 25:00 → 01:00 next day)
    const timeMatch = cleaned.match(/\b(\d{1,2})(?::(\d{2}))?\s*(uhr)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      if (hours >= 0 && hours <= 29) {
        // Handle times >= 24:00 as next day
        if (hours >= 24) {
          hours = hours - 24;
          // Shift the date to next day if we have a scheduledDate, otherwise set it to tomorrow
          if (result.scheduledDate) {
            const nextDay = new Date(result.scheduledDate);
            nextDay.setDate(nextDay.getDate() + 1);
            result.scheduledDate = nextDay.toISOString().split('T')[0];
          } else {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            result.scheduledDate = tomorrow.toISOString().split('T')[0];
          }
        }
        result.scheduledTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        // Check if this looks like a scheduled date/time
        const dateMatch = cleaned.match(this.patterns.dateRelative);
        if (dateMatch) {
          result.scheduledDate = this.parseDate(dateMatch[0]);
          cleaned = cleaned.replace(this.patterns.dateRelative, '');
        }
        cleaned = cleaned.replace(/\b\d{1,2}(?::\d{2})?\s*(?:uhr)?\s*/i, '');
      }
    }
    
    // Clean up title
    result.cleanedTitle = cleaned.replace(/\s+/g, ' ').trim();
    
    // Default to freizeit if no sphere specified
    if (result.spheres.length === 0) {
      result.spheres = ['freizeit'];
    }
    
    // Add suggestions based on context
    result.suggestions = this.generateSuggestions(result);
    
    return result;
  },
  
  // Find project by name (fuzzy match)
  findProject(name) {
    const projects = NexusStore.getProjects();
    const normalized = name.toLowerCase();
    
    // Exact match first
    let match = projects.find(p => 
      p.name.toLowerCase() === normalized ||
      p.name.toLowerCase().replace(/\s+/g, '') === normalized
    );
    
    // Partial match
    if (!match) {
      match = projects.find(p => 
        p.name.toLowerCase().includes(normalized) ||
        normalized.includes(p.name.toLowerCase())
      );
    }
    
    return match ? { id: match.id, name: match.name } : null;
  },
  
  // Find contact by name
  findContact(name) {
    const contacts = NexusStore.getContacts();
    const normalized = name.toLowerCase();
    
    const match = contacts.find(c => 
      c.name.toLowerCase().includes(normalized)
    );
    
    return match ? { id: match.id, name: match.name } : null;
  },
  
  // Parse recurring pattern
  parseRecurring(pattern) {
    const normalized = pattern.toLowerCase();
    
    const recurringMap = {
      'täglich': { interval: 'daily', frequency: 1 },
      'taeglich': { interval: 'daily', frequency: 1 },
      'daily': { interval: 'daily', frequency: 1 },
      'wöchentlich': { interval: 'weekly', frequency: 1 },
      'woechentlich': { interval: 'weekly', frequency: 1 },
      'weekly': { interval: 'weekly', frequency: 1 },
      'monatlich': { interval: 'monthly', frequency: 1 },
      'monthly': { interval: 'monthly', frequency: 1 }
    };
    
    return recurringMap[normalized] || null;
  },
  
  // Parse relative/absolute date
  parseDate(dateStr) {
    const normalized = dateStr.toLowerCase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Relative dates
    const relativeDates = {
      'heute': 0,
      'morgen': 1,
      'übermorgen': 2,
      'uebermorgen': 2
    };
    
    if (relativeDates[normalized] !== undefined) {
      const date = new Date(today);
      date.setDate(date.getDate() + relativeDates[normalized]);
      return date.toISOString().split('T')[0];
    }
    
    // Day names
    const dayNames = ['sonntag', 'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag'];
    const dayIndex = dayNames.indexOf(normalized);
    if (dayIndex !== -1) {
      const date = new Date(today);
      const currentDay = date.getDay();
      let daysToAdd = dayIndex - currentDay;
      if (daysToAdd <= 0) daysToAdd += 7;
      date.setDate(date.getDate() + daysToAdd);
      return date.toISOString().split('T')[0];
    }
    
    // Absolute date (DD.MM or DD.MM.YYYY)
    const absoluteMatch = dateStr.match(/(\d{1,2})\.(\d{1,2})\.?(\d{2,4})?/);
    if (absoluteMatch) {
      const day = parseInt(absoluteMatch[1]);
      const month = parseInt(absoluteMatch[2]) - 1;
      let year = absoluteMatch[3] ? parseInt(absoluteMatch[3]) : today.getFullYear();
      if (year < 100) year += 2000;
      
      const date = new Date(year, month, day);
      return date.toISOString().split('T')[0];
    }
    
    return null;
  },
  
  // Parse time estimate
  parseTimeEstimate(value, unit) {
    const num = parseFloat(value);
    const unitNormalized = (unit || 'h').toLowerCase();
    
    // Convert to minutes
    if (unitNormalized.startsWith('h') || unitNormalized.startsWith('stunde')) {
      return Math.round(num * 60);
    }
    return Math.round(num); // Already in minutes
  },
  
  // Generate suggestions based on parsed result
  generateSuggestions(result) {
    const suggestions = [];
    
    // Suggest linking to project if mentioned
    if (result.project) {
      suggestions.push({
        type: 'link_project',
        message: `Mit Projekt "${result.project.name}" verknüpfen?`,
        action: 'link_project',
        data: result.project
      });
    }
    
    // Suggest milestone if project has them
    if (result.project) {
      const project = NexusStore.getProjectById(result.project.id);
      if (project && project.milestones && project.milestones.length > 0) {
        suggestions.push({
          type: 'link_milestone',
          message: `Mit Milestone verknüpfen?`,
          action: 'select_milestone',
          data: project.milestones
        });
      }
    }
    
    // Suggest recurring if it looks like a habit
    const habitKeywords = ['joggen', 'meditation', 'lesen', 'sport', 'training', 'üben'];
    const hasHabitKeyword = habitKeywords.some(k => 
      result.cleanedTitle.toLowerCase().includes(k)
    );
    if (hasHabitKeyword && !result.recurring) {
      suggestions.push({
        type: 'make_habit',
        message: 'Als tägliches Habit anlegen?',
        action: 'convert_to_habit'
      });
    }
    
    return suggestions;
  },
  
  // Format parsed result for display
  formatParseResult(result) {
    if (!result) return null;
    
    const lines = [];
    
    // Type
    const typeEmoji = {
      task: '📋',
      habit: '🔄',
      note: '💭',
      event: '📅'
    };
    lines.push(`${typeEmoji[result.type] || '📋'} TYPE: ${result.type.charAt(0).toUpperCase() + result.type.slice(1)}`);
    
    // Project
    if (result.project) {
      lines.push(`🔗 PROJEKT: ${result.project.name}`);
    }
    
    // Title
    lines.push(`📝 TITEL: "${result.cleanedTitle}"`);
    
    // Priority
    if (result.priority !== 'normal') {
      const priorityDisplay = {
        critical: '🔴 Kritisch (!!!)',
        high: '🟡 Hoch (!!)',
        normal: '🟢 Normal'
      };
      lines.push(`⚡ PRIORITÄT: ${priorityDisplay[result.priority]}`);
    }
    
    // Deadline
    if (result.deadline) {
      lines.push(`📅 DEADLINE: ${this.formatDate(result.deadline)}`);
    }
    
    // Scheduled
    if (result.scheduledDate || result.scheduledTime) {
      let scheduled = '⏰ GEPLANT: ';
      if (result.scheduledDate) scheduled += this.formatDate(result.scheduledDate);
      if (result.scheduledTime) scheduled += ` um ${result.scheduledTime}`;
      lines.push(scheduled);
    }
    
    // Time estimate
    if (result.timeEstimate) {
      const hours = Math.floor(result.timeEstimate / 60);
      const minutes = result.timeEstimate % 60;
      let estimate = '⏱️ AUFWAND: ';
      if (hours > 0) estimate += `${hours}h `;
      if (minutes > 0) estimate += `${minutes}min`;
      lines.push(estimate.trim());
    }
    
    // Spheres
    if (result.spheres.length > 0) {
      const sphereDisplay = result.spheres.map(s => 
        s.charAt(0).toUpperCase() + s.slice(1)
      ).join(', ');
      lines.push(`🌐 SPHÄREN: ${sphereDisplay}`);
    }
    
    // Recurring
    if (result.recurring) {
      lines.push(`🔄 WIEDERHOLUNG: ${result.recurring.interval}`);
    }
    
    // Contacts
    if (result.contacts.length > 0) {
      const contactNames = result.contacts.map(c => c.name).join(', ');
      lines.push(`👤 KONTAKTE: ${contactNames}`);
    }
    
    return lines;
  },
  
  // Format date for display
  formatDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Heute';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Morgen';
    } else {
      const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
      const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
      return `${days[date.getDay()]}, ${date.getDate()}. ${months[date.getMonth()]}`;
    }
  },
  
  // Create entity from parsed result
  createEntity(result) {
    if (!result) return null;
    
    switch (result.type) {
      case 'task':
        return NexusStore.addTask({
          title: result.cleanedTitle,
          spheres: result.spheres,
          projectId: result.project?.id,
          priority: result.priority,
          deadline: result.deadline,
          scheduledDate: result.scheduledDate,
          scheduledTime: result.scheduledTime,
          timeEstimate: result.timeEstimate,
          linkedContacts: result.contacts.map(c => c.id)
        });
        
      case 'habit':
        return NexusStore.addHabit({
          name: result.cleanedTitle,
          spheres: result.spheres,
          interval: result.recurring?.interval || 'daily',
          preferredTime: result.scheduledTime
        });
        
      case 'note':
        return NexusStore.addNote({
          content: result.cleanedTitle,
          type: result.isIdea ? 'idea' : 'note',
          tags: result.spheres,
          linkedEntities: result.project ? [{ type: 'project', id: result.project.id }] : []
        });
        
      default:
        return null;
    }
  }
};

// Export
window.SmartParser = SmartParser;
