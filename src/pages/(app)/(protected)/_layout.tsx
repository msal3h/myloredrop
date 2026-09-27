/**
 * Gated routes. Any file under src/pages/(app)/(protected)/ requires sign-in.
 * The `(protected)` folder is a Generouted route group — parentheses mean
 * it doesn't appear in the URL. For a dynamic page that does NOT require
 * sign-in, put it directly under src/pages/(app)/; for a static page, put it
 * at the top level of src/pages/.
 *
 * Children may call data hooks like `useUser()` safely because the parent
 * (app)/_layout.tsx mounts <RecordProvider> above this layout.
 *
 * The `fallback` keeps signed-out visitors inside the app's own chrome
 * (without it, AuthGate shows the SDK's full-screen, non-dismissible
 * overlay). The sign-in overlay opens on demand and can be dismissed.
 */

import { FormEvent, useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { AuthGate, AuthOverlay, useUser } from 'deepspace'
import { Button } from '@/components/ui'
import { getNickname, saveNickname } from '@/lib/nickname'

export default function ProtectedLayout() {
  return (
    <AuthGate fallback={<SignedOutPanel />}>
      <NicknameGate />
    </AuthGate>
  )
}

function NicknameGate() {
  const { user } = useUser()
  const [nickname, setNickname] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!user) return
    const existing = getNickname(user.id)
    setNickname(existing)
    setSaved(Boolean(existing.trim()))
  }, [user])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!user || !nickname.trim()) return
    saveNickname(user.id, nickname.trim())
    setSaved(true)
  }

  if (saved) return <Outlet />
  return (
    <div className="nickname-gate">
      <form onSubmit={submit}>
        <span>STEP 2 OF 2</span>
        <h1>What should the lore call you?</h1>
        <p>Your account name stays private. Other collaborators only see this nickname.</p>
        <label>LORE NICKNAME<input autoFocus value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="CherryBandit" maxLength={30} /></label>
        <button disabled={!nickname.trim()}>Enter LoreDrop</button>
      </form>
    </div>
  )
}

function SignedOutPanel() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-20">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 text-center">
        <h1 className="text-lg font-semibold text-foreground">Sign in to continue</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This page is only available to signed-in users.
        </p>
        <Button className="mt-6 w-full" onClick={() => setConfirming(true)}>
          Sign in
        </Button>
        <Link
          to="/"
          className="mt-4 inline-block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Back to home
        </Link>
      </div>

      {confirming && <div className="composer-backdrop"><div className="signin-confirm"><span>ONE MORE CHECK</span><h2>Ready to sign in?</h2><p>You’ll choose a private Lore nickname next.</p><div><button onClick={() => setConfirming(false)}>Not yet</button><button onClick={() => { setConfirming(false); setShowAuthModal(true) }}>Yes, sign me in</button></div></div></div>}
      {showAuthModal && <AuthOverlay onClose={() => setShowAuthModal(false)} />}
    </div>
  )
}
