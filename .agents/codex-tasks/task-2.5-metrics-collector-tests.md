# Task 2.5 - Create MetricsCollector Unit Tests

## Context
We are creating a MetricsCollector module (Claude Task 2.8) that aggregates session metrics from events. This task creates unit tests for that module.

## Objective
Create unit tests for the MetricsCollector module to verify metrics aggregation logic.

## Files to Create
- `server/__tests__/MetricsCollector.test.ts` - Unit tests

## Requirements

1. Test the following scenarios:

**Token tracking tests:**
- Tracks input tokens correctly
- Tracks output tokens correctly
- Calculates total tokens
- Estimates cost based on token counts

**Latency tracking tests:**
- Calculates average latency correctly
- Calculates P95 latency correctly
- Calculates P99 latency correctly
- Handles single event (avg = p95 = p99)

**Error rate tests:**
- Calculates error rate correctly (errors / total)
- Returns 0 when no errors
- Returns 100 when all errors

**Tool counting tests:**
- Counts each tool type correctly
- Handles multiple tool types

**Aggregation tests:**
- Returns empty metrics for unknown session
- Aggregates across multiple events
- Handles concurrent sessions independently

2. Test structure:
```typescript
import { MetricsCollector } from '../MetricsCollector'

describe('MetricsCollector', () => {
  let collector: MetricsCollector

  beforeEach(() => {
    collector = new MetricsCollector()
  })

  describe('token tracking', () => {
    it('tracks input and output tokens', () => {
      collector.recordToolUse('session1', {
        tool: 'Read',
        duration: 100,
        success: true,
        inputTokens: 50,
        outputTokens: 100
      })

      const metrics = collector.getMetrics('session1')
      expect(metrics.tokens.input).toBe(50)
      expect(metrics.tokens.output).toBe(100)
    })
  })
})
```

3. Expected MetricsCollector interface:
```typescript
class MetricsCollector {
  recordToolUse(sessionId: string, data: {
    tool: string
    duration: number
    success: boolean
    inputTokens?: number
    outputTokens?: number
  }): void

  getMetrics(sessionId: string): MetricsData
  getAllMetrics(): Record<string, MetricsData>
}
```

## Acceptance Criteria
- [ ] Test file created at correct location
- [ ] All scenarios from requirements are covered
- [ ] Latency percentile calculations are correct
- [ ] Cost calculation test uses reasonable token prices
- [ ] Tests are isolated and deterministic
- [ ] Tests pass when run

## Notes
- Token prices for cost calculation: ~$3/1M input, ~$15/1M output (Claude 3.5 Sonnet pricing)
- P95 = 95th percentile, P99 = 99th percentile
- The module may not exist yet - write tests based on expected interface

## Related Files (for context, don't modify)
- `server/MetricsCollector.ts` - Module being tested (may not exist yet)
- `shared/types.ts` - MetricsData interface

---

**Instructions for Codex:**
1. Read this entire task file
2. Create comprehensive test coverage
3. Include edge cases for percentile calculations
4. Ensure tests would pass against a correct implementation
5. Do NOT run git commands (sandbox restriction)
