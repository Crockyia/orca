import { describe, expect, it } from 'vitest'
import type { DashboardAgentRow } from '@/components/dashboard/rows/dashboard-agent-row'
import { buildSummaryAgentGroups, isUnreadDoneAgent } from './worktree-card-agent-summary'

function row(paneKey: string, state: 'done' | 'working' | 'waiting'): DashboardAgentRow {
  return {
    paneKey,
    agentType: 'codex',
    state,
    startedAt: 1,
    entry: {
      paneKey,
      state,
      prompt: '',
      updatedAt: 1,
      stateStartedAt: 1,
      stateHistory: []
    },
    tab: {
      id: 'tab',
      ptyId: null,
      worktreeId: 'wt',
      title: 'Codex',
      customTitle: null,
      color: null,
      sortOrder: 0,
      createdAt: 1
    }
  }
}

describe('buildSummaryAgentGroups', () => {
  it('groups agents by state, most urgent first', () => {
    const agents = [row('a', 'done'), row('b', 'working'), row('c', 'done'), row('d', 'waiting')]
    const groups = buildSummaryAgentGroups(agents)

    expect(groups.map((g) => [g.state, g.agents.map((a) => a.paneKey)])).toEqual([
      ['waiting', ['d']],
      ['working', ['b']],
      ['done', ['a', 'c']]
    ])
  })

  it('leads with unread completions when the card has no unread rollup', () => {
    const agents = [row('a', 'done'), row('b', 'working'), row('c', 'done')]
    const groups = buildSummaryAgentGroups(agents, () => true)

    expect(groups.map((g) => [g.state, g.unread ?? false, g.agents.map((a) => a.paneKey)])).toEqual(
      [
        ['done', true, ['a', 'c']],
        ['working', false, ['b']]
      ]
    )
  })
})

describe('isUnreadDoneAgent', () => {
  it('never counts live agents as unread', () => {
    const always = (): boolean => true
    expect(isUnreadDoneAgent(row('a', 'done'), always)).toBe(true)
    expect(isUnreadDoneAgent(row('b', 'working'), always)).toBe(false)
    expect(isUnreadDoneAgent(row('c', 'waiting'), always)).toBe(false)
    expect(isUnreadDoneAgent(row('d', 'done'), undefined)).toBe(false)
  })
})
