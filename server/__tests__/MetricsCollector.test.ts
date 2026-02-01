import { MetricsCollector } from '../MetricsCollector.js'

type ToolUseData = {
  tool: string
  duration: number
  success: boolean
  inputTokens?: number
  outputTokens?: number
}

const INPUT_TOKEN_PRICE = 3 / 1_000_000
const OUTPUT_TOKEN_PRICE = 15 / 1_000_000

const percentile = (values: number[], p: number) => {
  if (values.length === 0) {
    return 0
  }

  const sorted = [...values].sort((a, b) => a - b)
  const rank = Math.ceil((p / 100) * sorted.length)
  const index = Math.min(Math.max(rank - 1, 0), sorted.length - 1)
  return sorted[index]
}

describe('MetricsCollector', () => {
  let collector: MetricsCollector

  const recordToolUse = (sessionId: string, overrides: Partial<ToolUseData> = {}) => {
    const data: ToolUseData = {
      tool: 'Read',
      duration: 100,
      success: true,
      ...overrides,
    }

    collector.recordToolUse(sessionId, data)
  }

  const recordDurations = (sessionId: string, durations: number[]) => {
    durations.forEach((duration) => {
      recordToolUse(sessionId, { duration })
    })
  }

  const expectEmptyMetrics = (metrics: ReturnType<MetricsCollector['getMetrics']>) => {
    expect(metrics.tokens).toEqual({ input: 0, output: 0, total: 0, cost: 0 })
    expect(metrics.latency).toEqual({ avg: 0, p95: 0, p99: 0 })
    expect(metrics.errorRate).toBe(0)
    expect(metrics.toolCounts).toEqual({})
    expect(metrics.duration).toBe(0)
  }

  beforeEach(() => {
    collector = new MetricsCollector()
  })

  describe('token tracking', () => {
    it('tracks input tokens correctly', () => {
      recordToolUse('session1', { inputTokens: 50, outputTokens: 0 })

      const metrics = collector.getMetrics('session1')
      expect(metrics.tokens.input).toBe(50)
    })

    it('tracks output tokens correctly', () => {
      recordToolUse('session1', { inputTokens: 0, outputTokens: 100 })

      const metrics = collector.getMetrics('session1')
      expect(metrics.tokens.output).toBe(100)
    })

    it('calculates total tokens', () => {
      recordToolUse('session1', { inputTokens: 10, outputTokens: 20 })
      recordToolUse('session1', { inputTokens: 5, outputTokens: 15 })

      const metrics = collector.getMetrics('session1')
      expect(metrics.tokens.total).toBe(50)
    })

    it('estimates cost based on token counts', () => {
      const inputTokens = 1000
      const outputTokens = 2000
      recordToolUse('session1', { inputTokens, outputTokens })

      const expectedCost = inputTokens * INPUT_TOKEN_PRICE + outputTokens * OUTPUT_TOKEN_PRICE
      const metrics = collector.getMetrics('session1')
      expect(metrics.tokens.cost).toBeCloseTo(expectedCost, 8)
    })
  })

  describe('latency tracking', () => {
    it('calculates average latency correctly', () => {
      recordDurations('session1', [100, 200, 300])

      const metrics = collector.getMetrics('session1')
      expect(metrics.latency.avg).toBe(200)
    })

    it('calculates P95 latency correctly', () => {
      const durations = Array.from({ length: 100 }, (_, index) => index + 1)
      recordDurations('session1', durations)

      const metrics = collector.getMetrics('session1')
      expect(metrics.latency.p95).toBe(percentile(durations, 95))
    })

    it('calculates P99 latency correctly', () => {
      const durations = Array.from({ length: 100 }, (_, index) => index + 1)
      recordDurations('session1', durations)

      const metrics = collector.getMetrics('session1')
      expect(metrics.latency.p99).toBe(percentile(durations, 99))
    })

    it('handles single event (avg = p95 = p99)', () => {
      recordDurations('session1', [250])

      const metrics = collector.getMetrics('session1')
      expect(metrics.latency.avg).toBe(250)
      expect(metrics.latency.p95).toBe(250)
      expect(metrics.latency.p99).toBe(250)
    })
  })

  describe('error rate', () => {
    it('calculates error rate correctly (errors / total)', () => {
      recordToolUse('session1', { success: true })
      recordToolUse('session1', { success: true })
      recordToolUse('session1', { success: true })
      recordToolUse('session1', { success: false })

      const metrics = collector.getMetrics('session1')
      expect(metrics.errorRate).toBe(25)
    })

    it('returns 0 when no errors', () => {
      recordToolUse('session1', { success: true })
      recordToolUse('session1', { success: true })

      const metrics = collector.getMetrics('session1')
      expect(metrics.errorRate).toBe(0)
    })

    it('returns 100 when all errors', () => {
      recordToolUse('session1', { success: false })
      recordToolUse('session1', { success: false })

      const metrics = collector.getMetrics('session1')
      expect(metrics.errorRate).toBe(100)
    })
  })

  describe('tool counting', () => {
    it('counts each tool type correctly', () => {
      recordToolUse('session1', { tool: 'Read' })
      recordToolUse('session1', { tool: 'Read' })
      recordToolUse('session1', { tool: 'Write' })

      const metrics = collector.getMetrics('session1')
      expect(metrics.toolCounts.Read).toBe(2)
      expect(metrics.toolCounts.Write).toBe(1)
    })

    it('handles multiple tool types', () => {
      recordToolUse('session1', { tool: 'Bash' })
      recordToolUse('session1', { tool: 'Grep' })
      recordToolUse('session1', { tool: 'WebSearch' })

      const metrics = collector.getMetrics('session1')
      expect(metrics.toolCounts.Bash).toBe(1)
      expect(metrics.toolCounts.Grep).toBe(1)
      expect(metrics.toolCounts.WebSearch).toBe(1)
    })
  })

  describe('aggregation', () => {
    it('returns empty metrics for unknown session', () => {
      const metrics = collector.getMetrics('missing-session')
      expectEmptyMetrics(metrics)
    })

    it('aggregates across multiple events', () => {
      recordToolUse('session1', {
        tool: 'Read',
        duration: 100,
        success: true,
        inputTokens: 10,
        outputTokens: 20,
      })
      recordToolUse('session1', {
        tool: 'Write',
        duration: 300,
        success: false,
        inputTokens: 5,
        outputTokens: 5,
      })

      const metrics = collector.getMetrics('session1')
      expect(metrics.tokens.input).toBe(15)
      expect(metrics.tokens.output).toBe(25)
      expect(metrics.tokens.total).toBe(40)
      expect(metrics.errorRate).toBe(50)
      expect(metrics.toolCounts).toEqual({ Read: 1, Write: 1 })
      expect(metrics.latency.avg).toBe(200)
      expect(metrics.latency.p95).toBe(300)
      expect(metrics.latency.p99).toBe(300)
    })

    it('handles concurrent sessions independently', () => {
      recordToolUse('session1', { tool: 'Read', inputTokens: 20, outputTokens: 10 })
      recordToolUse('session2', { tool: 'Write', inputTokens: 5, outputTokens: 15 })

      const metrics1 = collector.getMetrics('session1')
      const metrics2 = collector.getMetrics('session2')

      expect(metrics1.tokens.total).toBe(30)
      expect(metrics1.toolCounts).toEqual({ Read: 1 })

      expect(metrics2.tokens.total).toBe(20)
      expect(metrics2.toolCounts).toEqual({ Write: 1 })
    })
  })
})
