# Task 2.7 - Update Documentation

## Context
We have added new features to Vibecraft: auto-discovery of Claude sessions and metrics display. The CLAUDE.md documentation needs to be updated to reflect these changes.

## Objective
Update CLAUDE.md with documentation for the new auto-discovery and metrics features.

## Files to Modify
- `CLAUDE.md` - Project documentation

## Requirements

1. Add a new section under "## Recent Features Added" for:
   - **Auto-discovery**: Automatic detection of Claude/Codex tmux sessions
   - **Session metrics**: Token usage, latency, and error rate tracking
   - **Metrics panel**: Real-time metrics display in sidebar
   - **Agent hierarchy**: Visual lines connecting parent-child agents

2. Add to "## Key Files" section:
   - `server/TmuxDiscovery.ts` - Brief description
   - `server/MetricsCollector.ts` - Brief description
   - `src/ui/MetricsPanel.ts` - Brief description
   - `src/scene/AgentHierarchy.ts` - Brief description

3. Add new event types to "## Event Types" table:
   - `session_discovered` - When a new tmux session is found
   - `metrics_update` - Periodic metrics broadcast

4. Add new API endpoints to a new "## API Endpoints" section (or update if exists):
   - `GET /sessions/discover` - Force discovery scan
   - `GET /metrics` - All session metrics
   - `GET /metrics/:sessionId` - Single session metrics

5. Update "## Configuration" section with new env vars if any

6. Keep existing documentation style and formatting

## Acceptance Criteria
- [ ] New features documented in "Recent Features Added"
- [ ] New files documented in "Key Files"
- [ ] New event types in "Event Types" table
- [ ] New API endpoints documented
- [ ] Documentation follows existing style
- [ ] No broken markdown formatting
- [ ] Information is accurate and helpful

## Notes
- Read existing CLAUDE.md thoroughly first
- Match existing documentation style (tables, code blocks, etc.)
- Be concise but complete
- Include usage examples where helpful

## Related Files (for context, don't modify)
- `server/index.ts` - For accurate endpoint documentation
- `shared/types.ts` - For accurate type documentation

---

**Instructions for Codex:**
1. Read this entire task file
2. Read CLAUDE.md thoroughly to understand format
3. Add new documentation in appropriate sections
4. Maintain consistent style with existing content
5. Do NOT run git commands (sandbox restriction)
