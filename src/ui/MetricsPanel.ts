/**
 * MetricsPanel - Displays real-time session metrics in a sidebar panel
 */

import type { MetricsData } from '../../shared/types'

const EMPTY_VALUE = '--'
const TOOL_COLORS = ['#22d3ee', '#4ade80', '#a78bfa', '#fbbf24', '#60a5fa', '#fb923c']

export default class MetricsPanel {
  private container: HTMLElement
  private root: HTMLElement
  private sessionEl!: HTMLElement

  private tokensInputEl!: HTMLElement
  private tokensOutputEl!: HTMLElement
  private tokensTotalEl!: HTMLElement
  private tokensCostEl!: HTMLElement

  private latencyAvgEl!: HTMLElement
  private latencyP95El!: HTMLElement
  private latencyP99El!: HTMLElement

  private errorRateEl!: HTMLElement
  private errorIndicatorEl!: HTMLElement

  private durationEl!: HTMLElement
  private toolListEl!: HTMLElement

  private activeSessionId: string | null = null

  constructor(container: HTMLElement) {
    this.container = container

    this.root = document.createElement('div')
    this.root.className = 'metrics-panel'
    this.root.dataset.testid = 'metrics-panel'

    const header = this.createHeader()
    this.root.appendChild(header)

    const tokensSection = this.createSection('Tokens', 'metrics-section-tokens')
    this.tokensInputEl = this.addRow(tokensSection.body, 'Input', 'metrics-tokens-input')
    this.tokensOutputEl = this.addRow(tokensSection.body, 'Output', 'metrics-tokens-output')
    this.tokensTotalEl = this.addRow(tokensSection.body, 'Total', 'metrics-tokens-total')
    this.tokensCostEl = this.addRow(tokensSection.body, 'Cost', 'metrics-tokens-cost')
    this.root.appendChild(tokensSection.section)

    const latencySection = this.createSection('Latency', 'metrics-section-latency')
    this.latencyAvgEl = this.addRow(latencySection.body, 'Avg', 'metrics-latency-avg')
    this.latencyP95El = this.addRow(latencySection.body, 'P95', 'metrics-latency-p95')
    this.latencyP99El = this.addRow(latencySection.body, 'P99', 'metrics-latency-p99')
    this.root.appendChild(latencySection.section)

    const errorSection = this.createSection('Error Rate', 'metrics-section-error')
    const errorRow = document.createElement('div')
    errorRow.className = 'metrics-row metrics-row-error'

    const errorLabel = document.createElement('span')
    errorLabel.className = 'metrics-label'
    errorLabel.textContent = 'Errors'

    this.errorRateEl = document.createElement('span')
    this.errorRateEl.className = 'metrics-value'
    this.errorRateEl.dataset.testid = 'metrics-error-rate'

    const errorBar = document.createElement('div')
    errorBar.className = 'metrics-error-bar'
    errorBar.dataset.testid = 'metrics-error-bar'

    this.errorIndicatorEl = document.createElement('div')
    this.errorIndicatorEl.className = 'metrics-error-fill'
    this.errorIndicatorEl.dataset.testid = 'metrics-error-indicator'
    this.errorIndicatorEl.style.background = 'var(--color, rgba(255, 255, 255, 0.2))'

    errorBar.appendChild(this.errorIndicatorEl)
    errorRow.appendChild(errorLabel)
    errorRow.appendChild(this.errorRateEl)
    errorRow.appendChild(errorBar)
    errorSection.body.appendChild(errorRow)
    this.root.appendChild(errorSection.section)

    const durationSection = this.createSection('Duration', 'metrics-section-duration')
    this.durationEl = this.addRow(durationSection.body, 'Uptime', 'metrics-duration')
    this.root.appendChild(durationSection.section)

    const toolSection = this.createSection('Tool Usage', 'metrics-section-tools')
    this.toolListEl = document.createElement('div')
    this.toolListEl.className = 'metrics-tool-list'
    this.toolListEl.dataset.testid = 'metrics-tools-list'
    toolSection.body.appendChild(this.toolListEl)
    this.root.appendChild(toolSection.section)

    this.container.replaceChildren(this.root)
    this.clear()
  }

  /**
   * Update displayed metrics for a session
   */
  update(sessionId: string, metrics: MetricsData): void {
    this.activeSessionId = sessionId
    this.sessionEl.textContent = sessionId ? `Session: ${sessionId}` : 'No session selected'
    this.root.dataset.sessionId = sessionId

    this.tokensInputEl.textContent = formatCompactNumber(metrics.tokens.input)
    this.tokensOutputEl.textContent = formatCompactNumber(metrics.tokens.output)
    this.tokensTotalEl.textContent = formatCompactNumber(metrics.tokens.total)
    this.tokensCostEl.textContent = formatCost(metrics.tokens.cost)

    this.latencyAvgEl.textContent = formatLatency(metrics.latency.avg)
    this.latencyP95El.textContent = formatLatency(metrics.latency.p95)
    this.latencyP99El.textContent = formatLatency(metrics.latency.p99)

    const { display, percent } = formatPercent(metrics.errorRate)
    this.errorRateEl.textContent = display
    this.updateErrorIndicator(percent)

    this.durationEl.textContent = formatDuration(metrics.duration)
    this.renderToolUsage(metrics.toolCounts)
  }

  /**
   * Clear the panel (when no session selected)
   */
  clear(): void {
    this.activeSessionId = null
    this.sessionEl.textContent = 'No session selected'
    this.root.dataset.sessionId = ''

    this.tokensInputEl.textContent = EMPTY_VALUE
    this.tokensOutputEl.textContent = EMPTY_VALUE
    this.tokensTotalEl.textContent = EMPTY_VALUE
    this.tokensCostEl.textContent = EMPTY_VALUE

    this.latencyAvgEl.textContent = EMPTY_VALUE
    this.latencyP95El.textContent = EMPTY_VALUE
    this.latencyP99El.textContent = EMPTY_VALUE

    this.errorRateEl.textContent = EMPTY_VALUE
    this.updateErrorIndicator(0)

    this.durationEl.textContent = EMPTY_VALUE
    this.renderToolUsage({})
  }

