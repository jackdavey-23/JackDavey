import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Hub, Loaded, Project } from '../types'

const PANE = 'command-center'
const TITLE = '◆ Command Center'
const HUB_FILE = 'hub/status.json'
const REFRESH_MS = 60_000

const loaded = atom(
  { plugin: 'command-center', key: 'loaded' } as const,
  { hub: null, error: null, readAt: 0 },
  { shape: 'loaded-1' },
)
const open = atom({ plugin: 'command-center', key: 'open' } as const, null)

const STATUS: Record<Project['status'], { glyph: string; color: string; label: string }> = {
  active: { glyph: '●', color: 'success', label: 'LIVE' },
  planning: { glyph: '◌', color: 'suggestion', label: 'PLANNING' },
  paused: { glyph: '◐', color: 'inactive', label: 'PAUSED' },
  blocked: { glyph: '▲', color: 'error', label: 'BLOCKED' },
  done: { glyph: '◆', color: 'merged', label: 'DONE' },
}

const loadHub = async ($: EngineInterface) => {
  const root = await $.session.root()
  const next: Loaded = await $.fs
    .read(`${root}/${HUB_FILE}`)
    .then(text => ({ hub: JSON.parse(text) as Hub, error: null, readAt: Date.now() }))
    .catch((err: unknown) => ({
      hub: null,
      error: `Can't read ${HUB_FILE}: ${err instanceof Error ? err.message : String(err)}`,
      readAt: Date.now(),
    }))
  await update($, loaded, () => next)
}

const bar = (pct: number, width: number) => {
  const filled = Math.round((Math.max(0, Math.min(100, pct)) / 100) * width)
  return '█'.repeat(filled) + '░'.repeat(width - filled)
}

const ago = (iso: string) => {
  const ms = Date.now() - Date.parse(iso)
  if (Number.isNaN(ms)) return iso
  const min = Math.round(ms / 60_000)
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  return hr < 48 ? `${hr}h ago` : `${Math.round(hr / 24)}d ago`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'hub',
      description: 'Open the Command Center dashboard',
    })
    await loadHub($)
    $.clock.every(REFRESH_MS, () => void loadHub($))
    void $.ui.open({ id: PANE, title: TITLE })

    return next(e)
  })

  on('command.run', { command: 'hub' }, async $ => {
    await loadHub($)
    await $.ui.open({ id: PANE, title: TITLE })

    return { text: 'Command Center opened.' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const { hub, error } = await read($, loaded)
    const expanded = await read($, open)
    const cols = e.props.bodyColumns ?? 40
    const barWidth = Math.max(8, Math.min(24, cols - 14))

    const refresh = () => void loadHub($)

    if (!hub) {
      return (
        <Box flexDirection="column" gap={1}>
          <Text color="error">{error ?? 'Loading…'}</Text>
          <Button key="refresh" onPress={refresh}>Retry</Button>
        </Box>
      )
    }

    const card = (p: Project) => {
      const s = STATUS[p.status] ?? STATUS.planning
      const isOpen = expanded === p.id
      const toggle = () => void update($, open, cur => (cur === p.id ? null : p.id))

      return (
        <Box
          key={`card-${p.id}`}
          flexDirection="column"
          borderStyle="round"
          borderColor={isOpen ? 'claude' : 'subtle'}
          paddingX={1}
        >
          <Button key={`toggle-${p.id}`} plain onPress={toggle}>
            <Text color={s.color}>{s.glyph} </Text>
            <Text weight="bold">{p.name}</Text>
            <Text dimColor>  {s.label} {isOpen ? '▾' : '▸'}</Text>
          </Button>
          <Text>
            <Text color="claude">{bar(p.progress, barWidth)}</Text>
            <Text dimColor> {p.progress}% · {p.phase}</Text>
          </Text>
          <Text>
            <Text color="warning" weight="bold">NOW  </Text>
            {p.now}
          </Text>
          {isOpen && (
            <Box flexDirection="column" marginTop={1}>
              <Text>
                <Text color="suggestion" weight="bold">NEXT </Text>
                {p.next}
              </Text>
              <Text color="subtle" weight="bold">PLAN</Text>
              {p.plan.map((step, i) => (
                <Text>
                  <Text dimColor> {String(i + 1).padStart(2)}. </Text>
                  {step}
                </Text>
              ))}
              <Text color="subtle" weight="bold">OVERNIGHT</Text>
              {p.overnight.length === 0 ? (
                <Text dimColor> Nothing logged.</Text>
              ) : (
                p.overnight.map(line => (
                  <Text>
                    <Text color="success"> › </Text>
                    {line}
                  </Text>
                ))
              )}
            </Box>
          )}
        </Box>
      )
    }

    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="column">
          <Text color="claude" weight="bold">▌ COMMAND CENTER</Text>
          <Text dimColor>updated {ago(hub.updated)}</Text>
        </Box>
        <Box flexDirection="column" borderStyle="bold" borderColor="warning" paddingX={1}>
          <Text color="warning" weight="bold">⚡ FOCUS</Text>
          <Text>{hub.focus}</Text>
        </Box>
        {hub.projects.map(card)}
        <Box flexDirection="row" gap={1}>
          <Button key="refresh" onPress={refresh}>↻ Refresh</Button>
          <Button
            key="collapse"
            onPress={() => void update($, open, () => null)}
          >
            Collapse
          </Button>
        </Box>
      </Box>
    )
  })
}
