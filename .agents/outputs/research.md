# Research: upgrade_vibecraft

## Problem Statement

Vibecraft currently visualizes Claude Code sessions in a 3D workshop, but lacks:
1. **Auto-discovery of agents** - Sessions only appear when manually spawned or when events arrive
2. **Advanced observability** - No token usage, cost tracking, or latency metrics
3. **Multi-agent orchestration visibility** - Limited insight into agent hierarchies and workflows

The goal is to upgrade Vibecraft to be a more comprehensive AI agent monitoring and orchestration dashboard.

## Target Users & Impact

- **Who:** Developers using Claude Code, especially those running multiple sessions
- **Frequency:** Daily use during development sessions
- **Impact:** **High** - Better visibility into agent activity, costs, and orchestration patterns

## Research Findings

### 1. Auto-Spawn Agents into Grid

**Current Implementation:**
- Sessions are created via `getOrCreateSession()` in `main.ts:1346`
- Zones are created via `scene.createZone()` in `WorkshopScene.ts`
- Events trigger session creation when `session_start` or tool events arrive
- Managed sessions can be spawned via the UI (click empty hex → new session modal)

**Possible Approaches for Auto-Add:**

| Approach | Pros | Cons |
|----------|------|------|
| **A: tmux session discovery** | Finds all running Claude instances automatically | Requires polling, may miss non-tmux sessions |
| **B: Claude Code process scanning** | More reliable detection | Platform-specific, privacy concerns |
| **C: Hook-based registration** | Clean, event-driven | Requires Claude to be configured with hooks |
| **D: Central orchestrator API** | Full control, multi-machine support | More complex, needs external service |

**Recommended: Hybrid (A + C)**
- Use hooks for real-time detection (already implemented)
- Add tmux session scanning for discovery of unhooked sessions
- Periodically poll for new tmux sessions with "claude" in the command

**Implementation Points:**
- `server/index.ts` - Add tmux discovery endpoint
- `src/main.ts` - Auto-create zones for discovered sessions
- New polling interval (every 5-10 seconds)

### 2. Observability Improvements

Based on [AI Agent Observability Tools 2026](https://research.aimultiple.com/agentic-monitoring/):

| Feature | Value | Effort |
|---------|-------|--------|
| **Token usage dashboard** | Track API spending per session | Medium |
| **Latency tracking** | Response times per tool | Low (already have duration) |
| **Cost estimation** | $ per session/day | Medium |
| **Error rate tracking** | Alert on high failure rates | Low |
| **Session replay** | Rewind and review agent runs | High |

**Quick wins:**
- Aggregate `duration` data already captured in `post_tool_use`
- Add token counters (needs Claude API integration or transcript parsing)
- Display error rates from `success: false` events

### 3. Multi-Agent Orchestration Visualization

Based on [Microsoft AI Agent Patterns](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns):

**Current state:**
- Subagents visualized via `SubagentManager.ts`
- Task tool spawns mini-Claudes at portal station
- Parent-child relationship tracked via `toolUseId`

**Improvements:**
- **Decision tree view** - Visualize agent reasoning steps
- **Hierarchy lines** - Draw connections between parent/child agents
- **Orchestration patterns** - Detect and label patterns (sequential, parallel, hierarchical)

### 4. Three.js Multiplayer Patterns

Based on [threejs-multiplayer](https://github.com/jgarrettvml/threejs-multiplayer):

**Relevant for auto-spawn:**
- Real-time entity synchronization via WebSocket (already have this)
- Entity pooling for performance (spawn/despawn many agents)
- Smooth interpolation for position updates

**Potential integration:**
- [Trystero](https://medium.com/@pablobandinopla/effortless-serverless-multiplayer-in-three-js-with-trystero-f025f31150c6) for P2P multi-machine sync (future)

## Technical Feasibility

- **Complexity:** Medium
- **Integration points:**
  - `server/index.ts` - tmux discovery, token polling
  - `src/main.ts` - auto-zone creation logic
  - `src/scene/WorkshopScene.ts` - hierarchy visualization
  - `shared/types.ts` - new event types
- **Risks:**
  - Performance with many agents (mitigate with entity pooling)
  - tmux scanning may have edge cases
- **Dependencies:**
  - None new for MVP (use existing tmux, WebSocket)

## Recommendation

**GO**

The upgrade is valuable and technically feasible. Recommended phased approach:

### Phase 1: Auto-Discovery (Low effort, High value)
- Add tmux session scanning on server
- Auto-create zones for discovered Claude sessions
- Polling interval: 10 seconds

### Phase 2: Observability Dashboard (Medium effort, High value)
- Token usage tracking (parse from events or add API)
- Latency/duration aggregation (data already exists)
- Error rate display

### Phase 3: Orchestration Visualization (High effort, Medium value)
- Parent-child connection lines
- Decision tree view
- Pattern detection

## Questions for Human

1. **Scope:** Should we focus on Phase 1 (auto-discovery) first, or tackle all phases?
2. **Token tracking:** Do you want to parse tokens from Claude's transcript, or integrate with Anthropic API for accurate counts?
3. **Multi-machine:** Should agents from remote machines be supported (requires central server)?

---

**Sources:**
- [AI Agent Observability Tools 2026](https://research.aimultiple.com/agentic-monitoring/)
- [Microsoft AI Agent Design Patterns](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns)
- [Multi-Agent Orchestration Guide](https://superagi.com/agentic-ai-orchestration-a-step-by-step-guide-to-managing-multiple-ai-agents-and-ml-models/)
- [threejs-multiplayer](https://github.com/jgarrettvml/threejs-multiplayer)
- [Trystero for Three.js](https://medium.com/@pablobandinopla/effortless-serverless-multiplayer-in-three-js-with-trystero-f025f31150c6)

---

**Ready for GO/NO-GO decision**

- **GO:** `./orchestrate.sh approve research`
- **NO-GO:** `./orchestrate.sh reject research`