  /**
   * Show/hide the panel
   */
  setVisible(visible: boolean): void {
    this.root.style.display = visible ? '' : 'none'
  }

  private createHeader(): HTMLElement {
    const header = document.createElement('div')
    header.className = 'metrics-panel-header'
    header.dataset.testid = 'metrics-panel-header'

    const title = document.createElement('div')
    title.className = 'metrics-panel-title'
    title.textContent = 'Session Metrics'
    title.dataset.testid = 'metrics-panel-title'

    this.sessionEl = document.createElement('div')
    this.sessionEl.className = 'metrics-panel-session'
    this.sessionEl.dataset.testid = 'metrics-panel-session'

    header.appendChild(title)
    header.appendChild(this.sessionEl)

    return header
  }

  private createSection(title: string, testId: string): { section: HTMLElement; body: HTMLElement } {
    const section = document.createElement('div')
    section.className = 'metrics-section'
    section.dataset.testid = testId

    const heading = document.createElement('div')
    heading.className = 'metrics-section-title'
    heading.textContent = title

    const body = document.createElement('div')
    body.className = 'metrics-section-body'

    section.appendChild(heading)
    section.appendChild(body)

    return { section, body }
  }

  private addRow(container: HTMLElement, label: string, testId: string): HTMLElement {
    const row = document.createElement('div')
    row.className = 'metrics-row'

    const labelEl = document.createElement('span')
    labelEl.className = 'metrics-label'
    labelEl.textContent = label

    const valueEl = document.createElement('span')
    valueEl.className = 'metrics-value'
    valueEl.dataset.testid = testId

    row.appendChild(labelEl)
    row.appendChild(valueEl)
    container.appendChild(row)

    return valueEl
  }

  private updateErrorIndicator(percent: number): void {
    const clamped = Math.max(0, Math.min(100, percent))
    this.errorIndicatorEl.style.width = `${clamped}%`
    const color = getErrorColor(clamped)
    this.errorIndicatorEl.style.setProperty('--color', color)
  }

  private renderToolUsage(toolCounts: Record<string, number>): void {
    this.toolListEl.replaceChildren()

    const entries = Object.entries(toolCounts).filter(([, count]) => count > 0)
    if (entries.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'metrics-empty'
      empty.dataset.testid = 'metrics-tools-empty'
      empty.textContent = 'No tool usage'
      this.toolListEl.appendChild(empty)
      return
    }

    entries.sort((a, b) => b[1] - a[1])
    const maxCount = Math.max(...entries.map(([, count]) => count))

    entries.forEach(([tool, count], index) => {
      const row = document.createElement('div')
      row.className = 'metrics-tool-row'
      row.dataset.testid = 'metrics-tool-item'
      row.dataset.tool = tool

      const label = document.createElement('div')
      label.className = 'metrics-tool-label'
      label.textContent = tool

      const value = document.createElement('div')
      value.className = 'metrics-tool-count'
      value.dataset.testid = 'metrics-tool-count'
      value.textContent = formatCompactNumber(count)

      const bar = document.createElement('div')
      bar.className = 'metrics-tool-bar'

      const fill = document.createElement('div')
      fill.className = 'metrics-tool-bar-fill'
      fill.dataset.testid = 'metrics-tool-bar-fill'

      const percent = maxCount > 0 ? (count / maxCount) * 100 : 0
      const safePercent = Math.max(4, percent)
      fill.style.width = `${safePercent}%`
      fill.style.background = 'var(--color, rgba(255, 255, 255, 0.2))'
      fill.style.setProperty('--color', TOOL_COLORS[index % TOOL_COLORS.length])

      bar.appendChild(fill)
      row.appendChild(label)
      row.appendChild(value)
      row.appendChild(bar)
      this.toolListEl.appendChild(row)
    })
  }
}

function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value)) return EMPTY_VALUE
  const abs = Math.abs(value)

  if (abs >= 1_000_000) {
    return `${formatOneDecimal(value / 1_000_000)}M`
  }

  if (abs >= 1_000) {
    return `${formatOneDecimal(value / 1_000)}K`
  }

  return Math.round(value).toString()
}

function formatOneDecimal(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)
}

function formatCost(cost: number): string {
  if (!Number.isFinite(cost)) return EMPTY_VALUE
  return `$${cost.toFixed(2)}`
}

function formatLatency(value: number): string {
  if (!Number.isFinite(value)) return EMPTY_VALUE
  return `${Math.round(value)}ms`
}

function formatDuration(ms: number): string {
  if (!Number.isFinite(ms)) return EMPTY_VALUE
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

function formatPercent(value: number): { display: string; percent: number } {
  if (!Number.isFinite(value)) return { display: EMPTY_VALUE, percent: 0 }
  const percent = value <= 1 ? value * 100 : value
  const display = formatPercentDisplay(percent)
  return {
    display,
    percent: Math.max(0, Math.min(100, percent)),
  }
}

function formatPercentDisplay(percent: number): string {
  const decimals = percent < 10 ? 1 : 0
  const fixed = percent.toFixed(decimals)
  return `${fixed.replace(/\.0+$/, '')}%`
}

function getErrorColor(percent: number): string {
  if (percent <= 1) return '#4ade80'
  if (percent <= 5) return '#fbbf24'
  if (percent <= 10) return '#fb923c'
  return '#ef4444'
}
