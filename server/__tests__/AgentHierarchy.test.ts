import { AgentHierarchy } from '../AgentHierarchy.js'

describe('AgentHierarchy', () => {
  let hierarchy: AgentHierarchy

  beforeEach(() => {
    hierarchy = new AgentHierarchy()
  })

  describe('addRoot', () => {
    it('adds a root session', () => {
      hierarchy.addRoot('session-1')

      const node = hierarchy.getNode('session-1')
      expect(node).toBeDefined()
      expect(node?.parentId).toBeNull()
      expect(node?.sessionId).toBe('session-1')
    })

    it('does not duplicate root sessions', () => {
      hierarchy.addRoot('session-1')
      hierarchy.addRoot('session-1')

      const roots = hierarchy.getRoots()
      expect(roots).toHaveLength(1)
    })
  })

  describe('addChild', () => {
    it('adds a child to an existing parent', () => {
      hierarchy.addRoot('parent')
      hierarchy.addChild('parent', 'child', {
        toolUseId: 'tool-123',
        description: 'Explore codebase',
        subagentType: 'Explore',
      })

      const child = hierarchy.getNode('child')
      expect(child?.parentId).toBe('parent')
      expect(child?.toolUseId).toBe('tool-123')
      expect(child?.description).toBe('Explore codebase')
      expect(child?.subagentType).toBe('Explore')
    })

    it('creates parent as root if it does not exist', () => {
      hierarchy.addChild('parent', 'child', { toolUseId: 'tool-123' })

      expect(hierarchy.has('parent')).toBe(true)
      expect(hierarchy.getNode('parent')?.parentId).toBeNull()
    })

    it('records spawn timestamp', () => {
      const before = Date.now()
      hierarchy.addChild('parent', 'child', { toolUseId: 'tool-123' })
      const after = Date.now()

      const child = hierarchy.getNode('child')
      expect(child?.spawnedAt).toBeGreaterThanOrEqual(before)
      expect(child?.spawnedAt).toBeLessThanOrEqual(after)
    })
  })

  describe('markCompleted', () => {
    it('marks a session as completed', () => {
      hierarchy.addRoot('session-1')
      expect(hierarchy.getNode('session-1')?.completedAt).toBeNull()

      hierarchy.markCompleted('session-1')
      expect(hierarchy.getNode('session-1')?.completedAt).toBeDefined()
    })

    it('handles non-existent sessions gracefully', () => {
      expect(() => hierarchy.markCompleted('unknown')).not.toThrow()
    })
  })

  describe('getParent', () => {
    it('returns parent node', () => {
      hierarchy.addRoot('parent')
      hierarchy.addChild('parent', 'child', { toolUseId: 'tool-123' })

      const parent = hierarchy.getParent('child')
      expect(parent?.sessionId).toBe('parent')
    })

    it('returns undefined for root nodes', () => {
      hierarchy.addRoot('root')
      expect(hierarchy.getParent('root')).toBeUndefined()
    })
  })

  describe('getChildren', () => {
    it('returns all direct children', () => {
      hierarchy.addRoot('parent')
      hierarchy.addChild('parent', 'child-1', { toolUseId: 'tool-1' })
      hierarchy.addChild('parent', 'child-2', { toolUseId: 'tool-2' })

      const children = hierarchy.getChildren('parent')
      expect(children).toHaveLength(2)
      expect(children.map((c) => c.sessionId).sort()).toEqual(['child-1', 'child-2'])
    })

    it('returns empty array for leaf nodes', () => {
      hierarchy.addRoot('leaf')
      expect(hierarchy.getChildren('leaf')).toEqual([])
    })
  })

  describe('getAncestors', () => {
    it('returns ancestors in order (parent first)', () => {
      hierarchy.addRoot('grandparent')
      hierarchy.addChild('grandparent', 'parent', { toolUseId: 'tool-1' })
      hierarchy.addChild('parent', 'child', { toolUseId: 'tool-2' })

      const ancestors = hierarchy.getAncestors('child')
      expect(ancestors.map((a) => a.sessionId)).toEqual(['parent', 'grandparent'])
    })

    it('returns empty array for root', () => {
      hierarchy.addRoot('root')
      expect(hierarchy.getAncestors('root')).toEqual([])
    })
  })

  describe('getDescendants', () => {
    it('returns all descendants', () => {
      hierarchy.addRoot('root')
      hierarchy.addChild('root', 'child-1', { toolUseId: 'tool-1' })
      hierarchy.addChild('root', 'child-2', { toolUseId: 'tool-2' })
      hierarchy.addChild('child-1', 'grandchild', { toolUseId: 'tool-3' })

      const descendants = hierarchy.getDescendants('root')
      expect(descendants).toHaveLength(3)
      expect(descendants.map((d) => d.sessionId).sort()).toEqual([
        'child-1',
        'child-2',
        'grandchild',
      ])
    })
  })

  describe('getDepth', () => {
    it('returns 0 for root', () => {
      hierarchy.addRoot('root')
      expect(hierarchy.getDepth('root')).toBe(0)
    })

    it('returns correct depth for nested nodes', () => {
      hierarchy.addRoot('root')
      hierarchy.addChild('root', 'level-1', { toolUseId: 'tool-1' })
      hierarchy.addChild('level-1', 'level-2', { toolUseId: 'tool-2' })
      hierarchy.addChild('level-2', 'level-3', { toolUseId: 'tool-3' })

      expect(hierarchy.getDepth('level-1')).toBe(1)
      expect(hierarchy.getDepth('level-2')).toBe(2)
      expect(hierarchy.getDepth('level-3')).toBe(3)
    })
  })

  describe('getHierarchy', () => {
    it('returns serializable hierarchy data', () => {
      hierarchy.addRoot('root')
      hierarchy.addChild('root', 'child', { toolUseId: 'tool-1' })

      const data = hierarchy.getHierarchy()

      expect(data.roots).toEqual(['root'])
      expect(Object.keys(data.nodes)).toEqual(['root', 'child'])
      expect(data.nodes['child'].parentId).toBe('root')
    })
  })

  describe('remove', () => {
    it('removes a node and its descendants', () => {
      hierarchy.addRoot('root')
      hierarchy.addChild('root', 'child', { toolUseId: 'tool-1' })
      hierarchy.addChild('child', 'grandchild', { toolUseId: 'tool-2' })

      hierarchy.remove('child')

      expect(hierarchy.has('child')).toBe(false)
      expect(hierarchy.has('grandchild')).toBe(false)
      expect(hierarchy.has('root')).toBe(true)
    })

    it('updates parent children list', () => {
      hierarchy.addRoot('parent')
      hierarchy.addChild('parent', 'child', { toolUseId: 'tool-1' })

      hierarchy.remove('child')

      expect(hierarchy.getChildren('parent')).toEqual([])
    })
  })

  describe('clear', () => {
    it('removes all nodes', () => {
      hierarchy.addRoot('root')
      hierarchy.addChild('root', 'child', { toolUseId: 'tool-1' })

      hierarchy.clear()

      expect(hierarchy.getRoots()).toEqual([])
      expect(hierarchy.has('root')).toBe(false)
    })
  })
})
