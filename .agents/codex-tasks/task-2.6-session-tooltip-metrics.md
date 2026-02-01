# Task 2.6 - Add Metrics to Session Tooltips

## Context
Vibecraft shows session information in tooltips when hovering over session items in the sidebar. This task adds metrics (tokens, latency) to those tooltips.

## Objective
Update session tooltips to display key metrics alongside existing session info.

## Files to Modify
- `src/main.ts` - Update tooltip content generation

## Requirements

1. Find the tooltip generation code in `src/main.ts` (search for "tooltip" or "title" attribute)

2. Add metrics to the tooltip content:
```
Session: claude-main
Directory: /Users/dev/project
Status: working

--- Metrics ---
Tokens: 12.5K in / 8.2K out ($0.15)
Avg Latency: 234ms
Error Rate: 2.1%
```

3. Format metrics nicely:
   - Use "K" suffix for thousands (12500 -> "12.5K")
   - Show cost with 2 decimal places
   - Show latency in ms
   - Show error rate as percentage with 1 decimal

4. Handle missing metrics gracefully:
   - If no metrics available, show "No metrics yet"
   - Don't show metrics section for offline sessions

5. Create helper function for formatting:
```typescript
function formatMetricsForTooltip(metrics: MetricsData | null): string {
  if (!metrics) return 'No metrics yet'
  // Format and return string
}
```

## Acceptance Criteria
- [ ] Tooltips show metrics when available
- [ ] Metrics are formatted readably
- [ ] Missing metrics handled gracefully
- [ ] Offline sessions don't show metrics
- [ ] Tooltip doesn't get too long/unwieldy
- [ ] No TypeScript errors

## Notes
- Look for `createSessionItem` or similar function in main.ts
- The tooltip is likely set via `element.title = "..."`
- Metrics data comes from MetricsCollector (may need to access via global or pass through)
- Keep the helper function near the tooltip code or in a utils file

## Related Files (for context, don't modify)
- `shared/types.ts` - MetricsData interface
- `src/styles/sessions.css` - Session item styling

---

**Instructions for Codex:**
1. Read this entire task file
2. Read `src/main.ts` to find tooltip code
3. Add metrics formatting helper function
4. Update tooltip content generation
5. Do NOT run git commands (sandbox restriction)
