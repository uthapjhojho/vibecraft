# Architecture: upgrade_vibecraft

## Overview

Upgrade Vibecraft to auto-discover Claude Code sessions and provide enhanced observability. The system will automatically detect running Claude instances via tmux scanning, create 3D zones for them, and display real-time metrics (tokens, latency, costs). This transforms Vibecraft from a passive visualizer into an active agent monitoring dashboard.

## User Stories

- As a developer, I want Claude sessions to automatically appear in the 3D view so that I don't need to manually spawn them
- As a developer, I want to see token usage per session so that I can track API costs
- As a developer, I want to see error rates and latency so that I can identify problematic sessions
- As a developer, I want to see parent-child relationships between agents so that I can understand orchestration flows

## Components

### New Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `TmuxDiscovery` | Scan for running Claude/Codex tmux sessions | `server/TmuxDiscovery.ts` |
| `MetricsCollector` | Aggregate token usage, latency, error rates | `server/MetricsCollector.ts` |
| `MetricsPanel` | Display session metrics in UI | `src/ui/MetricsPanel.ts` |
| `AgentHierarchy` | Track parent-child agent relationships | `src/scene/AgentHierarchy.ts` |

### Modified Components

| Component | Changes Required |
|-----------|------------------|
| `server/index.ts` | Add discovery polling, metrics endpoints, broadcast discovered sessions |
| `src/main.ts` | Handle `session_discovered` events, auto-create zones |
| `shared/types.ts` | Add `SessionDiscoveredEvent`, `MetricsData` types |
| `src/scene/WorkshopScene.ts` | Add hierarchy connection lines between zones |
| `src/ui/FeedManager.ts` | Display metrics inline with sessions |

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SERVER (index.ts)                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐    ┌─────────────────┐    ┌────────────────┐  │
│  │ TmuxDiscovery   │    │ MetricsCollector│    │ Event Handler  │  │
│  │                 │    │                 │    │                │  │
│  │ Poll every 10s  │    │ Aggregate from  │    │ Existing hook  │  │
│  │ tmux list-sess  │    │ events.jsonl    │    │ events flow    │  │
│  └────────┬────────┘    └────────┬────────┘    └───────┬────────┘  │
│           │                      │                      │          │
│           ▼                      ▼                      ▼          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    WebSocket Broadcast                        │  │
│  │  • session_discovered (new)                                   │  │
│  │  • metrics_update (new)                                       │  │
│  │  • pre_tool_use, post_tool_use, etc. (existing)              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ WebSocket
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (main.ts)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐    ┌─────────────────┐    ┌────────────────┐  │
│  │ handleEvent()   │    │ MetricsPanel    │    │ WorkshopScene  │  │
│  │                 │    │                 │    │                │  │
│  │ session_discov  │───▶│ Token display   │    │ Auto-create    │  │
│  │ → auto-create   │    │ Latency chart   │    │ zones for      │  │
│  │   zone          │    │ Error rates     │    │ discovered     │  │
│  │                 │    │                 │    │ sessions       │  │
│  └─────────────────┘    └─────────────────┘    └────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Integration Points

### 1. TmuxDiscovery → Server
- **Location:** `server/index.ts` line ~2370 (after health check setup)
- **How:** New polling interval calls `discoverClaudeSessions()`
- **Pattern:** Similar to existing `checkSessionHealth()` at line 951

### 2. Discovery Events → Client
- **Location:** `server/index.ts` broadcast logic
- **How:** New message type `{ type: 'session_discovered', session: {...} }`
- **Pattern:** Similar to existing `{ type: 'sessions', sessions: [...] }`

### 3. Auto-Zone Creation → Scene
- **Location:** `src/main.ts` `handleEvent()` function
- **How:** New case for `session_discovered` creates zone via `getOrCreateSession()`
- **Pattern:** Existing `session_start` handling at line 1883

### 4. Metrics Collection → Events
- **Location:** `server/index.ts` event processing
- **How:** Extract duration from `post_tool_use`, aggregate per session
- **Pattern:** Existing `toolDurations` map at line ~275

