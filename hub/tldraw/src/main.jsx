import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <div
      style={{
        position: 'fixed',
        inset: 0,
        fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif',
      }}
    >
      <Tldraw />
    </div>
  </StrictMode>,
)
