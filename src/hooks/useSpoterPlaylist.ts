import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useUserPlaylists } from '@/hooks/queries/useUserPlaylists'
import { usePlaylistTracks } from '@/hooks/queries/usePlaylistTracks'
import { useCreatePlaylist } from '@/hooks/mutations/useCreatePlaylist'
import { useAddToPlaylist } from '@/hooks/mutations/useAddToPlaylist'
import { useRemoveFromPlaylist } from '@/hooks/mutations/useRemoveFromPlaylist'

const STORAGE_KEY = 'spoter_playlist_id'
const PLAYLIST_NAME = 'Spoter List'

export function useSpoterPlaylist() {
  const { state: authState } = useAuth()
  const userId = authState.profile?.id ?? ''

  const [playlistId, setPlaylistId] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) ?? ''
  )

  const playlists = useUserPlaylists(!!userId)
  const createPlaylist = useCreatePlaylist()
  const addMutation = useAddToPlaylist()
  const removeMutation = useRemoveFromPlaylist()
  const tracks = usePlaylistTracks(playlistId)

  useEffect(() => {
    if (!playlists.data || playlistId) return

    const existing = playlists.data.items.find(p => p.name === PLAYLIST_NAME)
    if (existing) {
      setPlaylistId(existing.id)
      localStorage.setItem(STORAGE_KEY, existing.id)
    } else if (userId) {
      createPlaylist.mutate(
        { userId, name: PLAYLIST_NAME, isPublic: false },
        {
          onSuccess: playlist => {
            setPlaylistId(playlist.id)
            localStorage.setItem(STORAGE_KEY, playlist.id)
          },
        }
      )
    }
  }, [playlists.data, playlistId, userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const addTrack = (uri: string) => {
    if (playlistId) addMutation.mutate({ playlistId, uris: [uri] })
  }

  const removeTrack = (uri: string) => {
    if (playlistId) removeMutation.mutate({ playlistId, uris: [uri] })
  }

  return {
    playlistId,
    tracks: tracks.data?.items.map(i => i.track) ?? [],
    addTrack,
    removeTrack,
    isLoading: !playlistId || !tracks.data,
  }
}