### 5. Hierarchy Lines → Scene
- **Location:** `src/scene/WorkshopScene.ts`
- **How:** Draw THREE.Line between parent zone and child zone
- **Pattern:** Similar to existing zone edge lines at line ~68

## API Contracts

### New Server Endpoints

```typescript
// GET /sessions/discover - Force discovery scan
GET /sessions/discover
Response: { discovered: string[], existing: string[] }

// GET /metrics/:sessionId - Get session metrics
GET /metrics/:sessionId
Response: {
  sessionId: string
  tokens: { input: number, output: number, total: number }
  latency: { avg: number, p95: number, p99: number }
  errorRate: number
  toolCounts: Record<string, number>
  duration: number // session duration in ms
}

// GET /metrics - Get all sessions metrics
GET /metrics
Response: { sessions: Record<string, MetricsData> }
```

### New WebSocket Messages

```typescript
// Server → Client
interface SessionDiscoveredMessage {
  type: 'session_discovered'
  session: {
    tmuxSession: string
    command: string  // e.g., "claude", "codex"
    cwd: string
    pid?: number
  }
}

interface MetricsUpdateMessage {
  type: 'metrics_update'
  sessionId: string
  metrics: MetricsData
}
```

### New Types (`shared/types.ts`)

```typescript
interface MetricsData {
  tokens: {
    input: number
    output: number
    total: number
    cost: number // USD estimate
  }
  latency: {
    avg: number
    p95: number
    p99: number
  }
  errorRate: number
  toolCounts: Record<string, number>
  duration: number
}

interface SessionDiscoveredEvent extends BaseEvent {
  type: 'session_discovered'
  tmuxSession: string
  command: string
  cwd: string
}
```

## Task Assignment Preview

### Claude Tasks (Sequential)
Core architecture and integration work requiring understanding of existing patterns:

- [ ] Create `TmuxDiscovery` module with session scanning logic
- [ ] Integrate discovery into server polling loop
- [ ] Add `session_discovered` event type and broadcasting
- [ ] Modify `handleEvent()` in main.ts for auto-zone creation
- [ ] Create `MetricsCollector` with aggregation logic
- [ ] Add metrics endpoints to server
- [ ] Create `AgentHierarchy` for parent-child tracking
- [ ] Add hierarchy visualization lines to WorkshopScene

### Codex Tasks (Parallel)
Well-defined, independent tasks that can run concurrently:

- [ ] Add `MetricsData` and `SessionDiscoveredEvent` types to `shared/types.ts`
- [ ] Create `MetricsPanel` UI component (display only, no logic)
- [ ] Add CSS styles for metrics panel in `src/styles/`
- [ ] Create unit tests for `TmuxDiscovery` module
- [ ] Create unit tests for `MetricsCollector` module
- [ ] Add metrics display to session tooltips
- [ ] Update CLAUDE.md documentation for new features

## Open Questions

1. **Token source:** Should we parse tokens from Claude's transcript output, or use a separate API call to Anthropic? (Transcript parsing is simpler but less accurate)

2. **Discovery scope:** Should we only discover Claude sessions, or also Codex/other AI agents? (Recommend: Claude + Codex for now)

3. **Metrics storage:** Should metrics persist to disk or only be in-memory? (Recommend: In-memory for MVP, persist later)

4. **Cost calculation:** Hard-code token prices or fetch from API? (Recommend: Hard-code with config override)

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Performance with many sessions | Entity pooling for zones, throttle discovery to 10s intervals |
| tmux not available on all systems | Graceful degradation - features work without discovery |
| False positive session detection | Check for "claude" or "codex" in command, verify with health ping |
| Stale discovered sessions | Health check marks offline, same as existing pattern |
| Token counting inaccuracy | Mark as "estimated" in UI, allow manual correction |

## Implementation Order

1. **Phase 1: Discovery** (MVP)
   - TmuxDiscovery module
   - session_discovered event
   - Auto-zone creation

2. **Phase 2: Metrics**
   - MetricsCollector
   - Metrics endpoints
   - MetricsPanel UI

3. **Phase 3: Hierarchy**
   - AgentHierarchy tracking
   - Visual connection lines
   - Orchestration pattern detection

---

Architecture complete. Run `./orchestrate.sh next` to proceed to planning.
