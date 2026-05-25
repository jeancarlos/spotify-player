import api from '@/lib/axios'

export async function seekRequest(ms: number): Promise<void> {
  try {
    await api.put('/me/player/seek', null, {
      params: { position_ms: ms },
      responseType: 'text',
    })
  } catch {
    /* silent — local progress engine already updated optimistically */
  }
}
