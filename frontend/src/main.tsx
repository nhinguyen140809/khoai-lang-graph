import './app/styles.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './app/App'

async function enableMocking() {
  if (import.meta.env.VITE_API_MOCKING !== 'enabled') return
  const { worker } = await import('./mocks/msw-browser.setup')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

const rootElement = document.getElementById('root')
if (rootElement === null) throw new Error('Root element #root not found')

void enableMocking().then(() => {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
