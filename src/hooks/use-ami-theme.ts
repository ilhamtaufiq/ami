import { useCallback, useEffect, useState } from 'react'

export type AmiTheme = 'dark' | 'light'

const KEY = 'ami-theme'

function initial(): AmiTheme {
  const saved = localStorage.getItem(KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return 'dark'
}

export function useAmiTheme() {
  const [theme, setTheme] = useState<AmiTheme>(initial)

  useEffect(() => {
    document.documentElement.dataset.amiTheme = theme
    localStorage.setItem(KEY, theme)
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, toggle }
}
