import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="min-w-80 font-sans text-text antialiased selection:bg-accent selection:text-white bg-bg bg-[radial-gradient(circle_at_top_right,rgb(15_118_110/0.08),transparent_28rem)]">
      <App />
    </div>
  </StrictMode>,
)
