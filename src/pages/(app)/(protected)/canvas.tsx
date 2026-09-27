import { useEffect, useRef, useState } from 'react'
import { useCanvas, useQuery } from 'deepspace'
import { useSearchParams } from 'react-router-dom'
import { createShapeId, getSnapshot, loadSnapshot, Tldraw, toRichText, type Editor } from 'tldraw'
import 'tldraw/tldraw.css'

interface Space { title: string; description?: string; creatorNickname: string; inviteCode: string; visibility: 'private' | 'public'; collaborators: string[] }
interface LoreDrop { title: string; story: string; nickname: string; kind?: string; mediaUrl?: string; mediaMime?: string }

export default function CanvasPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { records: spaces, status } = useQuery<Space>('spaces', { orderBy: 'createdAt', orderDir: 'desc' })
  const requested = searchParams.get('space') ?? ''
  const spaceId = requested || spaces[0]?.recordId || ''
  const space = spaces.find((item) => item.recordId === spaceId)
  const { records: drops, status: dropsStatus } = useQuery<LoreDrop>('lore-drops', { where: { spaceId }, orderBy: 'createdAt', orderDir: 'asc' })
  const importReceipts = searchParams.get('import') === 'receipts'

  if (status === 'loading') return <div className="paper-message lore-page">Unrolling the canvas…</div>
  if (importReceipts && dropsStatus === 'loading') return <div className="paper-message lore-page">Pasting the receipts into the workspace…</div>
  if (!space) return <div className="paper-message lore-page">Create or join a Lore Space to start a canvas.</div>
  return <LoreCanvas key={spaceId} spaceId={spaceId} space={space.data} drops={drops} importReceipts={importReceipts} spaces={spaces.map((item) => ({ id: item.recordId, title: item.data.title }))} onSpace={(id) => setSearchParams({ space: id })} onImported={() => setSearchParams({ space: spaceId }, { replace: true })} />
}

function LoreCanvas({ spaceId, space, drops, importReceipts, spaces, onSpace, onImported }: { spaceId: string; space: Space; drops: Array<{ recordId: string; data: LoreDrop }>; importReceipts: boolean; spaces: { id: string; title: string }[]; onSpace: (id: string) => void; onImported: () => void }) {
  const { shapes, canWrite, addShape, updateShape } = useCanvas(`lore:${spaceId}`)
  const documentShape = shapes.find((shape) => shape.type === 'tldraw-document')
  const editorRef = useRef<Editor | null>(null)
  const applyingRemote = useRef(false)
  const pendingCreate = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSnapshot = useRef('')
  const [expanded, setExpanded] = useState(false)
  const imported = useRef(false)

  useEffect(() => {
    const editor = editorRef.current
    const snapshot = typeof documentShape?.props.snapshot === 'string' ? documentShape.props.snapshot : ''
    if (!editor || !snapshot || snapshot === lastSnapshot.current) return
    try {
      applyingRemote.current = true
      loadSnapshot(editor.store, JSON.parse(snapshot))
      lastSnapshot.current = snapshot
    } finally {
      applyingRemote.current = false
      pendingCreate.current = false
    }
  }, [documentShape?.updatedAt, documentShape?.props.snapshot])

  function mountEditor(editor: Editor) {
    editorRef.current = editor
    const initial = typeof documentShape?.props.snapshot === 'string' ? documentShape.props.snapshot : ''
    if (initial) {
      applyingRemote.current = true
      loadSnapshot(editor.store, JSON.parse(initial))
      lastSnapshot.current = initial
      applyingRemote.current = false
    }
    editor.store.listen(() => {
      if (!canWrite || applyingRemote.current) return
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        const snapshot = JSON.stringify(getSnapshot(editor.store))
        if (snapshot === lastSnapshot.current) return
        lastSnapshot.current = snapshot
        if (documentShape) updateShape(documentShape.id, { snapshot })
        else if (!pendingCreate.current) {
          pendingCreate.current = true
          addShape({ type: 'tldraw-document', x: 0, y: 0, width: 1, height: 1, props: { snapshot } })
        }
      }, 450)
    }, { source: 'user', scope: 'document' })
    if (importReceipts && !imported.current) {
      imported.current = true
      const newDrops = drops.filter((drop) => !editor.getShape(createShapeId(`receipt-${drop.recordId}`)))
      const additions = newDrops.map((drop, index) => ({
        id: createShapeId(`receipt-${drop.recordId}`),
        type: 'note' as const,
        x: 120 + (index % 3) * 330,
        y: 120 + Math.floor(index / 3) * 280,
        props: { richText: toRichText(`${drop.data.title}\n\n${drop.data.story}\n\n— ${drop.data.nickname}`), color: (index % 2 ? 'orange' : 'yellow') as 'orange' | 'yellow' },
      }))
      if (additions.length) {
        editor.createShapes(additions)
        editor.select(...additions.map((shape) => shape.id))
        editor.zoomToSelection({ animation: { duration: 250 } })
      }
      void (async () => {
        for (const [index, drop] of newDrops.entries()) {
          if (!drop.data.mediaUrl || !drop.data.mediaMime?.startsWith('image/')) continue
          try {
            const response = await fetch(drop.data.mediaUrl)
            if (!response.ok) continue
            const blob = await response.blob()
            const extension = drop.data.mediaMime.split('/')[1] || 'jpg'
            const file = new File([blob], `${drop.data.title}.${extension}`, { type: drop.data.mediaMime })
            await editor.putExternalContent({ type: 'files', files: [file], point: { x: 160 + (index % 3) * 330, y: 300 + Math.floor(index / 3) * 280 } })
          } catch { /* Keep the receipt note if the remote image cannot be fetched. */ }
        }
        editor.selectNone()
        editor.zoomToFit({ animation: { duration: 250 } })
        onImported()
      })()
    }
  }

  return <div className={`tldraw-lore-page ${expanded ? 'is-expanded' : ''}`}>
    <header className="tldraw-case-header"><div><span>CASE FILE · {space.visibility === 'public' ? 'PUBLIC' : 'PRIVATE'}</span><h1>{space.title}</h1></div><div className="case-actions"><select value={spaceId} onChange={(event) => onSpace(event.target.value)}>{spaces.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select><button className="fullscreen-arrow" onClick={() => setExpanded((value) => !value)} aria-label={expanded ? 'Exit fullscreen workspace' : 'Open fullscreen workspace'} title={expanded ? 'Exit fullscreen' : 'Fullscreen'}>{expanded ? '↙' : '↗'}</button></div></header>
    <section className="tldraw-sheet" aria-label="Expandable collaborative lore canvas">
      <Tldraw onMount={mountEditor} autoFocus />
    </section>
  </div>
}
