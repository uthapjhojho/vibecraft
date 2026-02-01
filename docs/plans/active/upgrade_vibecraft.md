# Plan: upgrade_vibecraft

## Overview

Upgrade Vibecraft to auto-discover Claude Code sessions and provide enhanced observability. The system will automatically detect running Claude instances via tmux scanning, create 3D zones for them, and display real-time metrics (tokens, latency, costs).

## Prerequisites
- [x] Architecture reviewed and approved
- [x] Branch created: `feature/upgrade_vibecraft`

---

## Phase 1: Foundation - Types & Discovery

### Task 1.1 [CLAUDE] - Create TmuxDiscovery Module
**Files:** `server/TmuxDiscovery.ts`
**Accept:** Module exports `discoverClaudeSessions()` that returns array of discovered sessions

- [ ] Create `server/TmuxDiscovery.ts`
- [ ] Implement `discoverClaudeSessions()` function
- [ ] Parse `tmux list-sessions` and `tmux list-panes` output
- [ ] Filter for sessions running "claude" or "codex" commands
- [ ] Extract cwd from pane info
- [ ] Return `DiscoveredSession[]` array
- [ ] Handle tmux not installed gracefully
- [ ] Verify: Run function manually, see discovered sessions

### Task 1.2 [CLAUDE] - Integrate Discovery into Server
**Files:** `server/index.ts`
**Accept:** Server polls for sessions every 10s, broadcasts `session_discovered` events

- [ ] Import TmuxDiscovery module
- [ ] Add `discoveredSessions: Map<string, DiscoveredSession>` state
- [ ] Create `pollDiscovery()` function (10s interval)
- [ ] Compare against existing sessions to find new ones
- [ ] Broadcast `session_discovered` WebSocket message for new sessions
- [ ] Add `/sessions/discover` endpoint for manual trigger
- [ ] Verify: Start server, see polling logs, receive WebSocket messages

### Task 1.3 [CLAUDE] - Handle session_discovered in Client
**Files:** `src/main.ts`, `src/events/EventClient.ts`
**Accept:** Client auto-creates zones when `session_discovered` arrives

- [ ] Add `session_discovered` case to `handleEvent()`
- [ ] Call `getOrCreateSession()` for discovered sessions
- [ ] Set initial status to "idle" for discovered sessions
- [ ] Update sidebar with discovered session
- [ ] Verify: Start Claude in tmux, see zone appear automatically

---

## :pause_button: HARD STOP - Phase 1 Complete
Human review required before parallel execution.

**Checklist:**
- [ ] TmuxDiscovery module works standalone
- [ ] Server discovers sessions on 10s interval
- [ ] Client creates zones for discovered sessions
- [ ] No breaking changes to existing hook-based flow

**:arrow_right: Codex tasks can now be dispatched: `./orchestrate.sh codex-dispatch`**

---

## Phase 2: Parallel Implementation

### Task 2.1 [CODEX] - Add Types to shared/types.ts
**Codex File:** `.agents/codex-tasks/task-2.1-add-types.md`
**Accept:** Types compile, no errors

### Task 2.2 [CODEX] - Create MetricsPanel UI Component
**Codex File:** `.agents/codex-tasks/task-2.2-metrics-panel-ui.md`
**Accept:** Component renders metrics data when passed props

### Task 2.3 [CODEX] - Add Metrics CSS Styles
**Codex File:** `.agents/codex-tasks/task-2.3-metrics-css.md`
**Accept:** Styles match existing design system

### Task 2.4 [CODEX] - Create TmuxDiscovery Unit Tests
**Codex File:** `.agents/codex-tasks/task-2.4-tmux-discovery-tests.md`
**Accept:** Tests pass, cover main scenarios

### Task 2.5 [CODEX] - Create MetricsCollector Unit Tests
**Codex File:** `.agents/codex-tasks/task-2.5-metrics-collector-tests.md`
**Accept:** Tests pass, cover aggregation logic

### Task 2.6 [CODEX] - Add Metrics to Session Tooltips
**Codex File:** `.agents/codex-tasks/task-2.6-session-tooltip-metrics.md`
**Accept:** Tooltips show token/latency when hovering sessions

### Task 2.7 [CODEX] - Update Documentation
**Codex File:** `.agents/codex-tasks/task-2.7-update-documentation.md`
**Accept:** CLAUDE.md includes new features section

---

