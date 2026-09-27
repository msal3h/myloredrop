import { Link, useLocation } from 'react-router-dom'
import { AuthOverlay, signOut, useAuthProfileReady } from 'deepspace'
import { useState } from 'react'

export default function Navigation() {
  const { isLoaded, isSignedIn, user } = useAuthProfileReady({ requireUser: true })
  const location = useLocation()
  const [showAuth, setShowAuth] = useState(false)
  const [confirming, setConfirming] = useState(false)
  return (
    <>
      <header className="lore-menu-wrap" data-testid="app-navigation">
        <nav className="lore-menu" aria-label="Main navigation">
          <Link className={location.pathname === '/home' && location.search.includes('action=join') ? 'active' : ''} to="/home?action=join">Join</Link>
          <Link className={location.pathname === '/drop' ? 'active' : ''} to="/drop">Drop</Link>
          {!isLoaded ? <span className="menu-placeholder" /> : isSignedIn && user ? (
            <button onClick={() => signOut()} aria-label="Account menu">
              <span data-testid="nav-user-name">Sign out</span>
              <span data-testid="nav-user-email" hidden>{user.email}</span>
            </button>
          ) : (
            <button data-testid="nav-sign-in-button" onClick={() => setConfirming(true)}>Sign in</button>
          )}
        </nav>
      </header>
      {confirming && <div className="composer-backdrop"><div className="signin-confirm"><span>ONE MORE CHECK</span><h2>Ready to sign in?</h2><p>You’ll choose a private Lore nickname next.</p><div><button onClick={() => setConfirming(false)}>Not yet</button><button onClick={() => { setConfirming(false); setShowAuth(true) }}>Yes, sign me in</button></div></div></div>}
      {showAuth && <AuthOverlay onClose={() => setShowAuth(false)} />}
    </>
  )
}
