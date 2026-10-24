export type Project = {
  id: string
  name: string
  tagline?: string
  status: 'active' | 'paused' | 'planning' | 'blocked' | 'done'
  progress: number
  phase: string
  now: string
  next: string
  plan: string[]
  overnight: string[]
  /** When this project's block was last reported, ISO. */
  asOf?: string
  /** The Claude session that owns this project, asked on Pull live. */
  sessionId?: string
  source?: string
}

export type Hub = {
  updated: string
  focus: string
  projects: Project[]
}

export type Loaded = { hub: Hub | null; error: string | null; readAt: number }

declare module 'claude-code' {
  interface PluginState {
    'command-center': {
      loaded: Shaped<Loaded>
      open: string | null
      pullAt: number | null
    }
  }
}
