# Task 2.1 - Add Types to shared/types.ts

## Context
We are upgrading Vibecraft to auto-discover Claude sessions and display metrics. This task adds the TypeScript type definitions needed by other components.

## Objective
Add `MetricsData`, `SessionDiscoveredEvent`, and related types to `shared/types.ts`.

## Files to Modify
- `shared/types.ts` - Add new interfaces and event types

## Requirements

1. Add `MetricsData` interface:
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
  duration: number // session duration in ms
}
```

2. Add `SessionDiscoveredEvent` interface:
```typescript
interface SessionDiscoveredEvent extends BaseEvent {
  type: 'session_discovered'
  tmuxSession: string
  command: string
  cwd: string
  pid?: number
}
```

3. Add `DiscoveredSession` interface:
```typescript
interface DiscoveredSession {
  tmuxSession: string
  command: string
  cwd: string
  pid?: number
  discoveredAt: number // timestamp
}
```

4. Add new WebSocket message types:
```typescript
interface SessionDiscoveredMessage {
  type: 'session_discovered'
  session: DiscoveredSession
}

interface MetricsUpdateMessage {
  type: 'metrics_update'
  sessionId: string
  metrics: MetricsData
}
```

5. Update the `ClaudeEvent` union type to include `SessionDiscoveredEvent`

6. Update the `ServerMessage` union type to include the new message types

## Acceptance Criteria
- [ ] All new interfaces are exported
- [ ] Types compile without errors (`npm run build:server` and `npm run build:client`)
- [ ] No breaking changes to existing types
- [ ] Types follow existing naming conventions in the file
- [ ] All tests pass

## Notes
- Look at existing event types like `PreToolUseEvent` for pattern reference
- The `BaseEvent` interface already exists - extend it
- Keep types in the same style as existing code (semicolons, etc.)

## Related Files (for context, don't modify)
- `server/index.ts` - Will use these types for WebSocket messages
- `src/main.ts` - Will handle SessionDiscoveredEvent

---

**Instructions for Codex:**
1. Read this entire task file
2. Read `shared/types.ts` to understand existing patterns
3. Add the new types following existing conventions
4. Ensure TypeScript compilation succeeds
5. Do NOT run git commands (sandbox restriction)
