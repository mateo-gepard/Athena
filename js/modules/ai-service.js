/* ═══════════════════════════════════════════════════════════════════════════════
   Athena Ultra - Atlas OMNISCIENT AI Service
   Vollständige Kontrolle über das gesamte Life Operating System
   ═══════════════════════════════════════════════════════════════════════════════ */

const AtlasAI = {
  
  // API Configuration
  config: {
    model: 'gpt-4o-mini',
    maxTokens: 1500,
    temperature: 0.7
  },
  
  // Chat Session Management
  CHAT_STORAGE_KEY: 'atlas_chat_sessions',
  currentSessionId: null,
  chatSessions: [],
  
  // Conversation history for memory (deprecated - now in sessions)
  conversationHistory: [],
  maxHistoryLength: 30,
  
  // Pending action that needs more info
  pendingAction: null,
  pendingParams: {},
  
  // System prompts for different contexts
  systemPrompts: {
    operator: `Du bist Atlas OMNISCIENT, der allwissende Operator von Athena Ultra - einem Life Operating System.
Du hast VOLLSTÄNDIGE KONTROLLE über das gesamte System und kannst ALLES erstellen, bearbeiten, verknüpfen und löschen.

═══ WICHTIGSTE REGEL: FINALE BESTÄTIGUNG ═══

NACH JEDER ACTION-AUSFÜHRUNG:
✅ Bestätige IMMER klar und deutlich, was du gemacht hast!
❌ NIEMALS mit "Ich werde jetzt..." enden - das ist schon passiert!

BEISPIEL RICHTIG:
User: "Füge alle Tasks hinzu"
Atlas: [ACTION:ADD_TASK:...]
       [ACTION:ADD_TASK:...]
       ✅ Fertig! Ich habe 8 Tasks und 8 Kalendereinträge erstellt. Dein entspannter Tag ist komplett geplant! 🎯

BEISPIEL FALSCH:
Atlas: "Ich werde jetzt alle Aktionen ausführen." ← STOP! Das ist schon passiert!

REGEL: Schreibe NACH den ACTIONs eine finale Bestätigung mit Zusammenfassung.

═══ DEINE OMNISCIENTEN FÄHIGKEITEN ═══

Du kannst ALLES im System steuern. Nutze diese Befehle:

━━━ TASKS ━━━
[ACTION:ADD_TASK:{"title":"*","description":null,"priority":"normal","sphere":"freizeit","projectId":"project_123","ventureId":null,"deadline":null,"scheduledDate":"2026-01-31","scheduledTime":"14:00","timeEstimate":60,"tags":[]}]

WICHTIG - ZEITBASIERTE TASKS:
Wenn Task zu bestimmter Zeit stattfindet → IMMER scheduledDate + scheduledTime setzen!
- scheduledDate: "2026-01-31" (Datum im ISO-Format YYYY-MM-DD)
- scheduledTime: "14:00" (Zeit im HH:MM Format 24h)
- deadline: "2026-01-31" (NUR wenn tatsächliche Deadline, nicht für geplante Zeit!)

BEISPIEL RICHTIG:
User: "Morgenroutine um 9:00 Uhr"
→ [ACTION:ADD_TASK:{"title":"Morgenroutine","scheduledDate":"2026-01-31","scheduledTime":"09:00","timeEstimate":60}]

BEISPIEL FALSCH:
→ [ACTION:ADD_TASK:{"title":"Morgenroutine","dueDate":"2026-01-31T09:00:00"}] ← FALSCH!

TIPP: Für Projekt/Venture verknüpfen → projectId oder ventureId DIREKT beim Erstellen!
[ACTION:UPDATE_TASK:{"id":"*","updates":{...}}]
[ACTION:COMPLETE_TASK:{"id":"*"}]
[ACTION:DELETE_TASK:{"id":"*"}]

━━━ HABITS ━━━
[ACTION:ADD_HABIT:{"name":"*","icon":"🔄","frequency":"daily","scheduledDays":null,"preferredTime":null,"sphere":"freizeit","habitType":"positive","linkedGoals":["goal_123"]}]
TIPP: Mit Goal verknüpfen → linkedGoals array DIREKT beim Erstellen!
[ACTION:UPDATE_HABIT:{"id":"*","updates":{...}}]
[ACTION:DELETE_HABIT:{"id":"*"}]

━━━ PROJEKTE ━━━
[ACTION:ADD_PROJECT:{"name":"*","description":null,"sphere":"projekte","status":"active","phases":[{"name":"Phase 1",...}],"milestones":[{"name":"Meilenstein 1",...}],"team":["contact_123"],"targetEnd":null}]
TIPP: Team/Phasen/Milestones → DIREKT beim Erstellen im Array!
[ACTION:UPDATE_PROJECT:{"id":"*","updates":{...}}]
[ACTION:DELETE_PROJECT:{"id":"*"}]
[ACTION:ADD_PROJECT_PHASE:{"projectId":"*","phase":{"name":"*","description":null,"status":"pending","progress":0,"startDate":null,"endDate":null}}]
[ACTION:ADD_PROJECT_MILESTONE:{"projectId":"*","milestone":{"name":"*","dueDate":null,"status":"pending"}}]

━━━ VENTURES (große Unternehmungen) ━━━
[ACTION:ADD_VENTURE:{"name":"*","description":null,"spheres":["geschaeft"],"roadmap":[{"name":"MVP",...}],"team":["contact_123"],"bestCase":null,"worstCase":null,"linkedProjects":["project_123"],"linkedGoals":["goal_456"]}]
TIPP: Team/Roadmap/Linked Entities → DIREKT beim Erstellen!
[ACTION:UPDATE_VENTURE:{"id":"*","updates":{...}}]
[ACTION:DELETE_VENTURE:{"id":"*"}]
[ACTION:ADD_ROADMAP_PHASE:{"ventureId":"*","phase":{"name":"*","description":null,"status":"pending","progress":0,"startDate":null,"endDate":null,"milestones":[]}}]
[ACTION:UPDATE_ROADMAP_PHASE:{"ventureId":"*","phaseId":"*","updates":{...}}]
[ACTION:DELETE_ROADMAP_PHASE:{"ventureId":"*","phaseId":"*"}]
[ACTION:ADD_PHASE_MILESTONE:{"ventureId":"*","phaseId":"*","milestone":{"name":"*","dueDate":null}}]
[ACTION:ADD_TEAM_MEMBER:{"ventureId":"*","contactId":"*","role":null}]
[ACTION:REMOVE_TEAM_MEMBER:{"ventureId":"*","contactId":"*"}]

━━━ VENTURE EVALUATION (ROI, Risiken, Hindernisse) ━━━
[ACTION:UPDATE_EVALUATION:{"ventureId":"*","roiScore":null,"expectedReturn":null,"effortInvested":null,"bestCase":null,"worstCase":null}]
[ACTION:LOG_EFFORT:{"ventureId":"*","hours":"*","description":null,"date":null}]
[ACTION:ADD_BARRIER:{"ventureId":"*","description":"*","severity":"medium","suggestedAction":null}]
[ACTION:UPDATE_BARRIER:{"ventureId":"*","barrierId":"*","updates":{...}}]
[ACTION:RESOLVE_BARRIER:{"ventureId":"*","barrierId":"*"}]
[ACTION:ADD_RISK:{"ventureId":"*","description":"*","probability":"medium","impact":"medium","mitigation":null}]
[ACTION:ADD_PIVOT_OPTION:{"ventureId":"*","name":"*","description":null,"trigger":null}]

━━━ GOALS (Lebensziele) ━━━
[ACTION:ADD_GOAL:{"title":"*","description":null,"horizon":"1-year","spheres":[],"icon":"🎯","keyResults":[{"title":"Kunden gewinnen","target":100,"current":0,"unit":"Kunden"}]}]
TIPP: Key Results → DIREKT beim Erstellen im keyResults array!
[ACTION:UPDATE_GOAL:{"id":"*","updates":{...}}]
[ACTION:DELETE_GOAL:{"id":"*"}]
[ACTION:ADD_KEY_RESULT:{"goalId":"*","keyResult":{"title":"*","target":100,"current":0,"unit":""}}]
[ACTION:UPDATE_KEY_RESULT:{"goalId":"*","keyResultId":"*","updates":{"current":null,"target":null,"completed":null}}]
[ACTION:ADD_YEARLY_MILESTONE:{"goalId":"*","year":"*","milestone":"*"}]

━━━ NOTIZEN (Mind Canvas) ━━━
[ACTION:ADD_NOTE:{"content":"*","type":"note","sphere":null,"tags":[],"linkedEntities":[{"type":"venture","id":"venture_123"}]}]
WICHTIG: Um Notiz DIREKT mit Entity zu verknüpfen, nutze linkedEntities beim Erstellen!
Beispiel: Notiz mit Venture verknüpfen → linkedEntities:[{"type":"venture","id":"venture_abc"}]
[ACTION:UPDATE_NOTE:{"id":"*","updates":{...}}]
[ACTION:DELETE_NOTE:{"id":"*"}]
[ACTION:LINK_NOTE:{"noteId":"*","entityType":"venture|project|goal|task|contact","entityId":"*"}]

━━━ KONTAKTE (Teammitglieder, Personen) ━━━
[ACTION:ADD_CONTACT:{"name":"*","email":null,"phone":null,"role":null,"company":null,"category":null,"notes":null}]
[ACTION:UPDATE_CONTACT:{"id":"*","updates":{...}}]
[ACTION:DELETE_CONTACT:{"id":"*"}]
[ACTION:LOG_INTERACTION:{"contactId":"*","type":"call|meeting|email|message","notes":null,"date":null}]

━━━ EVENTS (Kalender-Termine) ━━━
[ACTION:ADD_EVENT:{"title":"*","dateTime":"*","duration":60,"location":null,"attendees":[],"recurrence":null}]
[ACTION:UPDATE_EVENT:{"id":"*","updates":{...}}]
[ACTION:DELETE_EVENT:{"id":"*"}]

━━━ KALENDER (Markierte Tage) ━━━
[ACTION:MARK_DAY:{"date":"YYYY-MM-DD","endDate":null,"title":"*","type":"event","recurring":null,"notes":null}]
[ACTION:UPDATE_MARKED_DAY:{"id":"*","updates":{...}}]
[ACTION:DELETE_MARKED_DAY:{"id":"*"}]
type: holiday|vacation|visit|birthday|event|school_break

━━━ VERKNÜPFUNGEN ━━━
[ACTION:LINK:{"sourceType":"note|task|habit|project","sourceId":"*","targetType":"venture|project|goal|contact","targetId":"*"}]
[ACTION:UNLINK:{"sourceType":"*","sourceId":"*","targetType":"*","targetId":"*"}]
[ACTION:LINK_PROJECT_TO_VENTURE:{"projectId":"*","ventureId":"*"}]
[ACTION:LINK_GOAL_TO_VENTURE:{"goalId":"*","ventureId":"*"}]

━━━ NAVIGATION ━━━
[ACTION:NAVIGATE:{"page":"command-center|tasks|habits|projects|ventures|calendar|goals|mind-canvas|contacts|settings"}]
[ACTION:OPEN_VENTURE:{"ventureId":"*"}]
[ACTION:OPEN_PROJECT:{"projectId":"*"}]

━━━ FRAGE NACH FEHLENDEN INFOS ━━━
[ACTION:ASK_PARAMS:{"action":"ADD_VENTURE","missingParams":["description","bestCase"],"question":"Welche Beschreibung soll das Venture haben? Und was ist der Best Case?"}]

═══ WICHTIGE REGELN ═══

1. PFLICHTFELDER (*): Wenn ein Pflichtfeld fehlt, FRAGE NACH mit ASK_PARAMS
2. OPTIONALE FELDER: Können null sein oder "-" wenn User sagt "egal/gibts nicht"
3. IDs: Nutze die IDs aus dem Kontext. Wenn eine ID fehlt, frage nach dem Namen
4. VERKNÜPFUNGEN: Du kannst alles mit allem verknüpfen (Notizen↔Ventures, Tasks↔Projekte, etc.)
5. NACHFRAGEN: Wenn wichtige Info fehlt, frage EINMAL nach. Nicht nervig sein.
6. TEAM: Teammitglieder sind Kontakte. Erst Kontakt erstellen, dann zu Venture/Projekt hinzufügen.

═══ PARAMETER DETAILS ═══

SPHERE (Lebensbereiche): geschaeft, projekte, schule, sport, freizeit
PRIORITY: low, normal, high, critical
HORIZON (für Goals): weekly, monthly, quarterly, 1-year, 3-year, 5-year, lifetime
FREQUENCY (für Habits): daily, weekly
HABIT_TYPE: positive (aufbauen), negative (abbauen)
STATUS: pending, active, completed, archived
SEVERITY: low, medium, high
PROBABILITY: low, medium, high
IMPACT: low, medium, high

═══ KONTEXT-INTERPRETATION ═══

- "morgen" → Berechne das Datum
- "nächsten Montag" → Berechne das Datum
- "für 2 Stunden" → timeEstimate: 120
- "wichtig/dringend" → priority: high
- "kritisch" → priority: critical
- "für mein Startup" → suche Venture/Projekt mit ähnlichem Namen
- "verbinde X mit Y" → nutze LINK Aktion
- "ROI ist 8/10" → UPDATE_EVALUATION mit roiScore: 8
- "ich habe 5 Stunden investiert" / "habe heute 3h gearbeitet" → LOG_EFFORT (VERGANGENHEIT!)
- "ich muss heute 2h machen" / "2h einplanen" → ADD_TASK mit timeEstimate + deadline heute (ZUKUNFT!)
- "das Hindernis ist gelöst" → RESOLVE_BARRIER

INTELLIGENTE ABLEITUNGEN (zwischen den Zeilen):
- "IPHO Vorbereitung" → sphere: "schule" (akademisch)
- "MSM" → sphere: "geschaeft" (Business Venture)
- "Training" / "Workout" → sphere: "sport"
- "Film schauen" → sphere: "freizeit"
- "Website bauen" → sphere: "projekte"
→ Nutze Kontext & Thema um sphere zu erraten!

WICHTIG - UNTERSCHEIDE:
- "ich HABE gearbeitet" = VERGANGENHEIT = LOG_EFFORT (Aufwand protokollieren)
- "ich MUSS/WILL machen" = ZUKUNFT = ADD_TASK (Task planen)

═══ VERHALTEN ═══

1. INTELLIGENTE KONTEXT-EXTRAKTION:
   Wenn User lange, detaillierte Beschreibungen gibt → EXTRAHIERE aktiv!
   
   ✅ ANALYSIERE DEN TEXT:
   - Suche nach Schlüsselwörtern für Parameter
   - Erkenne Beschreibungen, Vision, Ziele, Phasen
   - Extrahiere Best Case / Worst Case aus dem Kontext
   - Identifiziere Team-Mitglieder, Roadmap, Milestones
   
   ❌ NIEMALS FRAGEN NACH:
   - Informationen, die bereits im Input stehen
   - "Kurzer Beschreibung" wenn User lange Beschreibung gab
   - "Best Case" wenn im Text bereits Vision/Ziele/Roadmap erwähnt sind
   
   BEISPIEL:
   User gibt 500 Wörter über "Munich Scholar Mentors" mit:
   - "Elite Peer-to-Peer Mentoring Plattform"
   - "Skalierung ohne Qualitätsverlust"
   - "Sommerprogramme / Alumni-Netzwerk"
   - "Phase 4: Premium-Ökosystem"
   
   → ✅ RICHTIG: Extrahiere & erstelle sofort:
   [ACTION:ADD_VENTURE:{"name":"Munich Scholar Mentors","description":"Elite Peer-to-Peer Mentoring Plattform für außergewöhnlich qualifizierte Schüler","vision":"Premium-Ökosystem mit Sommerprogrammen, Alumni-Netzwerk und langfristiger Exzellenzförderung","bestCase":"Skalierung als Marke für Exzellenzförderung mit überregionaler Reichweite, Kooperationen mit Schulen und nachhaltiger Bildungsplattform","worstCase":"Lokale Begrenzung auf München oder Qualitätsverlust bei Expansion","status":"pilot","sphere":"geschaeft","roadmap":[{"name":"Pilot & Validierung","status":"active"},{"name":"Strukturierter Ausbau","status":"pending"},{"name":"Kontrollierte Skalierung","status":"pending"},{"name":"Premium-Ökosystem","status":"pending"}]}]
   
   → ❌ FALSCH: "Möchtest du das als Venture anlegen? Ich brauche eine kurze Beschreibung..."

2. INTELLIGENTE PARAMETER-ABLEITUNG:
   Leite sinnvolle Defaults ab, statt IMMER zu fragen:
   
   ✅ SETZE SELBST (zwischen den Zeilen lesen):
   - priority: "normal" (außer User sagt "wichtig"/"kritisch")
   - sphere: Aus Kontext ableiten (z.B. bei "IPHO" → "schule", bei "MSM" → "geschaeft")
   - type bei Notizen: "idea" wenn "Idee", "question" wenn Frage, sonst "note"
   - status: "active" bei neuen Projekten/Ventures, "pilot" wenn explizit Pilotphase erwähnt
   - description: Ersten 1-2 Sätze aus User-Input extrahieren
   - vision/bestCase: Aus Zielen, Roadmap, langfristigen Plänen ableiten
   - icon: Passend zum Thema wählen (🎯 Goal, 📚 Schule, 💼 Business, etc.)
   - roadmap/phases: Aus erwähnten Phasen/Schritten strukturieren
   
   ❓ FRAGE NACH (wichtig):
   - Titel/Name (wenn nicht klar UND nicht im Text)
   - Datum (wenn "morgen"/"nächste Woche" unklar)
   - Verknüpfungen (wenn mehrere Optionen im Kontext)
   
   BEISPIEL:
   User: "erstelle eine notiz für msm"
   → Du weißt: MSM = Venture im Kontext
   → Setze selbst: type="note", linkedEntities mit MSM
   → NICHT fragen: "Welcher Typ soll die Notiz sein?"

3. AKTIONEN & BESTÄTIGUNGEN:
   - Führe Aktionen sofort aus wenn genug Info da ist
   - SEI PROAKTIV: Handeln > Nachfragen
   - Frage NUR nach was WIRKLICH fehlt (maximal 1x pro Parameter)
   - Wenn User sagt "egal" → setze sinnvollen Default oder null
   - Gib kurze, freundliche Bestätigungen
   - Antworte IMMER auf Deutsch

4. ZUGRIFF:
   - Du hast Zugriff auf ALLES - nutze es!
   - Schau in den Kontext für IDs, Namen, Details
   - Verknüpfe Entities intelligent

═══ KONTEXT-VERSTÄNDNIS ═══

DER KONTEXT IST DEIN WISSEN! Alle Entities im Kontext sind real und existieren.

Wenn User fragt: "Weißt du was X ist?" oder "Kennst du X?"
→ PRÜFE den Kontext! Wenn X dort ist, sage:
  ✅ "Ja, X ist ein Venture/Projekt/Goal von dir. [Details aus Kontext]"
  
Wenn User fragt: "Welche Ventures/Projekte/Goals habe ich?"
→ LISTE sie aus dem Kontext auf mit IDs und Details

NIEMALS sagen "Ich weiß nicht" wenn die Info im Kontext steht!
Der Kontext = Dein Gedächtnis über das System des Users.

═══ VERKNÜPFUNGEN BEIM ERSTELLEN ═══

KRITISCH: IMMER beim Erstellen verknüpfen! NIE zwei separate Aktionen!

✅ NOTIZEN mit Entity verknüpfen:
[ACTION:ADD_NOTE:{"content":"Idee","linkedEntities":[{"type":"venture","id":"venture_123"}]}]

✅ TASKS mit Projekt verknüpfen:
[ACTION:ADD_TASK:{"title":"Feature bauen","projectId":"project_456"}]

✅ TASKS mit Venture verknüpfen:
[ACTION:ADD_TASK:{"title":"Pitch vorbereiten","ventureId":"venture_789"}]

✅ TASKS für Projekt erstellen (mit Zeitaufwand & Deadline):
User: "Ich muss heute 2h IPHO Vorbereitung machen"
→ Suche Projekt "IPHO Vorbereitung" im Kontext
→ [ACTION:ADD_TASK:{"title":"IPHO Vorbereitung","timeEstimate":120,"deadline":"2026-01-31","scheduledDate":"2026-01-31","projectId":"project_ipho","priority":"normal"}]
WICHTIG: Wenn "heute" → deadline UND scheduledDate auf heute setzen!

✅ HABITS mit Goal verknüpfen:
[ACTION:ADD_HABIT:{"name":"Täglich lernen","linkedGoals":["goal_123"]}]

✅ GOALS mit Key Results:
[ACTION:ADD_GOAL:{"title":"Fit werden","keyResults":[{"title":"10kg abnehmen","target":10,"current":0,"unit":"kg"}]}]

✅ VENTURES mit Team & Roadmap:
[ACTION:ADD_VENTURE:{"name":"Startup","team":["contact_abc"],"roadmap":[{"name":"MVP","status":"pending"}],"linkedProjects":["project_123"],"linkedGoals":["goal_456"]}]

✅ PROJECTS mit Team & Phasen:
[ACTION:ADD_PROJECT:{"name":"Website","team":["contact_abc"],"phases":[{"name":"Design","status":"pending"}],"milestones":[{"name":"Launch","dueDate":"2026-03-01"}]}]

❌ NIEMALS so (ID noch unbekannt):
[ACTION:ADD_NOTE:{"content":"Idee"}]
[ACTION:LINK_NOTE:{"noteId":"???","entityId":"venture_123"}]  ← FALSCH!

REGEL: Wenn beim Erstellen verknüpfbar → TU ES SOFORT IN DERSELBEN ACTION!

═══ REIHENFOLGE BEI ABHÄNGIGKEITEN ═══

Wenn eine Aktion von der ID einer anderen abhängt:

✅ RICHTIG (erst erstellen, dann verknüpfen):
User: "Erstelle Kontakt Max Müller und füge ihn zum Team von TechStartup hinzu"
1. [ACTION:ADD_CONTACT:{"name":"Max Müller"}]
2. Warte auf ID
3. [ACTION:ADD_TEAM_MEMBER:{"ventureId":"venture_123","contactId":"contact_neu"}]

❌ FALSCH (beide gleichzeitig = contactId noch unbekannt):
[ACTION:ADD_CONTACT:{"name":"Max Müller"}]
[ACTION:ADD_TEAM_MEMBER:{"ventureId":"venture_123","contactId":"???"}]

ABER: Wenn Kontakt SCHON EXISTIERT → direkt:
[ACTION:ADD_TEAM_MEMBER:{"ventureId":"venture_123","contactId":"contact_abc"}]

REGEL: Neue Entities erst erstellen, DANN ID nutzen. Existierende → direkt verwenden!

═══ KRITISCH: ACTION-TAG FORMAT ═══

NIEMALS Text-Beschreibungen von Aktionen! NUR valide ACTION-Tags!

❌ FALSCH:
"═══ NOTIZ ERSTELLEN ═══"
"Ich erstelle jetzt die Notiz..."
"Die Aktion wird ausgeführt..."

✅ RICHTIG:
[ACTION:ADD_NOTE:{"content":"Inhalt hier","type":"note"}]
[ACTION:LINK_NOTE:{"noteId":"note_123","entityType":"venture","entityId":"venture_456"}]

JEDE Aktion MUSS ein ACTION-Tag haben! Keine Pseudo-Aktionen!

═══ DISAMBIGUIERUNG ═══

Wenn mehrere Entities denselben Namen haben:
1. Zeige ALLE mit IDs: "Es gibt 2 MSM Ventures: [ID:abc] und [ID:xyz]"
2. FRAGE: "Welches meinst du?" 
3. Warte auf Antwort BEVOR du ACTION ausführst

═══ PROAKTIVE ERINNERUNGEN ═══

Du hast Zugriff auf die AKTIVITÄTSHISTORIE und VERNACHLÄSSIGTE ARBEIT im Kontext!

KRITISCH: Wenn User fragt "Was soll ich heute machen?" oder ähnliches:
→ Erwähne AKTIV Tasks/Projekte/Ventures, die lange nicht bearbeitet wurden!

BEISPIELE:

User: "Was soll ich heute machen?"
Atlas: "Hey! Du hast 'Munich Scholar Mentors' seit 12 Tagen nicht mehr bearbeitet. Das Projekt wartet auf dich! 
       Außerdem hast du 3 IPHO-Tasks die seit einer Woche offen sind. Willst du heute daran arbeiten?"

User: "Gib mir Empfehlungen für heute"
Atlas: "Ich sehe, dass 'MSM Roadmap Phase 2' seit 14 Tagen nicht angefasst wurde. Das könnte kritisch werden!
       Außerdem: Der Task 'Website bauen' ist seit 8 Tagen unbearbeitet. Soll ich das einplanen?"

User: "Was läuft gerade?"
Atlas: "Gut, dass du fragst! Dein Venture 'TechStartup' wurde seit 18 Tagen nicht aktualisiert.
       Ich würde vorschlagen, heute zumindest den Status zu checken."

REGEL: Nutze die "VERNACHLÄSSIGTE ARBEIT" Sektion im Kontext proaktiv!
- Tasks >7 Tage → erwähnen
- Projekte >14 Tage → definitiv erwähnen
- Ventures >14 Tage → prioritär erwähnen
- Sei hilfreich, nicht nervig: Max 2-3 Erwähnungen pro Antwort
- Biete direkt an, Tasks dafür zu erstellen oder Status zu updaten`,

    briefing: `Du bist Atlas, der persönliche AI-Assistent in Athena Ultra - einem Life Operating System.
Deine Aufgabe ist es, dem Nutzer einen hilfreichen, motivierenden Morgen-Briefing zu geben.

Richtlinien:
- Sei warm, persönlich aber professionell
- Nutze Emojis sparsam aber effektiv
- Gib konkrete, actionable Empfehlungen
- Berücksichtige Prioritäten und Deadlines
- Identifiziere potenzielle Konflikte oder Überbelastung
- ERWÄHNE vernachlässigte Projekte/Tasks aus der VERNACHLÄSSIGTE ARBEIT Sektion
- Sprich Deutsch

Format dein Briefing so:
1. Kurze Begrüßung passend zur Tageszeit
2. Überblick: Tasks, Meetings, Habits
3. ⚠️ WARNUNG bei vernachlässigten Projekten/Ventures
4. Top-Priorität des Tages
5. Ein konkreter Tipp oder Empfehlung
6. Motivierender Abschluss`,

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
  
  // Build OMNISCIENT context for the AI - FULL SYSTEM ACCESS
  buildContext() {
    const tasks = NexusStore.getTasks();
    const openTasks = tasks.filter(t => t.status !== 'completed');
    const habits = NexusStore.getHabits();
    const projects = NexusStore.getProjects();
    const ventures = NexusStore.getVentures();
    const goals = NexusStore.state.goals || [];
    const notes = NexusStore.getNotes();
    const contacts = NexusStore.getContacts();
    const markedDays = NexusStore.getMarkedDays();
    const today = new Date().toISOString().split('T')[0];
    
    // Get recent activities and neglected work
    const recentActivities = NexusStore.getRecentActivities(20);
    const neglectedWork = NexusStore.getNeglectedWork(7, 14, 14);
    
    // Calculate various stats
    const overdueTasks = openTasks.filter(t => {
      const dueDate = t.scheduledDate || t.deadline;
      return dueDate && dueDate < today;
    });
    const todayTasks = openTasks.filter(t => {
      const dueDate = t.scheduledDate || t.deadline;
      return dueDate && dueDate.startsWith(today);
    });
    const completedHabits = habits.filter(h => NexusStore.isHabitCompletedToday(h.id));
    
    return `
═══════════════════════════════════════════════════════════════
                    ATHENA ULTRA - VOLLSTÄNDIGER SYSTEM-KONTEXT
═══════════════════════════════════════════════════════════════

DATUM: ${new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
UHRZEIT: ${new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}

━━━ TASKS (${openTasks.length} offen, ${overdueTasks.length} überfällig) ━━━
${openTasks.slice(0, 15).map(t => `[ID:${t.id}] "${t.title}" | ${t.priority} | ${t.scheduledDate || 'kein Datum'} | Projekt: ${t.projectId || '-'}`).join('\n') || 'Keine Tasks'}

━━━ HABITS (${habits.length}, heute ${completedHabits.length} erledigt) ━━━
${habits.map(h => `[ID:${h.id}] ${h.icon || '🔄'} "${h.name}" | ${h.frequency} | Streak: ${h.streak || 0} | ${NexusStore.isHabitCompletedToday(h.id) ? '✓' : '○'}`).join('\n') || 'Keine Habits'}

━━━ PROJEKTE (${projects.length}) ━━━
${projects.map(p => {
  const pTasks = tasks.filter(t => t.projectId === p.id);
  const done = pTasks.filter(t => t.status === 'completed').length;
  const phases = (p.phases || []).map(ph => `${ph.name}(${ph.status})`).join(', ');
  return `[ID:${p.id}] "${p.name}" | ${p.status} | Tasks: ${done}/${pTasks.length} | Phasen: ${phases || '-'}`;
}).join('\n') || 'Keine Projekte'}

━━━ VENTURES (${ventures.length}) ━━━
${ventures.map(v => {
  const roadmapInfo = (v.roadmap || []).map(r => `[PhaseID:${r.id}]${r.name}(${r.progress||0}%)`).join(', ');
  const teamInfo = (v.team || []).length;
  const roiInfo = v.roiProjection ? `ROI:${v.roiProjection.score||'-'}/10` : 'ROI:-';
  const barriers = (v.barriers || []).filter(b => b.status === 'active').length;
  return `[ID:${v.id}] "${v.name}" | ${roiInfo} | Effort:${v.effortInvested||0}h | Roadmap:${roadmapInfo || '-'} | Team:${teamInfo} | Barriers:${barriers}`;
}).join('\n') || 'Keine Ventures'}

━━━ GOALS/ZIELE (${goals.length}) ━━━
${goals.map(g => {
  const krs = (g.keyResults || []).map(kr => `[KR:${kr.id}]${kr.title}(${kr.current}/${kr.target})`).join(', ');
  return `[ID:${g.id}] "${g.title}" | ${g.horizon} | ${g.progress || 0}% | KRs: ${krs || '-'}`;
}).join('\n') || 'Keine Ziele'}

━━━ NOTIZEN (${notes.length}) ━━━
${notes.slice(0, 10).map(n => `[ID:${n.id}] "${(n.content || '').substring(0, 50)}..." | Typ: ${n.type} | Links: ${(n.linkedEntities || []).length}`).join('\n') || 'Keine Notizen'}

━━━ KONTAKTE/TEAM (${contacts.length}) ━━━
${contacts.map(c => `[ID:${c.id}] "${c.name}" | ${c.role || '-'} | ${c.company || '-'} | ${c.email || '-'}`).join('\n') || 'Keine Kontakte'}

━━━ MARKIERTE TAGE (${markedDays.length}) ━━━
${markedDays.slice(0, 5).map(m => `[ID:${m.id}] "${m.title}" | ${m.date} | ${m.type}`).join('\n') || 'Keine markierten Tage'}

━━━ LETZTE AKTIVITÄTEN (Recent ${recentActivities.length}) ━━━
${recentActivities.map(a => {
  const timeAgo = Math.floor((new Date() - new Date(a.timestamp)) / (1000 * 60));
  const timeStr = timeAgo < 60 ? `${timeAgo}min` : `${Math.floor(timeAgo/60)}h`;
  const changeStr = Object.keys(a.changes || {}).length > 0 ? 
    Object.entries(a.changes).map(([k,v]) => `${k}:${v.old}→${v.new}`).join(', ') : '-';
  return `${timeStr} | ${a.action} | ${a.entityType}[${a.entityId}] | ${changeStr}`;
}).join('\n') || 'Keine Aktivitäten'}

━━━ ⚠️ VERNACHLÄSSIGTE ARBEIT (Forgotten/Stale) ━━━
TASKS (${neglectedWork.tasks.length} seit >7 Tagen nicht bearbeitet):
${neglectedWork.tasks.slice(0, 5).map(t => `[ID:${t.id}] "${t.title}" | Seit ${t.daysSinceUpdate} Tagen nicht bearbeitet! | ${t.priority}`).join('\n') || 'Keine vergessenen Tasks'}

PROJEKTE (${neglectedWork.projects.length} seit >14 Tagen nicht bearbeitet):
${neglectedWork.projects.slice(0, 3).map(p => `[ID:${p.id}] "${p.name}" | Seit ${p.daysSinceUpdate} Tagen nicht bearbeitet!`).join('\n') || 'Keine vernachlässigten Projekte'}

VENTURES (${neglectedWork.ventures.length} seit >14 Tagen nicht bearbeitet):
${neglectedWork.ventures.slice(0, 3).map(v => `[ID:${v.id}] "${v.name}" | Seit ${v.daysSinceUpdate} Tagen nicht bearbeitet!`).join('\n') || 'Keine vernachlässigten Ventures'}

⚠️ WICHTIG: Wenn User fragt "Was soll ich heute machen?", erwähne PROAKTIV vernachlässigte Tasks/Projekte!
Beispiel: "Du hast '{Projektname}' seit {X} Tagen nicht mehr bearbeitet. Willst du heute daran arbeiten?"

═══════════════════════════════════════════════════════════════
`;
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CHAT SESSION MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Initialize chat sessions
  initChatSessions() {
    const stored = localStorage.getItem(this.CHAT_STORAGE_KEY);
    if (stored) {
      this.chatSessions = JSON.parse(stored);
    } else {
      this.chatSessions = [];
    }
    
    // Clean up unused sessions (no messages and > 1 hour old)
    this.cleanupUnusedSessions();
    
    // Load last session or create new one
    if (this.chatSessions.length > 0) {
      this.currentSessionId = this.chatSessions[0].id;
    } else {
      this.createNewSession();
    }
  },
  
  // Create new chat session
  createNewSession(title = null) {
    const session = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: title || 'Neue Konversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
      isPinned: false
    };
    
    this.chatSessions.unshift(session);
    this.currentSessionId = session.id;
    this.saveSessions();
    
    return session;
  },
  
  // Get current session
  getCurrentSession() {
    return this.chatSessions.find(s => s.id === this.currentSessionId);
  },
  
  // Switch to a different session
  switchSession(sessionId) {
    const session = this.chatSessions.find(s => s.id === sessionId);
    if (session) {
      this.currentSessionId = sessionId;
      return session;
    }
    return null;
  },
  
  // Delete a session
  deleteSession(sessionId) {
    const index = this.chatSessions.findIndex(s => s.id === sessionId);
    if (index !== -1) {
      this.chatSessions.splice(index, 1);
      
      // If deleted current session, switch to another
      if (sessionId === this.currentSessionId) {
        if (this.chatSessions.length > 0) {
          this.currentSessionId = this.chatSessions[0].id;
        } else {
          this.createNewSession();
        }
      }
      
      this.saveSessions();
      return true;
    }
    return false;
  },
  
  // Add message to current session
  addMessage(role, content, metadata = {}) {
    const session = this.getCurrentSession();
    if (!session) return;
    
    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role, // 'user' or 'assistant'
      content,
      timestamp: new Date().toISOString(),
      metadata // actions executed, entities created, etc.
    };
    
    session.messages.push(message);
    session.updatedAt = new Date().toISOString();
    
    // Auto-generate title from first user message
    if (session.messages.length === 1 && role === 'user' && session.title === 'Neue Konversation') {
      session.title = content.substring(0, 50) + (content.length > 50 ? '...' : '');
    }
    
    this.saveSessions();
    return message;
  },
  
  // Get all messages from current session
  getCurrentMessages() {
    const session = this.getCurrentSession();
    return session ? session.messages : [];
  },
  
  // Pin/unpin session
  togglePinSession(sessionId) {
    const session = this.chatSessions.find(s => s.id === sessionId);
    if (session) {
      session.isPinned = !session.isPinned;
      this.sortSessions();
      this.saveSessions();
      return session.isPinned;
    }
    return false;
  },
  
  // Sort sessions (pinned first, then by updated date)
  sortSessions() {
    this.chatSessions.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  },
  
  // Clean up unused sessions (no messages, older than 1 hour, not pinned)
  cleanupUnusedSessions() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    this.chatSessions = this.chatSessions.filter(session => {
      if (session.isPinned) return true;
      if (session.messages.length > 0) return true;
      if (session.createdAt > oneHourAgo) return true;
      return false;
    });
    
    this.saveSessions();
  },
  
  // Save sessions to localStorage
  saveSessions() {
    this.sortSessions();
    localStorage.setItem(this.CHAT_STORAGE_KEY, JSON.stringify(this.chatSessions));
  },
  
  // Get session statistics
  getSessionStats(sessionId) {
    const session = this.chatSessions.find(s => s.id === sessionId);
    if (!session) return null;
    
    const userMessages = session.messages.filter(m => m.role === 'user').length;
    const assistantMessages = session.messages.filter(m => m.role === 'assistant').length;
    const actionsExecuted = session.messages.filter(m => m.metadata?.actions?.length > 0).length;
    
    return {
      totalMessages: session.messages.length,
      userMessages,
      assistantMessages,
      actionsExecuted,
      duration: new Date(session.updatedAt) - new Date(session.createdAt)
    };
  },
  
  // Clear conversation history (deprecated - use sessions)
  clearHistory() {
    this.conversationHistory = [];
    this.pendingAction = null;
    this.pendingParams = {};
  },
  
  // Check if API key is configured
  isConfigured() {
    const hasKey = !!this.getApiKey();
    console.log('✅ AtlasAI.isConfigured():', hasKey);
    return hasKey;
  },
  
  // Check if API key exists (alias)
  hasApiKey() {
    return this.isConfigured();
  },
  
  // Get API key from settings
  getApiKey() {
    console.log('🔍 getApiKey: Calling NexusStore.getSettings()...');
    const settings = NexusStore.getSettings();
    console.log('🔍 getApiKey: Got settings object:', settings);
    const apiKey = settings.apiKey || null;
    console.log('🔑 AtlasAI.getApiKey():', { apiKey: apiKey ? '***' + apiKey.slice(-4) : 'null', settings });
    return apiKey;
  },
  
  // Save API key
  setApiKey(key) {
    console.log('💾 AtlasAI.setApiKey():', { key: key ? '***' + key.slice(-4) : 'null' });
    NexusStore.updateSettings('apiKey', key);
    console.log('💾 After updateSettings, stored value:', localStorage.getItem('nexus_atlas_api_key') ? '***' + localStorage.getItem('nexus_atlas_api_key').slice(-4) : 'null');
  },
  
  // Remove API key
  removeApiKey() {
    NexusStore.updateSettings('apiKey', '');
  },
  
  // Test API connection
  async testConnection(apiKey = null) {
    const keyToTest = apiKey || this.getApiKey();
    
    if (!keyToTest) {
      return { success: false, error: 'Kein API Key konfiguriert' };
    }
    
    try {
      const response = await this.chat([
        { role: 'user', content: 'Antworte nur mit "OK"' }
      ], { maxTokens: 10, apiKey: keyToTest });
      
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
  
  // OMNISCIENT Execute - kann ALLES im System steuern
  async executeAction(action) {
    console.log('🔮 Atlas OMNISCIENT executing:', action.type);
    console.log('   Data:', JSON.stringify(action.data));
    
    const refreshUI = () => {
      if (typeof NexusApp !== 'undefined') {
        NexusApp.refreshCurrentPage();
        NexusApp.updateSidebarBadges();
      }
    };
    
    const d = action.data || {};
    
    switch (action.type) {
      
      // ═══ TASKS ═══
      case 'ADD_TASK':
        if (d.title) {
          const task = NexusStore.addTask({
            title: d.title,
            description: d.description || '',
            priority: d.priority || 'normal',
            spheres: d.sphere ? [d.sphere] : ['freizeit'],
            projectId: d.projectId && d.projectId !== 'null' ? d.projectId : null,
            deadline: d.dueDate || null,
            scheduledDate: d.dueDate || null,
            scheduledTime: d.time || null,
            timeEstimate: d.timeEstimate || null,
            tags: d.tags || []
          });
          console.log('✅ Task created:', task.title);
          refreshUI();
        }
        break;
        
      case 'UPDATE_TASK':
        if (d.id && d.updates) {
          NexusStore.updateTask(d.id, d.updates);
          console.log('✅ Task updated:', d.id);
          refreshUI();
        }
        break;
        
      case 'COMPLETE_TASK':
        if (d.id) {
          NexusStore.completeTask(d.id);
          console.log('✅ Task completed:', d.id);
          refreshUI();
        }
        break;
        
      case 'DELETE_TASK':
        if (d.id) {
          NexusStore.deleteTask(d.id);
          console.log('✅ Task deleted:', d.id);
          refreshUI();
        }
        break;
      
      // ═══ HABITS ═══
      case 'ADD_HABIT':
        if (d.name) {
          const habit = NexusStore.addHabit({
            name: d.name,
            icon: d.icon || '🔄',
            frequency: d.frequency || 'daily',
            scheduledDays: d.scheduledDays || null,
            preferredTime: d.preferredTime || null,
            sphere: d.sphere || 'freizeit',
            habitType: d.habitType || 'positive',
            linkedGoals: d.linkedGoals || []
          });
          console.log('✅ Habit created:', habit.name);
          refreshUI();
        }
        break;
        
      case 'UPDATE_HABIT':
        if (d.id && d.updates) {
          NexusStore.updateHabit(d.id, d.updates);
          console.log('✅ Habit updated:', d.id);
          refreshUI();
        }
        break;
        
      case 'DELETE_HABIT':
        if (d.id) {
          NexusStore.deleteHabit(d.id);
          console.log('✅ Habit deleted:', d.id);
          refreshUI();
        }
        break;
      
      // ═══ PROJEKTE ═══
      case 'ADD_PROJECT':
        if (d.name) {
          const project = NexusStore.addProject({
            name: d.name,
            description: d.description || '',
            spheres: d.sphere ? [d.sphere] : ['projekte'],
            status: d.status || 'active',
            phases: d.phases || [],
            team: d.team || [],
            targetEnd: d.targetEnd || null
          });
          console.log('✅ Project created:', project.name);
          refreshUI();
        }
        break;
        
      case 'UPDATE_PROJECT':
        if (d.id && d.updates) {
          NexusStore.updateProject(d.id, d.updates);
          console.log('✅ Project updated:', d.id);
          refreshUI();
        }
        break;
        
      case 'DELETE_PROJECT':
        if (d.id) {
          NexusStore.deleteProject(d.id);
          console.log('✅ Project deleted:', d.id);
          refreshUI();
        }
        break;
        
      case 'ADD_PROJECT_PHASE':
        if (d.projectId && d.phase) {
          const project = NexusStore.getProjectById(d.projectId);
          if (project) {
            const phases = project.phases || [];
            phases.push({
              id: NexusStore.generateId(),
              name: d.phase.name,
              description: d.phase.description || '',
              status: d.phase.status || 'pending',
              progress: d.phase.progress || 0,
              startDate: d.phase.startDate || null,
              endDate: d.phase.endDate || null
            });
            NexusStore.updateProject(d.projectId, { phases });
            console.log('✅ Project phase added:', d.phase.name);
            refreshUI();
          }
        }
        break;
      
      // ═══ VENTURES ═══
      case 'ADD_VENTURE':
        if (d.name) {
          const venture = NexusStore.addVenture({
            name: d.name,
            description: d.description || '',
            spheres: d.spheres || ['geschaeft'],
            roadmap: d.roadmap || [],
            team: d.team || [],
            bestCase: d.bestCase || '',
            worstCase: d.worstCase || ''
          });
          console.log('✅ Venture created:', venture.name);
          refreshUI();
        }
        break;
        
      case 'UPDATE_VENTURE':
        if (d.id && d.updates) {
          const venture = NexusStore.getVentureById(d.id);
          if (venture) {
            Object.assign(venture, d.updates, { updatedAt: new Date().toISOString() });
            NexusStore.save();
            console.log('✅ Venture updated:', d.id);
            refreshUI();
          }
        }
        break;
        
      case 'ADD_ROADMAP_PHASE':
        if (d.ventureId && d.phase) {
          const venture = NexusStore.getVentureById(d.ventureId);
          if (venture) {
            const roadmap = venture.roadmap || [];
            roadmap.push({
              id: NexusStore.generateId(),
              name: d.phase.name,
              description: d.phase.description || '',
              status: d.phase.status || 'pending',
              progress: d.phase.progress || 0,
              startDate: d.phase.startDate || null,
              endDate: d.phase.endDate || null,
              milestones: d.phase.milestones || []
            });
            venture.roadmap = roadmap;
            NexusStore.save();
            console.log('✅ Roadmap phase added:', d.phase.name);
            refreshUI();
          }
        }
        break;
        
      case 'ADD_TEAM_MEMBER':
        if (d.ventureId && d.contactId) {
          const venture = NexusStore.getVentureById(d.ventureId);
          if (venture) {
            venture.team = venture.team || [];
            // Support both simple ID array and object with role
            const existingMember = venture.team.find(m => 
              (typeof m === 'object' ? m.contactId : m) === d.contactId
            );
            if (!existingMember) {
              if (d.role) {
                // Store as object with role
                venture.team.push({ contactId: d.contactId, role: d.role });
              } else {
                venture.team.push(d.contactId);
              }
              NexusStore.save();
              console.log('✅ Team member added to venture');
              refreshUI();
            }
          }
        }
        break;
      
      // ═══ GOALS ═══
      case 'ADD_GOAL':
        if (d.title) {
          const goal = NexusStore.addGoal({
            title: d.title,
            description: d.description || '',
            horizon: d.horizon || '1-year',
            spheres: d.spheres || [],
            icon: d.icon || '🎯',
            keyResults: d.keyResults || []
          });
          console.log('✅ Goal created:', goal.title);
          refreshUI();
        }
        break;
        
      case 'UPDATE_GOAL':
        if (d.id && d.updates) {
          const goals = NexusStore.state.goals || [];
          const goal = goals.find(g => g.id === d.id);
          if (goal) {
            Object.assign(goal, d.updates, { updatedAt: new Date().toISOString() });
            NexusStore.save();
            console.log('✅ Goal updated:', d.id);
            refreshUI();
          }
        }
        break;
        
      case 'ADD_KEY_RESULT':
        if (d.goalId && d.keyResult) {
          const goals = NexusStore.state.goals || [];
          const goal = goals.find(g => g.id === d.goalId);
          if (goal) {
            const keyResults = goal.keyResults || [];
            keyResults.push({
              id: NexusStore.generateId(),
              title: d.keyResult.title,
              target: d.keyResult.target || 100,
              current: d.keyResult.current || 0,
              unit: d.keyResult.unit || '',
              completed: false
            });
            goal.keyResults = keyResults;
            NexusStore.save();
            console.log('✅ Key Result added:', d.keyResult.title);
            refreshUI();
          }
        }
        break;
      
      // ═══ NOTIZEN ═══
      case 'ADD_NOTE':
        if (d.content) {
          const note = NexusStore.addNote({
            content: d.content,
            type: d.type || 'note',
            sphere: d.sphere || null,
            tags: d.tags || [],
            linkedEntities: d.linkedEntities || []
          });
          console.log('✅ Note created');
          refreshUI();
        }
        break;
        
      case 'UPDATE_NOTE':
        if (d.id && d.updates) {
          NexusStore.updateNote(d.id, d.updates);
          console.log('✅ Note updated:', d.id);
          refreshUI();
        }
        break;
        
      case 'DELETE_NOTE':
        if (d.id) {
          NexusStore.deleteNote(d.id);
          console.log('✅ Note deleted:', d.id);
          refreshUI();
        }
        break;
        
      case 'LINK_NOTE':
        if (d.noteId && d.entityType && d.entityId) {
          const notes = NexusStore.getNotes();
          const note = notes.find(n => n.id === d.noteId);
          if (note) {
            const links = note.linkedEntities || [];
            links.push({ type: d.entityType, id: d.entityId });
            NexusStore.updateNote(d.noteId, { linkedEntities: links });
            console.log('✅ Note linked to', d.entityType);
            refreshUI();
          }
        }
        break;
      
      // ═══ KONTAKTE ═══
      case 'ADD_CONTACT':
        if (d.name) {
          const contact = NexusStore.addContact({
            name: d.name,
            email: d.email || '',
            phone: d.phone || '',
            role: d.role || '',
            company: d.company || '',
            category: d.category || null,
            notes: d.notes || ''
          });
          console.log('✅ Contact created:', contact.name);
          refreshUI();
        }
        break;
        
      case 'UPDATE_CONTACT':
        if (d.id && d.updates) {
          NexusStore.updateContact(d.id, d.updates);
          console.log('✅ Contact updated:', d.id);
          refreshUI();
        }
        break;
        
      case 'DELETE_CONTACT':
        if (d.id) {
          NexusStore.deleteContact(d.id);
          console.log('✅ Contact deleted:', d.id);
          refreshUI();
        }
        break;
      
      // ═══ KALENDER ═══
      case 'MARK_DAY':
        if (d.date && d.title) {
          NexusStore.addMarkedDay({
            date: d.date,
            endDate: d.endDate || null,
            title: d.title,
            type: d.type || 'event',
            recurring: d.recurring || null,
            notes: d.notes || ''
          });
          console.log('✅ Day marked:', d.title);
          refreshUI();
        }
        break;
        
      case 'UPDATE_MARKED_DAY':
        if (d.id && d.updates) {
          NexusStore.updateMarkedDay(d.id, d.updates);
          console.log('✅ Marked day updated:', d.id);
          refreshUI();
        }
        break;
        
      case 'DELETE_MARKED_DAY':
        if (d.id) {
          NexusStore.deleteMarkedDay(d.id);
          console.log('✅ Marked day deleted:', d.id);
          refreshUI();
        }
        break;
      
      // ═══ VENTURE EVALUATION ═══
      case 'UPDATE_EVALUATION':
        if (d.ventureId) {
          const venture = NexusStore.getVentureById(d.ventureId);
          if (venture) {
            if (d.roiScore !== null && d.roiScore !== undefined) {
              venture.roiProjection = venture.roiProjection || {};
              venture.roiProjection.score = d.roiScore;
            }
            if (d.expectedReturn !== null && d.expectedReturn !== undefined) {
              venture.roiProjection = venture.roiProjection || {};
              venture.roiProjection.expected = d.expectedReturn;
            }
            if (d.effortInvested !== null && d.effortInvested !== undefined) {
              venture.effortInvested = d.effortInvested;
            }
            if (d.bestCase) venture.bestCase = d.bestCase;
            if (d.worstCase) venture.worstCase = d.worstCase;
            venture.updatedAt = new Date().toISOString();
            NexusStore.save();
            console.log('✅ Venture evaluation updated');
            refreshUI();
          }
        }
        break;
        
      case 'LOG_EFFORT':
        if (d.ventureId && d.hours) {
          const venture = NexusStore.getVentureById(d.ventureId);
          if (venture) {
            venture.effortInvested = (venture.effortInvested || 0) + parseFloat(d.hours);
            venture.effortLog = venture.effortLog || [];
            venture.effortLog.push({
              id: NexusStore.generateId(),
              hours: parseFloat(d.hours),
              description: d.description || '',
              date: d.date || new Date().toISOString().split('T')[0]
            });
            venture.updatedAt = new Date().toISOString();
            NexusStore.save();
            console.log('✅ Effort logged:', d.hours, 'hours');
            refreshUI();
          }
        }
        break;
        
      case 'ADD_BARRIER':
        if (d.ventureId && d.description) {
          const venture = NexusStore.getVentureById(d.ventureId);
          if (venture) {
            venture.barriers = venture.barriers || [];
            venture.barriers.push({
              id: NexusStore.generateId(),
              description: d.description,
              severity: d.severity || 'medium',
              suggestedAction: d.suggestedAction || '',
              status: 'active',
              createdAt: new Date().toISOString()
            });
            NexusStore.save();
            console.log('✅ Barrier added');
            refreshUI();
          }
        }
        break;
        
      case 'UPDATE_BARRIER':
        if (d.ventureId && d.barrierId && d.updates) {
          const venture = NexusStore.getVentureById(d.ventureId);
          if (venture && venture.barriers) {
            const barrier = venture.barriers.find(b => b.id === d.barrierId);
            if (barrier) {
              Object.assign(barrier, d.updates);
              NexusStore.save();
              console.log('✅ Barrier updated');
              refreshUI();
            }
          }
        }
        break;
        
      case 'RESOLVE_BARRIER':
        if (d.ventureId && d.barrierId) {
          const venture = NexusStore.getVentureById(d.ventureId);
          if (venture && venture.barriers) {
            const barrier = venture.barriers.find(b => b.id === d.barrierId);
            if (barrier) {
              barrier.status = 'resolved';
              barrier.resolvedAt = new Date().toISOString();
              NexusStore.save();
              console.log('✅ Barrier resolved');
              refreshUI();
            }
          }
        }
        break;
        
      case 'ADD_RISK':
        if (d.ventureId && d.description) {
          const venture = NexusStore.getVentureById(d.ventureId);
          if (venture) {
            venture.riskMatrix = venture.riskMatrix || [];
            venture.riskMatrix.push({
              id: NexusStore.generateId(),
              description: d.description,
              probability: d.probability || 'medium',
              impact: d.impact || 'medium',
              mitigation: d.mitigation || '',
              status: 'active',
              createdAt: new Date().toISOString()
            });
            NexusStore.save();
            console.log('✅ Risk added');
            refreshUI();
          }
        }
        break;
        
      case 'ADD_PIVOT_OPTION':
        if (d.ventureId && d.name) {
          const venture = NexusStore.getVentureById(d.ventureId);
          if (venture) {
            venture.pivotOptions = venture.pivotOptions || [];
            venture.pivotOptions.push({
              id: NexusStore.generateId(),
              name: d.name,
              description: d.description || '',
              trigger: d.trigger || '',
              createdAt: new Date().toISOString()
            });
            NexusStore.save();
            console.log('✅ Pivot option added:', d.name);
            refreshUI();
          }
        }
        break;
      
      // ═══ ROADMAP PHASE UPDATES ═══
      case 'UPDATE_ROADMAP_PHASE':
        if (d.ventureId && d.phaseId && d.updates) {
          const venture = NexusStore.getVentureById(d.ventureId);
          if (venture && venture.roadmap) {
            const phase = venture.roadmap.find(p => p.id === d.phaseId);
            if (phase) {
              Object.assign(phase, d.updates);
              NexusStore.save();
              console.log('✅ Roadmap phase updated');
              refreshUI();
            }
          }
        }
        break;
        
      case 'DELETE_ROADMAP_PHASE':
        if (d.ventureId && d.phaseId) {
          const venture = NexusStore.getVentureById(d.ventureId);
          if (venture && venture.roadmap) {
            venture.roadmap = venture.roadmap.filter(p => p.id !== d.phaseId);
            NexusStore.save();
            console.log('✅ Roadmap phase deleted');
            refreshUI();
          }
        }
        break;
        
      case 'ADD_PHASE_MILESTONE':
        if (d.ventureId && d.phaseId && d.milestone) {
          const venture = NexusStore.getVentureById(d.ventureId);
          if (venture && venture.roadmap) {
            const phase = venture.roadmap.find(p => p.id === d.phaseId);
            if (phase) {
              phase.milestones = phase.milestones || [];
              phase.milestones.push({
                id: NexusStore.generateId(),
                name: d.milestone.name,
                dueDate: d.milestone.dueDate || null,
                status: 'pending'
              });
              NexusStore.save();
              console.log('✅ Milestone added to phase');
              refreshUI();
            }
          }
        }
        break;
      
      // ═══ TEAM MEMBERS ═══
      case 'REMOVE_TEAM_MEMBER':
        if (d.ventureId && d.contactId) {
          const venture = NexusStore.getVentureById(d.ventureId);
          if (venture && venture.team) {
            venture.team = venture.team.filter(id => id !== d.contactId);
            NexusStore.save();
            console.log('✅ Team member removed');
            refreshUI();
          }
        }
        break;
      
      // ═══ PROJECT MILESTONES ═══
      case 'ADD_PROJECT_MILESTONE':
        if (d.projectId && d.milestone) {
          const project = NexusStore.getProjectById(d.projectId);
          if (project) {
            project.milestones = project.milestones || [];
            project.milestones.push({
              id: NexusStore.generateId(),
              name: d.milestone.name,
              dueDate: d.milestone.dueDate || null,
              status: d.milestone.status || 'pending'
            });
            NexusStore.updateProject(d.projectId, { milestones: project.milestones });
            console.log('✅ Project milestone added');
            refreshUI();
          }
        }
        break;
      
      // ═══ KEY RESULTS ═══
      case 'UPDATE_KEY_RESULT':
        if (d.goalId && d.keyResultId && d.updates) {
          const goals = NexusStore.state.goals || [];
          const goal = goals.find(g => g.id === d.goalId);
          if (goal && goal.keyResults) {
            const kr = goal.keyResults.find(k => k.id === d.keyResultId);
            if (kr) {
              if (d.updates.current !== null && d.updates.current !== undefined) kr.current = d.updates.current;
              if (d.updates.target !== null && d.updates.target !== undefined) kr.target = d.updates.target;
              if (d.updates.completed !== null && d.updates.completed !== undefined) kr.completed = d.updates.completed;
              NexusStore.save();
              console.log('✅ Key result updated');
              refreshUI();
            }
          }
        }
        break;
      
      // ═══ GOALS EXTENDED ═══
      case 'DELETE_GOAL':
        if (d.id) {
          const goals = NexusStore.state.goals || [];
          NexusStore.state.goals = goals.filter(g => g.id !== d.id);
          NexusStore.save();
          console.log('✅ Goal deleted:', d.id);
          refreshUI();
        }
        break;
        
      case 'ADD_YEARLY_MILESTONE':
        if (d.goalId && d.year && d.milestone) {
          const goals = NexusStore.state.goals || [];
          const goal = goals.find(g => g.id === d.goalId);
          if (goal) {
            goal.yearlyMilestones = goal.yearlyMilestones || [];
            goal.yearlyMilestones.push({
              year: d.year,
              milestone: d.milestone,
              completed: false
            });
            NexusStore.save();
            console.log('✅ Yearly milestone added');
            refreshUI();
          }
        }
        break;
      
      // ═══ VENTURES EXTENDED ═══
      case 'DELETE_VENTURE':
        if (d.id) {
          NexusStore.deleteVenture(d.id);
          console.log('✅ Venture deleted:', d.id);
          refreshUI();
        }
        break;
      
      // ═══ CONTACT INTERACTIONS ═══
      case 'LOG_INTERACTION':
        if (d.contactId) {
          const contact = NexusStore.getContactById(d.contactId);
          if (contact) {
            contact.interactions = contact.interactions || [];
            contact.interactions.push({
              id: NexusStore.generateId(),
              type: d.type || 'meeting',
              notes: d.notes || '',
              date: d.date || new Date().toISOString()
            });
            contact.lastContact = d.date || new Date().toISOString();
            NexusStore.updateContact(d.contactId, { 
              interactions: contact.interactions,
              lastContact: contact.lastContact
            });
            console.log('✅ Interaction logged');
            refreshUI();
          }
        }
        break;
      
      // ═══ EVENTS ═══
      case 'ADD_EVENT':
        if (d.title && d.dateTime) {
          const events = NexusStore.state.events || [];
          const event = {
            id: NexusStore.generateId(),
            title: d.title,
            dateTime: d.dateTime,
            duration: d.duration || 60,
            location: d.location || '',
            attendees: d.attendees || [],
            recurrence: d.recurrence || null,
            createdAt: new Date().toISOString()
          };
          events.push(event);
          NexusStore.state.events = events;
          NexusStore.save();
          console.log('✅ Event created:', d.title);
          refreshUI();
        }
        break;
        
      case 'UPDATE_EVENT':
        if (d.id && d.updates) {
          const events = NexusStore.state.events || [];
          const event = events.find(e => e.id === d.id);
          if (event) {
            Object.assign(event, d.updates);
            NexusStore.save();
            console.log('✅ Event updated');
            refreshUI();
          }
        }
        break;
        
      case 'DELETE_EVENT':
        if (d.id) {
          NexusStore.state.events = (NexusStore.state.events || []).filter(e => e.id !== d.id);
          NexusStore.save();
          console.log('✅ Event deleted');
          refreshUI();
        }
        break;
      
      // ═══ ENTITY LINKING ═══
      case 'LINK_PROJECT_TO_VENTURE':
        if (d.projectId && d.ventureId) {
          const venture = NexusStore.getVentureById(d.ventureId);
          if (venture) {
            venture.linkedProjects = venture.linkedProjects || [];
            if (!venture.linkedProjects.includes(d.projectId)) {
              venture.linkedProjects.push(d.projectId);
              NexusStore.save();
              console.log('✅ Project linked to venture');
              refreshUI();
            }
          }
        }
        break;
        
      case 'LINK_GOAL_TO_VENTURE':
        if (d.goalId && d.ventureId) {
          const venture = NexusStore.getVentureById(d.ventureId);
          if (venture) {
            venture.linkedGoals = venture.linkedGoals || [];
            if (!venture.linkedGoals.includes(d.goalId)) {
              venture.linkedGoals.push(d.goalId);
              NexusStore.save();
              console.log('✅ Goal linked to venture');
              refreshUI();
            }
          }
        }
        break;
      
      // ═══ NAVIGATION EXTENDED ═══
      case 'OPEN_VENTURE':
        if (d.ventureId && typeof VentureCockpit !== 'undefined') {
          NexusApp.navigateTo('ventures');
          setTimeout(() => VentureCockpit.openCockpit(d.ventureId), 100);
        }
        break;
        
      case 'OPEN_PROJECT':
        if (d.projectId && typeof NexusApp !== 'undefined') {
          NexusApp.navigateTo('projects');
          // TODO: Open project detail view
        }
        break;
      
      // ═══ VERKNÜPFUNGEN ═══
      case 'LINK':
        if (d.sourceType && d.sourceId && d.targetType && d.targetId) {
          // Generische Verknüpfung zwischen beliebigen Entitäten
          let source = null;
          let linkField = '';
          
          switch (d.sourceType) {
            case 'note':
              source = NexusStore.getNotes().find(n => n.id === d.sourceId);
              linkField = 'linkedEntities';
              break;
            case 'task':
              source = NexusStore.getTaskById(d.sourceId);
              linkField = 'linkedNotes';
              break;
            case 'habit':
              source = NexusStore.getHabitById(d.sourceId);
              linkField = 'linkedGoals';
              break;
            case 'project':
              source = NexusStore.getProjectById(d.sourceId);
              linkField = 'linkedNotes';
              break;
          }
          
          if (source) {
            const links = source[linkField] || [];
            const linkEntry = d.sourceType === 'note' 
              ? { type: d.targetType, id: d.targetId }
              : d.targetId;
            
            if (!links.some(l => (typeof l === 'object' ? l.id : l) === d.targetId)) {
              links.push(linkEntry);
              source[linkField] = links;
              NexusStore.save();
              console.log('✅ Linked', d.sourceType, 'to', d.targetType);
              refreshUI();
            }
          }
        }
        break;
      
      // ═══ NAVIGATION ═══
      case 'NAVIGATE':
        if (d.page && typeof NexusApp !== 'undefined') {
          NexusApp.navigateTo(d.page);
          NexusApp.closeAtlas();
        }
        break;
      
      // ═══ NACHFRAGE ═══
      case 'ASK_PARAMS':
        // Diese Aktion bedeutet, dass Atlas nach fehlenden Parametern fragt
        // Die Frage ist bereits im Response-Text enthalten
        this.pendingAction = d.action;
        this.pendingParams = d.collectedParams || {};
        console.log('❓ Atlas asking for:', d.missingParams);
        break;
        
      case 'SHOW_TASKS':
      case 'SHOW_HABITS':
      case 'SHOW_SUMMARY':
        // Informational - response already contains the info
        break;
        
      default:
        console.warn('⚠️ Unknown action type:', action.type);
    }
  },
  
  // Core chat function (expects messages array)
  async chat(messages, options = {}) {
    const apiKey = options.apiKey || this.getApiKey();
    
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
    
    // Log API usage
    this.logAPIUsage(data.usage?.total_tokens || 0);
    
    return data.choices[0].message.content;
  },
  
  // Log API usage for quota tracking
  logAPIUsage(tokens) {
    try {
      const stored = localStorage.getItem('atlas_api_usage');
      const usage = stored ? JSON.parse(stored) : { 
        daily: {}, 
        total: { requests: 0, tokens: 0 } 
      };
      
      const today = new Date().toISOString().split('T')[0];
      
      if (!usage.daily[today]) {
        usage.daily[today] = { requests: 0, tokens: 0 };
      }
      
      usage.daily[today].requests++;
      usage.daily[today].tokens += tokens;
      usage.total.requests++;
      usage.total.tokens += tokens;
      
      localStorage.setItem('atlas_api_usage', JSON.stringify(usage));
    } catch (error) {
      console.error('Failed to log API usage:', error);
    }
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
