/* ═══════════════════════════════════════════════════════════════════════════════
   Athena Ultra - Entity System
   Unified Entity Structure nach dem Athena Ultra Schema
   ═══════════════════════════════════════════════════════════════════════════════ */

const EntityTypes = {
  TASK: 'task',
  HABIT: 'habit',
  PROJECT: 'project',
  VENTURE: 'venture',
  GOAL: 'goal',
  BUCKET_ITEM: 'bucket_item',
  NOTE: 'note',
  EVENT: 'event',
  CONTACT: 'contact'
};

const Priority = {
  CRITICAL: 'critical',   // !!!
  HIGH: 'high',           // !!
  NORMAL: 'normal',       // !
  LOW: 'low'              // (default)
};

const TaskStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  BLOCKED: 'blocked',
  CANCELLED: 'cancelled'
};

const ProjectStatus = {
  ACTIVE: 'active',
  ON_ICE: 'on_ice',
  PIPELINE: 'pipeline',
  COMPLETED: 'completed'
};

const Horizon = {
  ONE_YEAR: '1-year',
  THREE_YEARS: '3-years',
  FIVE_YEARS: '5-years',
  TEN_YEARS: '10-years',
  LIFETIME: 'lifetime'
};

const HabitInterval = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  CUSTOM: 'custom'
};

// Entity Factory
const EntityFactory = {
  
  // Base Node Structure - alle Entities erben davon
  createBaseNode(data = {}) {
    return {
      id: data.id || NexusStore.generateId(),
      title: data.title || '',
      description: data.description || '',
      status: data.status || 'active',
      priority: data.priority || Priority.NORMAL,
      spheres: data.spheres || [],
      tags: data.tags || [],
      linkedNodes: data.linkedNodes || [],
      attachments: data.attachments || [],
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString()
    };
  },
  
  // Task Entity
  createTask(data = {}) {
    return {
      ...this.createBaseNode(data),
      type: EntityTypes.TASK,
      deadline: data.deadline || null,
      timeEstimate: data.timeEstimate || null,
      timeActual: data.timeActual || null,
      parentProject: data.parentProject || null,
      dependencies: data.dependencies || [],
      checklist: data.checklist || [],
      scheduledDate: data.scheduledDate || null,
      scheduledTime: data.scheduledTime || null,
      completedAt: data.completedAt || null
    };
  },
  
  // Habit Entity
  createHabit(data = {}) {
    return {
      ...this.createBaseNode(data),
      type: EntityTypes.HABIT,
      name: data.name || data.title || '',
      icon: data.icon || '⚡',
      interval: data.interval || HabitInterval.DAILY,      scheduledDays: data.scheduledDays || null, // For weekly habits: [0-6] where 0=Sunday, 1=Monday, etc.      preferredTime: data.preferredTime || null,
      flexibility: data.flexibility || 30, // ± minutes
      streak: data.streak || 0,
      bestStreak: data.bestStreak || 0,
      completionLog: data.completionLog || []
    };
  },
  
  // Project Entity
  createProject(data = {}) {
    return {
      ...this.createBaseNode(data),
      type: EntityTypes.PROJECT,
      name: data.name || data.title || '',
      status: data.status || ProjectStatus.ACTIVE,
      phases: data.phases || [],
      milestones: data.milestones || [],
      actionItems: data.actionItems || [],
      team: data.team || [],
      variables: data.variables || {},
      startDate: data.startDate || new Date().toISOString(),
      targetEnd: data.targetEnd || null,
      progress: data.progress || 0
    };
  },
  
  // Venture Entity (Mega-Project)
  createVenture(data = {}) {
    return {
      ...this.createBaseNode(data),
      type: EntityTypes.VENTURE,
      name: data.name || data.title || '',
      status: data.status || ProjectStatus.ACTIVE,
      roadmap: data.roadmap || [],
      roiProjection: data.roiProjection || null,
      riskMatrix: data.riskMatrix || [],
      bestCase: data.bestCase || '',
      worstCase: data.worstCase || '',
      barriers: data.barriers || [],
      pivotOptions: data.pivotOptions || [],
      evaluation: data.evaluation || {},
      effortInvested: data.effortInvested || 0,
      effortRemaining: data.effortRemaining || null,
      linkedProjects: data.linkedProjects || [],
      linkedGoals: data.linkedGoals || []
    };
  },
  
  // Life Goal Entity
  createGoal(data = {}) {
    return {
      ...this.createBaseNode(data),
      type: EntityTypes.GOAL,
      horizon: data.horizon || Horizon.ONE_YEAR,
      realizationPath: data.realizationPath || [],
      linkedProjects: data.linkedProjects || [],
      linkedHabits: data.linkedHabits || [],
      progress: data.progress || 0,
      yearlyMilestones: data.yearlyMilestones || []
    };
  },
  
  // Bucket List Item
  createBucketItem(data = {}) {
    return {
      ...this.createBaseNode(data),
      type: EntityTypes.BUCKET_ITEM,
      horizon: data.horizon || null,
      emotionalWeight: data.emotionalWeight || 5, // 1-10
      enabling: data.enabling || [],
      costEstimate: data.costEstimate || null,
      linkedGoals: data.linkedGoals || []
    };
  },
  
  // Note Entity
  createNote(data = {}) {
    return {
      ...this.createBaseNode(data),
      type: EntityTypes.NOTE,
      content: data.content || '',
      canvasPosition: data.canvasPosition || null,
      linkedEntities: data.linkedEntities || [],
      noteType: data.noteType || 'note' // idea, research, brainstorm
    };
  },
  
  // Event Entity
  createEvent(data = {}) {
    return {
      ...this.createBaseNode(data),
      type: EntityTypes.EVENT,
      dateTime: data.dateTime || null,
      duration: data.duration || 60, // minutes
      recurrence: data.recurrence || null,
      attendees: data.attendees || [],
      location: data.location || '',
      linkedTasks: data.linkedTasks || []
    };
  },
  
  // Contact Entity
  createContact(data = {}) {
    return {
      ...this.createBaseNode(data),
      type: EntityTypes.CONTACT,
      name: data.name || data.title || '',
      email: data.email || '',
      phone: data.phone || '',
      role: data.role || '',
      linkedProjects: data.linkedProjects || [],
      notes: data.notes || '',
      lastContact: data.lastContact || null,
      interactions: data.interactions || []
    };
  },
  
  // Phase für Projects/Ventures
  createPhase(data = {}) {
    return {
      id: data.id || NexusStore.generateId(),
      name: data.name || '',
      order: data.order || 0,
      status: data.status || 'pending',
      progress: data.progress || 0,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      milestones: data.milestones || []
    };
  },
  
  // Milestone
  createMilestone(data = {}) {
    return {
      id: data.id || NexusStore.generateId(),
      name: data.name || '',
      dueDate: data.dueDate || null,
      status: data.status || 'pending',
      linkedTasks: data.linkedTasks || []
    };
  },
  
  // Barrier/Blocker
  createBarrier(data = {}) {
    return {
      id: data.id || NexusStore.generateId(),
      description: data.description || '',
      severity: data.severity || 'medium', // low, medium, high
      blockedItems: data.blockedItems || [],
      suggestedAction: data.suggestedAction || '',
      status: data.status || 'active',
      createdAt: new Date().toISOString()
    };
  }
};

