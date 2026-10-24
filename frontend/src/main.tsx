import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { PhoneDemo } from './components/PhoneDemo.tsx'

const params = new URLSearchParams(window.location.search)
// Inside the phone preview, hide desktop scrollbars the way a real phone does.
if (params.has('embed')) document.documentElement.classList.add('embedded')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {params.get('view') === 'phone' ? <PhoneDemo /> : <App embedded={params.has('embed')} />}
  </StrictMode>,
)
