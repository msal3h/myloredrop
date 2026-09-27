import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { joinSpace } from '@/lib/join-space'

export default function JoinSpacePage() {
  const { code = '' } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    void joinSpace(code).then((spaceId) => navigate(`/space/${spaceId}`, { replace: true }))
  }, [code, navigate])

  return <div className="paper-message lore-page"><b>Opening your Lore Space…</b><Link to="/home">Enter the code manually</Link></div>
}
