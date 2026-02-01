import type { MetricsData } from '../shared/types.js'

/**
 * Data recorded for each tool use
 */
export interface ToolUseData {
  tool: string
  duration: number
  success: boolean
  inputTokens?: number
  outputTokens?: number
}

/**
 * Per-session metrics state
 */
interface SessionMetrics {
  inputTokens: number
  outputTokens: number
  durations: number[]
  errorCount: number
  totalCount: number
  toolCounts: Record<string, number>
  startTime: number
}

// Pricing (per token)
const INPUT_TOKEN_PRICE = 3 / 1_000_000   // $3 per 1M input tokens
const OUTPUT_TOKEN_PRICE = 15 / 1_000_000 // $15 per 1M output tokens

/**
 * Calculate percentile of a sorted array
 */
function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const rank = Math.ceil((p / 100) * sorted.length)
  const index = Math.min(Math.max(rank - 1, 0), sorted.length - 1)
  return sorted[index]
}

/**
 * MetricsCollector aggregates metrics from tool use events per session
 */
export class MetricsCollector {
  private sessions = new Map<string, SessionMetrics>()

  /**
   * Record a tool use event for a session
   */
  recordToolUse(sessionId: string, data: ToolUseData): void {
    let session = this.sessions.get(sessionId)
    if (!session) {
      session = {
        inputTokens: 0,
        outputTokens: 0,
        durations: [],
        errorCount: 0,
        totalCount: 0,
        toolCounts: {},
        startTime: Date.now(),
      }
      this.sessions.set(sessionId, session)
    }

    // Track tokens
    if (data.inputTokens) {
      session.inputTokens += data.inputTokens
    }
    if (data.outputTokens) {
      session.outputTokens += data.outputTokens
    }

    // Track duration
    session.durations.push(data.duration)

    // Track errors
    session.totalCount++
    if (!data.success) {
      session.errorCount++
    }

    // Track tool counts
    session.toolCounts[data.tool] = (session.toolCounts[data.tool] || 0) + 1
  }

  /**
   * Get aggregated metrics for a session
   */
  getMetrics(sessionId: string): MetricsData {
    const session = this.sessions.get(sessionId)

    if (!session) {
      return {
        tokens: { input: 0, output: 0, total: 0, cost: 0 },
        latency: { avg: 0, p95: 0, p99: 0 },
        errorRate: 0,
        toolCounts: {},
        duration: 0,
      }
    }

    const totalTokens = session.inputTokens + session.outputTokens
    const cost =
      session.inputTokens * INPUT_TOKEN_PRICE +
      session.outputTokens * OUTPUT_TOKEN_PRICE

    // Calculate latency stats
    const durations = session.durations
    const avg =
      durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0

    // Calculate error rate (percentage)
    const errorRate =
      session.totalCount > 0
        ? (session.errorCount / session.totalCount) * 100
        : 0

    return {
      tokens: {
        input: session.inputTokens,
        output: session.outputTokens,
        total: totalTokens,
        cost,
      },
      latency: {
        avg,
        p95: percentile(durations, 95),
        p99: percentile(durations, 99),
      },
      errorRate,
      toolCounts: { ...session.toolCounts },
      duration: Date.now() - session.startTime,
    }
  }

  /**
   * Get metrics for all sessions
   */
  getAllMetrics(): Record<string, MetricsData> {
    const result: Record<string, MetricsData> = {}
    for (const sessionId of this.sessions.keys()) {
      result[sessionId] = this.getMetrics(sessionId)
    }
    return result
  }

  /**
   * Clear metrics for a session
   */
  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId)
  }

  /**
   * Clear all metrics
   */
  clearAll(): void {
    this.sessions.clear()
  }
}
