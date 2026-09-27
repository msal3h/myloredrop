import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutations, useQuery, useUser } from 'deepspace'
import { ArrowLeft, Copy, Plus } from 'lucide-react'
import { useToast } from '@/components/ui'
import { getNickname, saveNickname } from '@/lib/nickname'

interface Space { title: string; description?: string; creatorNickname: string; inviteCode: string; visibility: 'private' | 'public'; collaborators: string[] }
interface LoreDrop { spaceId: string; nickname: string; title: string; story: string; emoji: string; visibility: 'private' | 'public'; collaborators: string[] }
const EMOJIS = ['🍒', '📍', '🪩', '🫖', '🧃', '🎟️']

export default function SpacePage() {
  const { spaceId = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const { records: spaces, status: spacesStatus } = useQuery<Space>('spaces')
  const { records: drops, status } = useQuery<LoreDrop>('lore-drops', { where: { spaceId }, orderBy: 'createdAt', orderDir: 'desc' })
  const { ready, createConfirmed } = useMutations<LoreDrop>('lore-drops')
  const { success, error } = useToast()
  const [composerOpen, setComposerOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [story, setStory] = useState('')
  const [emoji, setEmoji] = useState(EMOJIS[0])
  const [nickname, setNickname] = useState('')
  const space = useMemo(() => spaces.find((item) => item.recordId === spaceId), [spaces, spaceId])

  useEffect(() => { if (user) setNickname(getNickname(user.id)) }, [user])

  function rememberNickname(value: string) {
    setNickname(value)
    if (user) saveNickname(user.id, value)
  }

  async function submitDrop(event: FormEvent) {
    event.preventDefault()
    if (!space || !nickname.trim() || !title.trim() || !story.trim()) return
    try {
      await createConfirmed({ spaceId, nickname: nickname.trim(), title: title.trim(), story: story.trim(), emoji, visibility: space.data.visibility ?? 'private', collaborators: space.data.collaborators })
      setTitle(''); setStory(''); setEmoji(EMOJIS[(drops.length + 1) % EMOJIS.length]); setComposerOpen(false)
      success('Lore dropped', 'Everyone in this space can see it now.')
    } catch (cause) { error('Could not drop the lore', String(cause)) }
  }

  async function copyInvite() {
    if (!space) return
    await navigator.clipboard.writeText(`${window.location.origin}/join/${space.data.inviteCode}`)
    success('Invite link copied', `Lore Code: ${space.data.inviteCode}`)
  }

  if (spacesStatus === 'loading') return <div className="paper-message lore-page">Finding that file…</div>
  if (!space) return <div className="paper-message lore-page"><b>That Lore Space is missing.</b><Link to="/home">Back to your spaces</Link></div>

  return (
    <div className="lore-page space-detail">
      <header className="space-heading">
        <Link to="/home" className="back-link"><ArrowLeft /> All spaces</Link>
        <span className="lore-kicker">SHARED LORE FILE</span>
        <h1>{space.data.title}</h1>
        <p>{space.data.description}</p>
        <div className="space-heading-meta"><span>{drops.length} drops in the archive</span><span>Live with your people</span><button onClick={copyInvite}><Copy /> Share · {space.data.inviteCode}</button></div>
      </header>

      <div className="drops-topline"><span>THE RECEIPTS</span><button className="ink-button" onClick={() => navigate(`/drop?space=${spaceId}`)}><Plus /> Drop lore</button></div>
      {status === 'loading' ? <div className="paper-message">Gathering the evidence…</div> : drops.length === 0 ? (
        <button className="empty-drop" onClick={() => navigate(`/drop?space=${spaceId}`)}><span>✦</span><b>Be the first to drop the context.</b><small>You know the story. Put it on the record.</small></button>
      ) : (
        <section className="drop-grid" aria-live="polite">
          {drops.map((drop, index) => (
            <article className={`lore-card tilt-${index % 3}`} key={drop.recordId}>
              <div className="lore-card-pin" aria-hidden="true" />
              <span className="lore-emoji">{drop.data.emoji}</span>
              <span className="drop-index">DROP {String(drops.length - index).padStart(2, '0')}</span>
              <h2>{drop.data.title}</h2>
              <p>“{drop.data.story}”</p>
              <footer><span>dropped by <b>{drop.data.nickname}</b></span><time>{new Date(drop.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</time></footer>
            </article>
          ))}
        </section>
      )}

      <button className="floating-add" onClick={() => navigate(`/drop?space=${spaceId}`)} aria-label="Drop lore"><Plus /></button>
      {composerOpen && (
        <div className="composer-backdrop" role="presentation" onMouseDown={() => setComposerOpen(false)}>
          <form className="lore-composer" onSubmit={submitDrop} onMouseDown={(e) => e.stopPropagation()}>
            <div className="composer-heading"><div><span>ADD TO THE RECORD</span><h2>Drop the context.</h2></div><button type="button" onClick={() => setComposerOpen(false)}>×</button></div>
            <div className="emoji-row">{EMOJIS.map((item) => <button type="button" className={emoji === item ? 'active' : ''} onClick={() => setEmoji(item)} key={item}>{item}</button>)}</div>
            <label>YOUR NICKNAME<input value={nickname} onChange={(e) => rememberNickname(e.target.value)} placeholder="CherryBandit" maxLength={30} /></label>
            <label>WHAT DO WE CALL THIS?<input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="The Cherry Incident" maxLength={90} /></label>
            <label>WHAT ACTUALLY HAPPENED?<textarea value={story} onChange={(e) => setStory(e.target.value)} placeholder="Nobody is allowed to talk about what happened at…" rows={5} maxLength={1200} /></label>
            <div className="composer-actions"><button type="button" onClick={() => setComposerOpen(false)}>Keep the secret</button><button className="submit-drop" disabled={!ready || !nickname.trim() || !title.trim() || !story.trim()}>{ready ? 'Drop it' : 'Connecting…'}</button></div>
            <p className="composer-privacy">Shared instantly with everyone in this Lore Space.</p>
          </form>
        </div>
      )}
    </div>
  )
}
