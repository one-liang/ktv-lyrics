import { useEffect, useState } from 'react'
import Home from './Home'
import SongRoute from './SongRoute'

type Route = { name: 'home' } | { name: 'song'; id: string }

function parseHash(): Route {
  const m = location.hash.match(/^#\/song\/([A-Za-z0-9_-]{6,20})/)
  return m ? { name: 'song', id: m[1] } : { name: 'home' }
}

export function go(path: string) {
  location.hash = path
}

export default function App() {
  const [route, setRoute] = useState<Route>(parseHash)

  useEffect(() => {
    const onHash = () => setRoute(parseHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return route.name === 'song' ? <SongRoute key={route.id} id={route.id} /> : <Home />
}
