# Task 2.4 - Create TmuxDiscovery Unit Tests

## Context
We are creating a TmuxDiscovery module (Claude Task 1.1) that scans tmux for Claude sessions. This task creates unit tests for that module.

## Objective
Create unit tests for the TmuxDiscovery module to verify session scanning logic.

## Files to Create
- `server/__tests__/TmuxDiscovery.test.ts` - Unit tests

## Requirements

1. Test the following scenarios:

**Happy path tests:**
- Discovers a single Claude session
- Discovers multiple Claude sessions
- Discovers Codex sessions alongside Claude
- Extracts correct cwd from pane info
- Extracts correct PID

**Edge case tests:**
- Returns empty array when no sessions running
- Returns empty array when tmux not installed (graceful failure)
- Filters out non-Claude/Codex sessions
- Handles malformed tmux output gracefully
- Handles sessions with special characters in names

2. Mock the child_process exec function to simulate tmux output

3. Use existing test patterns from the project (if any exist)

4. Test structure:
```typescript
import { discoverClaudeSessions } from '../TmuxDiscovery'

// Mock child_process
jest.mock('child_process', () => ({
  exec: jest.fn()
}))

describe('TmuxDiscovery', () => {
  describe('discoverClaudeSessions', () => {
    it('discovers a Claude session', async () => {
      // Mock tmux output
      // Call function
      // Assert result
    })
  })
})
```

5. Sample tmux output to mock:
```
# tmux list-sessions -F "#{session_name}"
claude
dev
random

# tmux list-panes -t claude -F "#{pane_pid} #{pane_current_path} #{pane_current_command}"
12345 /Users/dev/project claude
```

## Acceptance Criteria
- [ ] Test file created at correct location
- [ ] All scenarios from requirements are covered
- [ ] Tests use mocking appropriately
- [ ] Tests are isolated (no real tmux calls)
- [ ] Tests pass when run with `npm test` or `jest`
- [ ] Good test descriptions that explain what's being tested

## Notes
- The TmuxDiscovery module may not exist yet - write tests based on expected interface
- Use `jest.fn()` for mocking
- Tests should be deterministic and not depend on system state
- If the project doesn't have a test setup, create a basic jest config

## Related Files (for context, don't modify)
- `server/TmuxDiscovery.ts` - Module being tested (may not exist yet)
- `package.json` - Check for existing test configuration

---

**Instructions for Codex:**
1. Read this entire task file
2. Check if test infrastructure exists (jest config, etc.)
3. Create test file with comprehensive test coverage
4. Ensure tests would pass against a correct implementation
5. Do NOT run git commands (sandbox restriction)
