import { FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useUser } from 'deepspace'
import { Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui'
import { joinSpace } from '@/lib/join-space'
import { deleteSpace } from '@/lib/delete-space'

interface Space {
  title: string
  description?: string
  creatorNickname: string
  inviteCode: string
  visibility: 'private' | 'public'
  collaborators: string[]
}

export default function SpacesPage() {
  const navigate = useNavigate()
  const { user } = useUser()
  const [searchParams] = useSearchParams()
  const joinInputRef = useRef<HTMLInputElement>(null)
  const { records: spaces, status } = useQuery<Space>('spaces', {
    orderBy: 'createdAt',
    orderDir: 'desc',
  })
  const { error } = useToast()
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'join') joinInputRef.current?.focus()
  }, [searchParams])

  async function submitJoin(event: FormEvent) {
    event.preventDefault()
    if (!joinCode.trim()) return
    setJoining(true)
    try { navigate(`/drop?space=${await joinSpace(joinCode)}`) }
    catch (cause) { error('Could not join', cause instanceof Error ? cause.message : String(cause)) }
    finally { setJoining(false) }
  }

  async function removeSpace(recordId: string, title: string) {
    if (!window.confirm(`Delete “${title}” and all of its evidence? This cannot be undone.`)) return
    try { await deleteSpace(recordId) }
    catch (cause) { error('Could not delete the space', cause instanceof Error ? cause.message : String(cause)) }
  }

  return (
    <div className="lore-page spaces-page">
      <header className="spaces-hero">
        <div>
          <h1>Where does the <em className="lore-word" tabIndex={0}>lore<span className="lore-definition">the drama, the tea, the things you neeeed to know</span></em> live?</h1>
        </div>
      </header>

      <form className="join-strip" onSubmit={submitJoin}>
        <label htmlFor="join-code">Have a Lore Code?</label>
        <input ref={joinInputRef} id="join-code" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="AB12CD34" maxLength={8} />
        <button className="ink-button" disabled={joining || !joinCode.trim()}>{joining ? 'Joining…' : 'Join space'}</button>
      </form>

      {status !== 'loading' && (spaces.length === 0 ? (
        <button className="empty-space-card" onClick={() => navigate('/drop')}>
          <span>＋</span><b>Start your first Lore Space</b><small>Every good story needs somewhere to live.</small>
        </button>
      ) : (
        <section className="space-grid" aria-label="Lore Spaces">
          {spaces.map((space, index) => (
            <article className={`space-card-shell tilt-${index % 3}`} key={space.recordId}>
            <Link className="space-card" to={`/drop?space=${space.recordId}`}>
              <h2>{space.data.title}</h2>
              <p>{space.data.description || 'A shared pile of stories, context, and questionable decisions.'}</p>
              <footer><span>{space.data.visibility === 'public' ? 'PUBLIC' : 'PRIVATE'} · started by {space.data.creatorNickname}</span><b>OPEN →</b></footer>
            </Link>
            {space.createdBy === user?.id && <button className="delete-evidence delete-space" onClick={() => void removeSpace(space.recordId, space.data.title)} aria-label={`Delete ${space.data.title}`} title="Delete Lore Space"><Trash2 /></button>}
            </article>
          ))}
        </section>
      ))}
    </div>
  )
}
