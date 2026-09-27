import { ChangeEvent, FormEvent, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutations, useQuery, useR2Files, useUser } from 'deepspace'
import { useToast } from '@/components/ui'
import { getNickname } from '@/lib/nickname'
import { Trash2 } from 'lucide-react'

interface Space { title: string; description?: string; creatorNickname: string; inviteCode: string; visibility: 'private' | 'public'; collaborators: string[] }
interface LoreDrop { spaceId: string; nickname: string; title: string; story: string; emoji: string; kind?: 'text' | 'photo' | 'voice'; mediaUrl?: string; mediaMime?: string; visibility: 'private' | 'public'; collaborators: string[] }
type Method = 'choose' | 'text' | 'photo' | 'voice' | null

export default function DropPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useUser()
  const { records: spaces, status: spacesStatus } = useQuery<Space>('spaces', { orderBy: 'createdAt', orderDir: 'desc' })
  const requestedSpace = searchParams.get('space') ?? ''
  const spaceId = requestedSpace
  const space = spaces.find((item) => item.recordId === spaceId)
  const { records: drops } = useQuery<LoreDrop>('lore-drops', { where: { spaceId }, orderBy: 'createdAt', orderDir: 'desc' })
  const { ready, createConfirmed, removeConfirmed } = useMutations<LoreDrop>('lore-drops')
  const { ready: spaceReady, createConfirmed: createSpaceConfirmed } = useMutations<Space>('spaces')
  const { upload, isUploading } = useR2Files({ scope: 'app' })
  const { success, error } = useToast()
  const [method, setMethod] = useState<Method>(null)
  const [title, setTitle] = useState('')
  const [story, setStory] = useState('')
  const [recording, setRecording] = useState(false)
  const [creatingSpace, setCreatingSpace] = useState(false)
  const [spaceTitle, setSpaceTitle] = useState('')
  const [spaceDescription, setSpaceDescription] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [visibility, setVisibility] = useState<'private' | 'public'>('private')
  const recorder = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const chunks = useRef<Blob[]>([])
  const fileInput = useRef<HTMLInputElement>(null)
  const nickname = user ? getNickname(user.id) : ''
  const grouped = useMemo(() => ({
    text: drops.filter((item) => !item.data.kind || item.data.kind === 'text'),
    photo: drops.filter((item) => item.data.kind === 'photo'),
    voice: drops.filter((item) => item.data.kind === 'voice'),
  }), [drops])

  async function createSpace(event: FormEvent) {
    event.preventDefault()
    const code = inviteCode.trim().toUpperCase()
    if (!spaceTitle.trim() || !nickname || !/^[A-Z0-9]{4,12}$/.test(code)) return
    try {
      const recordId = await createSpaceConfirmed({ title: spaceTitle.trim(), description: spaceDescription.trim(), creatorNickname: nickname, inviteCode: code, visibility, collaborators: [] })
      setCreatingSpace(false)
      setSpaceTitle(''); setSpaceDescription(''); setInviteCode(''); setVisibility('private')
      setSearchParams({ space: recordId })
      setMethod('choose')
      success('Lore Space created', 'Now choose how you want to tell the lore.')
    } catch (cause) { error('Could not create the space', String(cause)) }
  }

  async function saveDrop(data: Omit<LoreDrop, 'spaceId' | 'nickname' | 'visibility' | 'collaborators'>) {
    if (!space) return
    await createConfirmed({ ...data, spaceId, nickname, visibility: space.data.visibility ?? 'private', collaborators: space.data.collaborators })
    setMethod(null); setTitle(''); setStory('')
    success('Lore dropped', 'The receipt is now in this shared space.')
  }

  async function submitText(event: FormEvent) {
    event.preventDefault()
    if (!title.trim() || !story.trim()) return
    try { await saveDrop({ title: title.trim(), story: story.trim(), emoji: '✎', kind: 'text' }) }
    catch (cause) { error('Could not drop the lore', String(cause)) }
  }

  async function deleteDrop(recordId: string, dropTitle: string) {
    if (!window.confirm(`Delete “${dropTitle}”? This cannot be undone.`)) return
    try {
      await removeConfirmed(recordId)
      success('Evidence deleted', 'That piece of lore has been removed.')
    } catch (cause) { error('Could not delete the evidence', String(cause)) }
  }

  async function addMedia(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const result = await upload(file, file.name, { key: `lore/${spaceId}/${crypto.randomUUID()}-${file.name}` })
      if (!result.success || !result.url) throw new Error(result.error || 'Upload failed')
      await saveDrop({ title: file.name, story: file.type.startsWith('video/') ? 'Video receipt' : 'Photo receipt', emoji: '▣', kind: 'photo', mediaUrl: result.url, mediaMime: file.type })
    } catch (cause) { error('Could not add that file', String(cause)) }
  }

  async function startVoice() {
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true })
      const next = new MediaRecorder(media); chunks.current = []; stream.current = media; recorder.current = next
      next.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data) }
      next.start(); setRecording(true)
    } catch { error('Microphone unavailable', 'Allow microphone access to record a voice receipt.') }
  }

  async function stopVoice() {
    const active = recorder.current
    if (!active) return
    active.onstop = async () => {
      try {
        const blob = new Blob(chunks.current, { type: active.mimeType || 'audio/webm' })
        const result = await upload(blob, 'voice-receipt.webm', { key: `lore/${spaceId}/${crypto.randomUUID()}-voice.webm` })
        if (!result.success || !result.url) throw new Error(result.error || 'Upload failed')
        await saveDrop({ title: 'Witness statement', story: new Date().toLocaleString(), emoji: '◉', kind: 'voice', mediaUrl: result.url, mediaMime: blob.type })
      } catch (cause) { error('Could not save the recording', String(cause)) }
      finally { stream.current?.getTracks().forEach((track) => track.stop()); setRecording(false); recorder.current = null }
    }
    active.stop()
  }

  if (spacesStatus === 'loading') return <div className="paper-message lore-page">Opening the drop desk…</div>
  if (!space) return <div className="drop-space-step lore-page">
    <header><h1>Choose the chapter.</h1><p>Pick a Lore Space first. Nothing opens until you choose it.</p></header>
    <section className="drop-space-grid">
      {spaces.map((item, index) => <button className={`space-card tilt-${index % 3}`} key={item.recordId} onClick={() => { setSearchParams({ space: item.recordId }); setMethod('choose') }}><span className="space-number">{item.data.visibility === 'public' ? 'PUBLIC' : 'PRIVATE'}</span><h2>{item.data.title}</h2><p>{item.data.description || 'Open this chapter and add to the lore.'}</p><footer><b>CHOOSE →</b></footer></button>)}
      <button className="create-space-choice" onClick={() => setCreatingSpace(true)}><span>＋</span><b>Create a new Lore Space</b><small>Name it, set privacy, and choose its code.</small></button>
    </section>
    {creatingSpace && <div className="composer-backdrop" onMouseDown={() => setCreatingSpace(false)}><form className="lore-composer" onSubmit={createSpace} onMouseDown={(event) => event.stopPropagation()}><div className="composer-heading"><div><h2>Name this chapter.</h2></div><button type="button" onClick={() => setCreatingSpace(false)}>×</button></div><label>SPACE NAME<input autoFocus value={spaceTitle} onChange={(event) => setSpaceTitle(event.target.value)} placeholder="The Summer 2026 Lore" maxLength={80} /></label><fieldset className="visibility-choice"><legend>WHO CAN FIND THIS SPACE?</legend><label><input type="radio" name="visibility" checked={visibility === 'private'} onChange={() => setVisibility('private')} /><span><b>Private</b><small>Invite only. This is the default.</small></span></label><label><input type="radio" name="visibility" checked={visibility === 'public'} onChange={() => setVisibility('public')} /><span><b>Public</b><small>Anyone signed in can discover and view it.</small></span></label></fieldset><label>CHOOSE A LORE CODE<input value={inviteCode} onChange={(event) => setInviteCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="CHERRY26" minLength={4} maxLength={12} /><small>4–12 letters or numbers. Friends use this code to join.</small></label><label>THE ONE-LINE CONTEXT<textarea value={spaceDescription} onChange={(event) => setSpaceDescription(event.target.value)} placeholder="Everything that needs explaining after this trip…" rows={3} maxLength={220} /></label><div className="composer-actions"><button type="button" onClick={() => setCreatingSpace(false)}>Never mind</button><button className="submit-drop" disabled={!spaceReady || !spaceTitle.trim() || !/^[A-Z0-9]{4,12}$/.test(inviteCode)}>{spaceReady ? 'Continue' : 'Connecting…'}</button></div></form></div>}
  </div>

  return <div className="drop-workspace lore-page">
    <header><h1>Drop the lore.</h1></header>
    <div className="space-picker"><span>DROPPING INTO</span><b>{space.data.title}</b><button onClick={() => { setMethod(null); setSearchParams({}) }}>Change space</button></div>
    <button className="big-plus" onClick={() => setMethod('choose')}>+</button>
    {drops.length > 0 && <button className="convert-workspace" onClick={() => navigate(`/canvas?space=${spaceId}&import=receipts`)}>Open in workspace ↗</button>}
    <input ref={fileInput} type="file" hidden accept="image/*,video/*" onChange={addMedia} />
    <ReceiptGroup title="TEXT RECEIPTS" items={grouped.text} userId={user?.id} onDelete={deleteDrop} />
    <ReceiptGroup title="PHOTO/VIDEO RECEIPTS" items={grouped.photo} userId={user?.id} onDelete={deleteDrop} />
    <ReceiptGroup title="VOICE RECEIPTS" items={grouped.voice} userId={user?.id} onDelete={deleteDrop} />
    {method && <div className="composer-backdrop" onMouseDown={() => setMethod(null)}><div className="method-composer" onMouseDown={(e) => e.stopPropagation()}>
      <div className="composer-heading"><div>{method !== 'choose' && <span>NEW DROP</span>}<h2>{method === 'choose' ? 'How are we telling it?' : method === 'text' ? 'File a text receipt.' : method === 'photo' ? 'Add the evidence.' : 'Record the version you remember.'}</h2></div><button onClick={() => setMethod(null)}>×</button></div>
      {method === 'choose' && <div className="drop-methods"><button onClick={() => setMethod('text')}><b>Text</b><span>Paste a chat or type what happened.</span></button><button onClick={() => fileInput.current?.click()}><b>Photos/Videos</b><span>Add screenshots, photos, or video evidence.</span></button><button onClick={() => setMethod('voice')}><b>Voice</b><span>Record the version you remember.</span></button><button onClick={() => navigate(`/canvas?space=${spaceId}`)}><b>Canvas</b><span>Arrange the lore yourself on a shared board.</span></button></div>}
      {method === 'text' && <form className="drop-text-form" onSubmit={submitText}><label>RECEIPT TITLE<input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="The Cherry Incident" /></label><label>WHAT HAPPENED?<textarea value={story} onChange={(e) => setStory(e.target.value)} rows={5} placeholder="Paste the group chat evidence here…" /></label><button disabled={!ready || !title.trim() || !story.trim()}>Drop</button></form>}
      {method === 'photo' && <button className="media-pick" onClick={() => fileInput.current?.click()} disabled={isUploading}>{isUploading ? 'Uploading…' : 'Choose a photo or video'}</button>}
      {method === 'voice' && <div className="voice-recorder"><div className="recording-line"><i />{recording ? 'Recording your lore…' : 'Ready for your version.'}</div><button onClick={() => recording ? void stopVoice() : void startVoice()}>{recording ? 'Stop & save' : 'Start recording'}</button></div>}
      <p className="composer-privacy">Closed group by default. Everything stays editable.</p>
    </div></div>}
  </div>
}

