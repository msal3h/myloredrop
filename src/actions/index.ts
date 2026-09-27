import type { ActionHandler } from 'deepspace/worker'
import type { Env } from '../../worker'

interface SharedSpace extends Record<string, unknown> {
  inviteCode: string
  collaborators: string[]
}

interface SharedDrop extends Record<string, unknown> {
  collaborators: string[]
}

const joinSpace: ActionHandler<Env> = async ({ userId, params, tools }) => {
  const code = typeof params.code === 'string' ? params.code.trim().toUpperCase() : ''
  if (!code) return { success: false, error: 'Enter a Lore Code.' }

  const result = await tools.query<SharedSpace>('spaces', { where: { inviteCode: code }, limit: 1 })
  if (!result.success) return result
  const space = result.data.records[0]
  if (!space) return { success: false, error: 'That Lore Code does not exist.' }

  const collaborators = Array.from(new Set([...(space.data.collaborators ?? []), userId]))
  const updated = await tools.update<SharedSpace>('spaces', space.recordId, { collaborators })
  if (!updated.success) return updated

  const drops = await tools.query<SharedDrop>('lore-drops', { where: { spaceId: space.recordId }, limit: 500 })
  if (drops.success) {
    for (const drop of drops.data.records) {
      await tools.update<SharedDrop>('lore-drops', drop.recordId, {
        collaborators: Array.from(new Set([...(drop.data.collaborators ?? []), userId])),
      })
    }
  }

  return { success: true, data: { spaceId: space.recordId } }
}

const deleteSpace: ActionHandler<Env> = async ({ userId, params, tools }) => {
  const spaceId = typeof params.spaceId === 'string' ? params.spaceId : ''
  if (!spaceId) return { success: false, error: 'Missing Lore Space.' }
  const result = await tools.get('spaces', spaceId)
  if (!result.success) return result
  const space = result.data.record as { createdBy?: string }
  if (space.createdBy !== userId) return { success: false, error: 'Only the original creator can delete this Lore Space.' }
  await tools.deleteWhere('lore-drops', { spaceId }, 500)
  return tools.remove('spaces', spaceId)
}

export const actions: Record<string, ActionHandler<Env>> = {
  'join-space': joinSpace,
  'delete-space': deleteSpace,
}
