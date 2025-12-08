'use client'

import { useEffect } from 'react'

export function ChatwootWidget() {
  useEffect(() => {
    // Add Chatwoot Settings
    ;(window as any).chatwootSettings = {
      hideMessageBubble: false,
      position: 'right',
      locale: 'en',
      type: 'standard'
    }

    // Add Chatwoot SDK script
    const script = document.createElement('script')
    script.src = 'https://chatwoot.agistaffers.com/packs/js/sdk.js'
    script.async = true
    script.defer = true

    script.onload = () => {
      if ((window as any).chatwootSDK) {
        ;(window as any).chatwootSDK.run({
          websiteToken: 'FH4wUFPP9u3AGPrH83PguCmr',
          baseUrl: 'https://chatwoot.agistaffers.com'
        })
      }
    }

    document.body.appendChild(script)

    return () => {
      // Cleanup on unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  return null
}