function ReceiptGroup({ title, items, userId, onDelete }: { title: string; items: Array<{ recordId: string; createdBy?: string; data: LoreDrop }>; userId?: string; onDelete: (recordId: string, title: string) => Promise<void> }) {
  if (!items.length) return null
  return <section className="receipt-group"><h2>{title} <span>{items.length}</span></h2><div className="receipt-grid">{items.map((item) => <article key={item.recordId} className={`receipt-card ${item.data.kind ?? 'text'}`}>{item.createdBy === userId && <button className="delete-evidence" onClick={() => void onDelete(item.recordId, item.data.title)} aria-label={`Delete ${item.data.title}`} title="Delete evidence"><Trash2 /></button>}{item.data.mediaUrl && item.data.mediaMime?.startsWith('image/') && <img src={item.data.mediaUrl} alt="" />}{item.data.mediaUrl && item.data.mediaMime?.startsWith('video/') && <video controls src={item.data.mediaUrl} />}{item.data.mediaUrl && item.data.kind === 'voice' && <audio controls src={item.data.mediaUrl} />}<small>{(item.data.kind ?? 'text').toUpperCase()}</small><h3>{item.data.title}</h3><p>{item.data.story}</p><footer>dropped by {item.data.nickname}</footer></article>)}</div></section>
}
