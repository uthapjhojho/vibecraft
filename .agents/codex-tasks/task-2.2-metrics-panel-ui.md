# Task 2.2 - Create MetricsPanel UI Component

## Context
We are upgrading Vibecraft to display real-time metrics for Claude sessions. This task creates the UI component that displays token usage, latency, and error rates.

## Objective
Create a `MetricsPanel` class that renders session metrics in a sidebar panel.

## Files to Create
- `src/ui/MetricsPanel.ts` - New UI component

## Requirements

1. Create `MetricsPanel` class with these methods:
```typescript
class MetricsPanel {
  constructor(container: HTMLElement)

  // Update displayed metrics for a session
  update(sessionId: string, metrics: MetricsData): void

  // Clear the panel (when no session selected)
  clear(): void

  // Show/hide the panel
  setVisible(visible: boolean): void
}
```

2. Display these metrics:
   - **Tokens**: Input / Output / Total with cost estimate
   - **Latency**: Average, P95, P99 in milliseconds
   - **Error Rate**: Percentage with visual indicator
   - **Duration**: Session uptime
   - **Tool Usage**: Bar chart or list of tool counts

3. Format numbers nicely:
   - Tokens: "12.5K" for thousands
   - Cost: "$0.02" with 2 decimal places
   - Latency: "234ms"
   - Duration: "5m 23s" or "1h 12m"

4. Use existing CSS variables from the project (check `src/styles/base.css`)

5. Export the class as default

## Acceptance Criteria
- [ ] Component creates necessary DOM elements
- [ ] `update()` correctly populates all metric fields
- [ ] `clear()` resets display to empty/placeholder state
- [ ] `setVisible()` shows/hides the panel
- [ ] Follows existing UI component patterns in `src/ui/`
- [ ] TypeScript compiles without errors
- [ ] No console errors when rendering

## Notes
- Look at `src/ui/FeedManager.ts` for UI component patterns
- The panel will be positioned by the parent (main.ts), just create content
- Use `document.createElement` for DOM construction
- Add data-testid attributes for testing

## Related Files (for context, don't modify)
- `src/ui/FeedManager.ts` - Example UI component pattern
- `shared/types.ts` - MetricsData interface (from Task 2.1)
- `src/styles/base.css` - CSS variables

---

**Instructions for Codex:**
1. Read this entire task file
2. Read `src/ui/FeedManager.ts` for patterns
3. Create the MetricsPanel component
4. Follow existing code style
5. Do NOT run git commands (sandbox restriction)
