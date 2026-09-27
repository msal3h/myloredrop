import { getAuthToken } from 'deepspace'

export async function deleteSpace(spaceId: string): Promise<void> {
  const token = await getAuthToken()
  if (!token) throw new Error('Sign in to delete a Lore Space.')
  const response = await fetch('/api/actions/delete-space', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ spaceId }),
  })
  const result = await response.json() as { success?: boolean; error?: string }
  if (!response.ok || !result.success) throw new Error(result.error || 'Could not delete that Lore Space.')
}
