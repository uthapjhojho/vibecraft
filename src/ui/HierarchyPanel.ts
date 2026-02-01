/**
 * HierarchyPanel - Displays the agent hierarchy (parent-child relationships)
 */

import type { HierarchyData, AgentNode } from '../../shared/types'

const DEPTH_COLORS = ['#22d3ee', '#4ade80', '#a78bfa', '#fbbf24', '#60a5fa', '#fb923c']

export default class HierarchyPanel {
  private container: HTMLElement
  private root: HTMLElement
  private treeEl: HTMLElement
  private apiUrl: string

  constructor(container: HTMLElement, apiUrl: string) {
    this.container = container
    this.apiUrl = apiUrl

    this.root = document.createElement('div')
    this.root.className = 'hierarchy-panel'
    this.root.dataset.testid = 'hierarchy-panel'

    const header = this.createHeader()
    this.root.appendChild(header)

    this.treeEl = document.createElement('div')
    this.treeEl.className = 'hierarchy-tree'
    this.treeEl.dataset.testid = 'hierarchy-tree'
    this.root.appendChild(this.treeEl)

    this.container.replaceChildren(this.root)
    this.showEmpty()
  }

  /**
   * Fetch and render the current hierarchy
   */
  async refresh(): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/hierarchy`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      if (data.ok && data.hierarchy) {
        this.render(data.hierarchy as HierarchyData)
      } else {
        this.showEmpty()
      }
    } catch (error) {
      console.error('Failed to fetch hierarchy:', error)
      this.showEmpty()
    }
  }

  /**
   * Render the hierarchy tree
   */
  render(hierarchy: HierarchyData): void {
    this.treeEl.replaceChildren()

    if (hierarchy.roots.length === 0) {
      this.showEmpty()
      return
    }

    // Build tree for each root
    for (const rootId of hierarchy.roots) {
      const rootNode = hierarchy.nodes[rootId]
      if (rootNode) {
        const nodeEl = this.renderNode(rootNode, hierarchy.nodes, 0)
        this.treeEl.appendChild(nodeEl)
      }
    }
  }

  /**
   * Render a single node and its children recursively
   */
  private renderNode(
    node: AgentNode,
    allNodes: Record<string, AgentNode>,
    depth: number
  ): HTMLElement {
    const nodeEl = document.createElement('div')
    nodeEl.className = 'hierarchy-node'
    nodeEl.dataset.testid = 'hierarchy-node'
    nodeEl.dataset.sessionId = node.sessionId
    nodeEl.dataset.depth = String(depth)

    // Node content
    const content = document.createElement('div')
    content.className = 'hierarchy-node-content'
    content.style.paddingLeft = `${depth * 16}px`

    // Indicator dot
    const dot = document.createElement('span')
    dot.className = 'hierarchy-dot'
    dot.style.background = DEPTH_COLORS[depth % DEPTH_COLORS.length]
    if (node.completedAt) {
      dot.classList.add('completed')
    }
    content.appendChild(dot)

    // Session ID (shortened)
    const label = document.createElement('span')
    label.className = 'hierarchy-label'
    label.textContent = node.sessionId.slice(0, 8)
    label.title = node.sessionId
    content.appendChild(label)

    // Subagent type badge
    if (node.subagentType) {
      const badge = document.createElement('span')
      badge.className = 'hierarchy-badge'
      badge.textContent = node.subagentType
      content.appendChild(badge)
    }

    // Status indicator
    if (node.completedAt) {
      const status = document.createElement('span')
      status.className = 'hierarchy-status completed'
      status.textContent = 'done'
      content.appendChild(status)
    }

    nodeEl.appendChild(content)

    // Find and render children
    const children = Object.values(allNodes).filter(n => n.parentId === node.sessionId)
    if (children.length > 0) {
      const childrenContainer = document.createElement('div')
      childrenContainer.className = 'hierarchy-children'
      for (const child of children) {
        const childEl = this.renderNode(child, allNodes, depth + 1)
        childrenContainer.appendChild(childEl)
      }
      nodeEl.appendChild(childrenContainer)
    }

    return nodeEl
  }

  private showEmpty(): void {
    this.treeEl.replaceChildren()
    const empty = document.createElement('div')
    empty.className = 'hierarchy-empty'
    empty.dataset.testid = 'hierarchy-empty'
    empty.textContent = 'No agents running'
    this.treeEl.appendChild(empty)
  }

  private createHeader(): HTMLElement {
    const header = document.createElement('div')
    header.className = 'hierarchy-panel-header'
    header.dataset.testid = 'hierarchy-panel-header'

    const title = document.createElement('div')
    title.className = 'hierarchy-panel-title'
    title.textContent = 'Agent Hierarchy'
    title.dataset.testid = 'hierarchy-panel-title'

    const refreshBtn = document.createElement('button')
    refreshBtn.className = 'hierarchy-refresh-btn'
    refreshBtn.textContent = '↻'
    refreshBtn.title = 'Refresh hierarchy'
    refreshBtn.onclick = () => this.refresh()

    header.appendChild(title)
    header.appendChild(refreshBtn)

    return header
  }

  /**
   * Show/hide the panel
   */
  setVisible(visible: boolean): void {
    this.root.style.display = visible ? '' : 'none'
  }
}
