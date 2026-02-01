# Task 2.3 - Add Metrics CSS Styles

## Context
We are creating a MetricsPanel UI component (Task 2.2) that needs CSS styles. This task creates the stylesheet for the metrics panel.

## Objective
Create CSS styles for the MetricsPanel that match the existing Vibecraft design system.

## Files to Create/Modify
- `src/styles/metrics.css` - New stylesheet for metrics panel
- `src/styles/index.css` - Add import for metrics.css

## Requirements

1. Create `src/styles/metrics.css` with styles for:
   - `.metrics-panel` - Main container
   - `.metrics-section` - Grouped metrics (tokens, latency, etc.)
   - `.metrics-row` - Individual metric row (label + value)
   - `.metrics-label` - Metric name/label
   - `.metrics-value` - Metric value display
   - `.metrics-cost` - Cost display (special styling)
   - `.metrics-bar` - Progress bar for tool usage
   - `.metrics-empty` - Empty state message

2. Use existing CSS variables from `base.css`:
   - `--bg-primary`, `--bg-secondary` for backgrounds
   - `--text-primary`, `--text-muted` for text
   - `--border-color` for borders
   - `--accent-*` colors for highlights

3. Design specs:
   - Panel width: 100% (fits in sidebar)
   - Padding: 12px
   - Section spacing: 16px between sections
   - Row spacing: 8px between rows
   - Font sizes: labels 12px, values 14px
   - Border radius: 8px for panel, 4px for bars

4. Add visual indicators:
   - Green tint for low error rate (<5%)
   - Yellow tint for medium error rate (5-15%)
   - Red tint for high error rate (>15%)

5. Add the import to `src/styles/index.css`

## Acceptance Criteria
- [ ] `metrics.css` file created with all required classes
- [ ] Import added to `index.css`
- [ ] Uses existing CSS variables (no hardcoded colors)
- [ ] Responsive within sidebar container
- [ ] Matches existing design aesthetic
- [ ] No CSS errors or warnings

## Notes
- Look at `src/styles/feed.css` and `src/styles/sessions.css` for patterns
- Keep styles scoped with `.metrics-` prefix
- Use flexbox for layout
- Consider dark theme (the app uses dark theme by default)

## Related Files (for context, don't modify except index.css)
- `src/styles/base.css` - CSS variables reference
- `src/styles/feed.css` - Style patterns reference
- `src/styles/sessions.css` - Style patterns reference

---

**Instructions for Codex:**
1. Read this entire task file
2. Read existing CSS files to understand patterns and variables
3. Create metrics.css with required styles
4. Add import to index.css
5. Do NOT run git commands (sandbox restriction)
