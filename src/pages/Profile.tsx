import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'

export function Profile() {
  const { t } = useTranslation()
  const { state } = useAuth()
  const profile = state.profile

  if (!profile) return null

  return (
    <div className="min-h-screen pt-16 px-6 pb-24">
      <div className="max-w-lg mx-auto pt-8">
        <div className="glass-card p-8 flex flex-col items-center gap-4">
          {profile.images[0]?.url ? (
            <img
              src={profile.images[0].url}
              alt={profile.display_name}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-black/10 flex items-center justify-center text-4xl font-bold text-black/30">
              {profile.display_name[0]}
            </div>
          )}
          <div className="text-center">
            <h1 className="text-xl font-black text-black">{profile.display_name}</h1>
            <p className="text-sm text-black/50 mt-1">{profile.email}</p>
            <p className="text-xs text-black/30 mt-0.5">{profile.country}</p>
          </div>
          <div className="flex gap-6 mt-2">
            <div className="text-center">
              <p className="text-lg font-bold text-black">{profile.followers.total}</p>
              <p className="text-xs text-black/40">
                {t('profile.followers_label', { count: profile.followers.total })}
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-black capitalize">{profile.product}</p>
              <p className="text-xs text-black/40">{t('profile.plan')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
