'use client'

import { createContext, useContext, useState } from 'react'

const PageContext = createContext(null)

export function PageProvider({ children }) {
  const [title, setTitle]       = useState('')
  const [subtitle, setSubtitle] = useState('')
  return (
    <PageContext.Provider value={{ title, setTitle, subtitle, setSubtitle }}>
      {children}
    </PageContext.Provider>
  )
}

/* ---- Hook for layout to read current title/subtitle ---- */
export function usePageMeta() {
  return useContext(PageContext)
}

/* ---- Hook for pages to set their title + subtitle ---- */
import { useEffect } from 'react'

export function usePageTitle(title, subtitle = '') {
  const ctx = useContext(PageContext)
  useEffect(() => {
    ctx?.setTitle(title)
    ctx?.setSubtitle(subtitle)
  }, [title, subtitle])
}
