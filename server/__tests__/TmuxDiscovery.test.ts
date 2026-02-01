import { discoverClaudeSessions } from '../TmuxDiscovery'
import { exec } from 'child_process'
import type { ExecException } from 'child_process'

jest.mock('child_process', () => ({
  exec: jest.fn(),
}))

const execMock = exec as jest.MockedFunction<typeof exec>

type TmuxMockOptions = {
  sessions?: string[]
  panes?: Record<string, string>
  listSessionsError?: ExecException | null
  listPanesErrors?: Record<string, ExecException | null>
}

function createExecError(message: string, code?: string): ExecException {
  const error = new Error(message) as ExecException
  if (code) {
    error.code = code
  }
  return error
}

function matchSession(command: string, sessions: string[]): string | undefined {
  return sessions.find((session) => {
    return (
      command.includes(`-t ${session} `) ||
      command.endsWith(`-t ${session}`) ||
      command.includes(`-t "${session}"`) ||
      command.includes(`-t '${session}'`)
    )
  })
}

function mockTmuxExec(options: TmuxMockOptions = {}): void {
  const {
    sessions = [],
    panes = {},
    listSessionsError = null,
    listPanesErrors = {},
  } = options

  execMock.mockImplementation(((command, optionsOrCallback, callbackMaybe) => {
    const callback = typeof optionsOrCallback === 'function' ? optionsOrCallback : callbackMaybe
    let stdout = ''
    let error: ExecException | null = null

    if (command.includes('tmux list-sessions')) {
      error = listSessionsError
      if (!error) {
        stdout = sessions.length ? `${sessions.join('\n')}\n` : ''
      }
    } else if (command.includes('tmux list-panes')) {
      const session = matchSession(command, Object.keys(panes))
      if (session) {
        error = listPanesErrors[session] ?? null
        if (!error) {
          stdout = panes[session] ? `${panes[session]}\n` : ''
        }
      }
    }

    if (callback) {
      process.nextTick(() => callback(error, stdout, ''))
    }

    return { pid: 1 } as unknown
  }) as typeof exec)
}

describe('TmuxDiscovery', () => {
  describe('discoverClaudeSessions', () => {
    beforeEach(() => {
      execMock.mockReset()
    })

    it('discovers a Claude session', async () => {
      mockTmuxExec({
        sessions: ['claude'],
        panes: {
          claude: '12345 /Users/dev/project claude',
        },
      })

      const result = await discoverClaudeSessions()

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(
        expect.objectContaining({
          tmuxSession: 'claude',
          command: 'claude',
        })
      )
      expect(result[0].discoveredAt).toEqual(expect.any(Number))
    })

    it('discovers multiple Claude sessions', async () => {
      mockTmuxExec({
        sessions: ['claude', 'claude-dev'],
        panes: {
          claude: '11111 /Users/dev/project-a claude',
          'claude-dev': '22222 /Users/dev/project-b claude',
        },
      })

      const result = await discoverClaudeSessions()

      expect(result.map((session) => session.tmuxSession).sort()).toEqual(['claude', 'claude-dev'])
    })

    it('discovers Codex sessions alongside Claude', async () => {
      mockTmuxExec({
        sessions: ['claude', 'codex', 'dev'],
        panes: {
          claude: '11111 /Users/dev/project-a claude',
          codex: '22222 /Users/dev/project-b codex',
          dev: '33333 /Users/dev/project-c zsh',
        },
      })

      const result = await discoverClaudeSessions()

      const commands = result.map((session) => session.command).sort()
      expect(commands).toEqual(['claude', 'codex'])
    })

    it('extracts correct cwd from pane info', async () => {
      mockTmuxExec({
        sessions: ['claude'],
        panes: {
          claude: '44444 /Users/dev/awesome-project claude',
        },
      })

      const [session] = await discoverClaudeSessions()

      expect(session.cwd).toBe('/Users/dev/awesome-project')
    })

    it('extracts correct PID', async () => {
      mockTmuxExec({
        sessions: ['claude'],
        panes: {
          claude: '98765 /Users/dev/project claude',
        },
      })

      const [session] = await discoverClaudeSessions()

      expect(session.pid).toBe(98765)
    })

    it('returns empty array when no sessions running', async () => {
      mockTmuxExec({
        sessions: [],
      })

      const result = await discoverClaudeSessions()

      expect(result).toEqual([])
    })

    it('returns empty array when tmux not installed (graceful failure)', async () => {
      mockTmuxExec({
        listSessionsError: createExecError('spawn tmux ENOENT', 'ENOENT'),
      })

      const result = await discoverClaudeSessions()

      expect(result).toEqual([])
    })

    it('filters out non-Claude/Codex sessions', async () => {
      mockTmuxExec({
        sessions: ['claude', 'dev', 'random'],
        panes: {
          claude: '11111 /Users/dev/project claude',
          dev: '22222 /Users/dev/other zsh',
          random: '33333 /Users/dev/random node',
        },
      })

      const result = await discoverClaudeSessions()

      expect(result).toHaveLength(1)
      expect(result[0].tmuxSession).toBe('claude')
    })

    it('handles malformed tmux output gracefully', async () => {
      mockTmuxExec({
        sessions: ['claude'],
        panes: {
          claude: 'not-a-valid-line',
        },
      })

      const result = await discoverClaudeSessions()

      expect(result).toEqual([])
    })

    it('handles sessions with special characters in names', async () => {
      mockTmuxExec({
        sessions: ['claude:1'],
        panes: {
          'claude:1': '55555 /Users/dev/project claude',
        },
      })

      const result = await discoverClaudeSessions()

      expect(result).toHaveLength(1)
      expect(result[0].tmuxSession).toBe('claude:1')
    })
  })
})
