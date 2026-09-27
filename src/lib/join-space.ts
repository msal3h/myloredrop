import { getAuthToken } from 'deepspace'

export async function joinSpace(code: string): Promise<string> {
  const token = await getAuthToken()
  if (!token) throw new Error('Sign in to join a Lore Space.')
  const response = await fetch('/api/actions/join-space', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ code }),
  })
  const result = await response.json() as { success?: boolean; error?: string; data?: { spaceId?: string } }
  if (!response.ok || !result.success || !result.data?.spaceId) {
    throw new Error(result.error || 'Could not join that Lore Space.')
  }
  return result.data.spaceId
}