// Relationship Types für das Life Graph System
const RelationshipTypes = {
  ENABLES: 'enables',           // Goal → Project/Venture
  CONTAINS: 'contains',         // Project → Phase → Milestone → Task
  TAGGED: 'tagged',             // Any → Sphere
  LINKED: 'linked',             // Any → Any (bidirectional)
  DEADLINE: 'deadline',         // Task/Milestone → Calendar Event
  KEY_PERSON: 'key_person',     // Contact → Project
  CONTRIBUTES: 'contributes',   // Habit → Goal
  BLOCKS: 'blocks'              // Blocker → Task/Milestone
};

// Link Helper für bidirektionale Verknüpfungen
const LinkHelper = {
  
  // Erstelle bidirektionale Verknüpfung
  createLink(entity1, entity2, relationshipType) {
    // Add link to entity1
    if (!entity1.linkedNodes) entity1.linkedNodes = [];
    entity1.linkedNodes.push({
      entityId: entity2.id,
      entityType: entity2.type,
      relationship: relationshipType,
      createdAt: new Date().toISOString()
    });
    
    // Add reverse link to entity2
    if (!entity2.linkedNodes) entity2.linkedNodes = [];
    entity2.linkedNodes.push({
      entityId: entity1.id,
      entityType: entity1.type,
      relationship: this.getReverseRelationship(relationshipType),
      createdAt: new Date().toISOString()
    });
    
    return { entity1, entity2 };
  },
  
  // Entferne Verknüpfung
  removeLink(entity1, entity2) {
    if (entity1.linkedNodes) {
      entity1.linkedNodes = entity1.linkedNodes.filter(l => l.entityId !== entity2.id);
    }
    if (entity2.linkedNodes) {
      entity2.linkedNodes = entity2.linkedNodes.filter(l => l.entityId !== entity1.id);
    }
    return { entity1, entity2 };
  },
  
  // Hole alle verlinkten Entities eines Types
  getLinkedByType(entity, entityType) {
    if (!entity.linkedNodes) return [];
    return entity.linkedNodes.filter(l => l.entityType === entityType);
  },
  
  // Reverse relationship mapping
  getReverseRelationship(relationship) {
    const reverseMap = {
      [RelationshipTypes.ENABLES]: 'enabled_by',
      [RelationshipTypes.CONTAINS]: 'contained_in',
      [RelationshipTypes.BLOCKS]: 'blocked_by',
      [RelationshipTypes.KEY_PERSON]: 'key_person_of',
      [RelationshipTypes.CONTRIBUTES]: 'contributed_by'
    };
    return reverseMap[relationship] || relationship;
  }
};

// Export
window.EntityTypes = EntityTypes;
window.Priority = Priority;
window.TaskStatus = TaskStatus;
window.ProjectStatus = ProjectStatus;
window.Horizon = Horizon;
window.HabitInterval = HabitInterval;
window.EntityFactory = EntityFactory;
window.RelationshipTypes = RelationshipTypes;
window.LinkHelper = LinkHelper;
