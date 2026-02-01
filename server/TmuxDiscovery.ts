import { exec } from 'child_process'
import type { DiscoveredSession } from '../shared/types.js'

/**
 * Promisified exec wrapper that works with the child_process mock
 */
function execAsync(command: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error)
      } else {
        resolve({ stdout: stdout.toString(), stderr: stderr.toString() })
      }
    })
  })
}

/**
 * Discovers Claude/Codex sessions running in tmux.
 * Scans all tmux sessions and filters for those running claude or codex commands.
 */
export async function discoverClaudeSessions(): Promise<DiscoveredSession[]> {
  const sessions: DiscoveredSession[] = []

  // Get list of tmux sessions
  let sessionNames: string[]
  try {
    const { stdout } = await execAsync('tmux list-sessions -F "#{session_name}"')
    sessionNames = stdout
      .trim()
      .split('\n')
      .filter((name) => name.length > 0)
  } catch (error) {
    // tmux not installed or no server running - graceful failure
    return []
  }

  // Check each session for Claude/Codex commands
  for (const sessionName of sessionNames) {
    try {
      // Get pane info: PID, current path, and command
      const { stdout } = await execAsync(
        `tmux list-panes -t ${sessionName} -F "#{pane_pid} #{pane_current_path} #{pane_current_command}"`
      )

      const lines = stdout.trim().split('\n')
      for (const line of lines) {
        const parsed = parsePaneLine(line)
        if (!parsed) continue

        const { pid, cwd, command } = parsed

        // Filter for claude or codex commands
        if (command === 'claude' || command === 'codex') {
          sessions.push({
            tmuxSession: sessionName,
            command,
            cwd,
            pid,
            discoveredAt: Date.now(),
          })
          // Only take first matching pane per session
          break
        }
      }
    } catch {
      // Session may have closed between list and query - ignore
      continue
    }
  }

  return sessions
}

/**
 * Parse a tmux pane line in format: "PID CWD COMMAND"
 * Example: "12345 /Users/dev/project claude"
 */
function parsePaneLine(
  line: string
): { pid: number; cwd: string; command: string } | null {
  const parts = line.trim().split(' ')
  if (parts.length < 3) return null

  const pid = parseInt(parts[0], 10)
  if (isNaN(pid)) return null

  // Command is the last part, cwd is everything in between
  const command = parts[parts.length - 1]
  const cwd = parts.slice(1, -1).join(' ')

  if (!cwd) return null

  return { pid, cwd, command }
}
