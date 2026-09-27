/**
 * Landing page — a STATIC page.
 *
 * It lives at the top level of src/pages/ (not under (app)/), so it renders
 * with no DeepSpace providers: no auth session fetch, no records WebSocket.
 * That makes it cheap to serve and safe for logged-out / crawler traffic.
 *
 * Need live data or auth here? Move this file to src/pages/(app)/index.tsx
 * and it becomes a dynamic page. Conversely, any page you want to keep static
 * (marketing, docs, legal) belongs at this top level.
 */

import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div data-testid="static-landing" className="landing-page">
      <nav className="landing-nav"><b><span>✦</span> LoreDrop</b><Link to="/home">Sign in</Link></nav>
      <main>
        <span className="lore-kicker">THE SHARED STORY ARCHIVE</span>
        <h1>Where you drop<br />the <em>lore.</em></h1>
        <p>Drop the lore you’ve been wanting to share—with your people only (shhhh) or everyone ;)</p>
        <Link className="landing-cta" to="/home">Enter the lore <span>→</span></Link>
        <div className="landing-sample" aria-hidden="true">
          <article><span>🍒</span><b>The Cherry Incident</b><p>“Nobody is allowed to talk about what happened at…”</p><small>dropped by Maryam · 2h</small></article>
          <article><span>📍</span><b>Muir Woods</b><p>“This is where we discovered Sarah cannot read a map.”</p><small>dropped by Sara · 1h</small></article>
        </div>
      </main>
    </div>
  )
}