### Task 2.8 [CLAUDE] - Create MetricsCollector Module
**Files:** `server/MetricsCollector.ts`
**Accept:** Module aggregates metrics from events

- [ ] Create `server/MetricsCollector.ts`
- [ ] Track per-session: token counts, tool durations, error counts
- [ ] Calculate latency percentiles (avg, p95, p99)
- [ ] Estimate cost based on token counts
- [ ] Export `getMetrics(sessionId)` and `getAllMetrics()` functions
- [ ] Verify: Process events, retrieve correct aggregated metrics

### Task 2.9 [CLAUDE] - Add Metrics Endpoints to Server
**Files:** `server/index.ts`
**Accept:** `/metrics` and `/metrics/:sessionId` return correct data

- [ ] Add `GET /metrics` endpoint (all sessions)
- [ ] Add `GET /metrics/:sessionId` endpoint (single session)
- [ ] Integrate MetricsCollector with event processing
- [ ] Broadcast `metrics_update` WebSocket messages periodically
- [ ] Verify: Call endpoints, see accurate metrics

---

## :pause_button: HARD STOP - Phase 2 Complete
Wait for both Claude and Codex to complete.

**Checklist:**
- [ ] All Claude tasks (2.8, 2.9) complete
- [ ] All Codex tasks (2.1-2.7) complete - run `./orchestrate.sh codex-complete`
- [ ] Mark Claude complete: `./orchestrate.sh claude-complete`

---

## Phase 3: Integration & Hierarchy

### Task 3.1 [CLAUDE] - Create AgentHierarchy Module
**Files:** `src/scene/AgentHierarchy.ts`
**Accept:** Module tracks parent-child relationships between sessions

- [ ] Create `src/scene/AgentHierarchy.ts`
- [ ] Track parent sessionId when Task tool spawns subagents
- [ ] Expose `getParent(sessionId)` and `getChildren(sessionId)`
- [ ] Update when subagents spawn/despawn
- [ ] Verify: Spawn subagent, hierarchy updated correctly

### Task 3.2 [CLAUDE] - Add Hierarchy Visualization to Scene
**Files:** `src/scene/WorkshopScene.ts`
**Accept:** Lines connect parent and child zones

- [ ] Import AgentHierarchy
- [ ] Create `updateHierarchyLines()` method
- [ ] Draw THREE.Line between parent zone center and child zone center
- [ ] Use dashed line style with color gradient
- [ ] Update lines when zones move or hierarchy changes
- [ ] Verify: Spawn subagent, see connecting line

### Task 3.3 [CLAUDE] - Integrate MetricsPanel into UI
**Files:** `src/main.ts`
**Accept:** Metrics panel shows in sidebar for active session

- [ ] Import MetricsPanel component
- [ ] Create panel instance in initialization
- [ ] Update panel when session changes or metrics_update received
- [ ] Position panel in sidebar below session list
- [ ] Verify: Select session, see live metrics updating

---

## :pause_button: HARD STOP - Phase 3 Complete
All implementation done. Ready for testing.

**Checklist:**
- [ ] Hierarchy tracking works
- [ ] Hierarchy lines render correctly
- [ ] MetricsPanel displays data
- [ ] All features work together

---

## Phase 4: Testing & Polish

### Task 4.1 [CLAUDE] - Integration Testing
**Accept:** All features work end-to-end

- [ ] Start Vibecraft server
- [ ] Start Claude in a tmux session manually
- [ ] Verify session auto-discovered and zone created
- [ ] Run some tools, verify metrics accumulating
- [ ] Spawn a Task subagent, verify hierarchy line appears
- [ ] Check MetricsPanel shows correct data
- [ ] Verify no console errors

### Task 4.2 [CLAUDE] - Edge Case Testing
**Accept:** Graceful handling of edge cases

- [ ] Test with tmux not installed
- [ ] Test with no Claude sessions running
- [ ] Test discovery while existing hook events arrive
- [ ] Test session going offline (tmux killed)
- [ ] Verify no crashes or UI glitches

---

## :pause_button: HARD STOP - Execution Complete
All implementation done. Ready for review.

**:arrow_right: Proceed to verify: `./orchestrate.sh verify`**

---

## Completion Checklist
- [ ] All tasks completed
- [ ] Tests passing (if applicable)
- [ ] No regressions to existing features
- [ ] CLAUDE.md documentation updated
- [ ] Code compiles without errors
