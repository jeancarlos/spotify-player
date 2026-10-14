import './index.css'
import '@/lib/i18n'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { cleanupLegacyStorage } from '@/utils/legacyCleanup'

cleanupLegacyStorage()

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
