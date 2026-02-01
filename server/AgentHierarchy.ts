/**
 * AgentHierarchy - Tracks parent-child relationships between Claude sessions
 *
 * When a session spawns a subagent via the Task tool, this module records
 * the relationship so we can visualize the hierarchy in the UI.
 */

import type { AgentNode, HierarchyData } from '../shared/types.js'

export type { AgentNode, HierarchyData }

/**
 * AgentHierarchy tracks the tree structure of spawned subagents
 */
export class AgentHierarchy {
  private nodes = new Map<string, AgentNode>()
  private childrenMap = new Map<string, Set<string>>() // parentId -> Set<childId>

  /**
   * Register a session as a root (no parent)
   */
  addRoot(sessionId: string): void {
    if (this.nodes.has(sessionId)) return

    this.nodes.set(sessionId, {
      sessionId,
      parentId: null,
      toolUseId: null,
      description: null,
      subagentType: null,
      spawnedAt: Date.now(),
      completedAt: null,
    })
  }

  /**
   * Record a subagent spawn (parent creates child)
   */
  addChild(
    parentId: string,
    childId: string,
    options: {
      toolUseId: string
      description?: string
      subagentType?: string
    }
  ): void {
    // Ensure parent exists
    if (!this.nodes.has(parentId)) {
      this.addRoot(parentId)
    }

    // Add child node
    this.nodes.set(childId, {
      sessionId: childId,
      parentId,
      toolUseId: options.toolUseId,
      description: options.description ?? null,
      subagentType: options.subagentType ?? null,
      spawnedAt: Date.now(),
      completedAt: null,
    })

    // Track in children map
    if (!this.childrenMap.has(parentId)) {
      this.childrenMap.set(parentId, new Set())
    }
    this.childrenMap.get(parentId)!.add(childId)
  }

  /**
   * Mark a session as completed
   */
  markCompleted(sessionId: string): void {
    const node = this.nodes.get(sessionId)
    if (node) {
      node.completedAt = Date.now()
    }
  }

  /**
   * Get a session's node data
   */
  getNode(sessionId: string): AgentNode | undefined {
    return this.nodes.get(sessionId)
  }

  /**
   * Get the parent of a session
   */
  getParent(sessionId: string): AgentNode | undefined {
    const node = this.nodes.get(sessionId)
    if (!node?.parentId) return undefined
    return this.nodes.get(node.parentId)
  }

  /**
   * Get all children of a session
   */
  getChildren(sessionId: string): AgentNode[] {
    const childIds = this.childrenMap.get(sessionId)
    if (!childIds) return []
    return [...childIds]
      .map((id) => this.nodes.get(id))
      .filter((n): n is AgentNode => n !== undefined)
  }

  /**
   * Get all ancestors (parent, grandparent, etc.) up to root
   */
  getAncestors(sessionId: string): AgentNode[] {
    const ancestors: AgentNode[] = []
    let current = this.nodes.get(sessionId)

    while (current?.parentId) {
      const parent = this.nodes.get(current.parentId)
      if (!parent) break
      ancestors.push(parent)
      current = parent
    }

    return ancestors
  }

  /**
   * Get all descendants (children, grandchildren, etc.)
   */
  getDescendants(sessionId: string): AgentNode[] {
    const descendants: AgentNode[] = []
    const queue = [...this.getChildren(sessionId)]

    while (queue.length > 0) {
      const node = queue.shift()!
      descendants.push(node)
      queue.push(...this.getChildren(node.sessionId))
    }

    return descendants
  }

  /**
   * Get all root sessions (no parent)
   */
  getRoots(): AgentNode[] {
    return [...this.nodes.values()].filter((n) => n.parentId === null)
  }

  /**
   * Get the depth of a session in the hierarchy (root = 0)
   */
  getDepth(sessionId: string): number {
    return this.getAncestors(sessionId).length
  }

  /**
   * Get the full hierarchy data for serialization
   */
  getHierarchy(): HierarchyData {
    const nodes: Record<string, AgentNode> = {}
    for (const [id, node] of this.nodes) {
      nodes[id] = { ...node }
    }

    const roots = this.getRoots().map((n) => n.sessionId)

    return { nodes, roots }
  }

  /**
   * Check if a session exists in the hierarchy
   */
  has(sessionId: string): boolean {
    return this.nodes.has(sessionId)
  }

  /**
   * Remove a session and its descendants from the hierarchy
   */
  remove(sessionId: string): void {
    // Remove all descendants first
    const descendants = this.getDescendants(sessionId)
    for (const descendant of descendants) {
      this.nodes.delete(descendant.sessionId)
      this.childrenMap.delete(descendant.sessionId)
    }

    // Remove from parent's children set
    const node = this.nodes.get(sessionId)
    if (node?.parentId) {
      const siblings = this.childrenMap.get(node.parentId)
      siblings?.delete(sessionId)
    }

    // Remove the node itself
    this.nodes.delete(sessionId)
    this.childrenMap.delete(sessionId)
  }

  /**
   * Clear all hierarchy data
   */
  clear(): void {
    this.nodes.clear()
    this.childrenMap.clear()
  }
}
