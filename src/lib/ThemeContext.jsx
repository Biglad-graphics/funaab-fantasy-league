import { createContext, useContext, useEffect, useState } from 'react'

export const DARK = {
  bg: '#080C0A',
  surface: '#0D1410',
  card: '#111A13',
  border: '#1E2E20',
  text: '#E8F5E9',
  muted: '#5A7A5E',
  green: '#00E676',
  gold: '#FFD700',
  red: '#EF9A9A',
  blue: '#64B5F6',
  navBg: 'rgba(8,12,10,0.97)',
  menuBg: 'rgba(8,12,10,0.99)',
  bgRgb: '8,12,10',
  borderRgb: '30,46,32',
  greenRgb: '0,230,118',
  goldRgb: '255,215,0',
  redRgb: '239,154,154',
  blueRgb: '100,181,246',
  mutedRgb: '90,122,94',
}

export const LIGHT = {
  bg: '#F0F4F1',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  border: '#D4E4D8',
  text: '#0D1F12',
  muted: '#5A7A5E',
  green: '#00A854',
  gold: '#C8970A',
  red: '#C0392B',
  blue: '#2471A3',
  navBg: 'rgba(240,244,241,0.97)',
  menuBg: 'rgba(240,244,241,0.99)',
  bgRgb: '240,244,241',
  borderRgb: '212,228,216',
  greenRgb: '0,168,84',
  goldRgb: '200,151,10',
  redRgb: '192,57,43',
  blueRgb: '36,113,163',
  mutedRgb: '90,122,94',
}

const ThemeCtx = createContext({ theme: 'dark', c: DARK, toggle: () => {} })

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('theme') || 'dark' } catch { return 'dark' }
  })

  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
    try { localStorage.setItem('theme', theme) } catch {}
  }, [theme])

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  return (
    <ThemeCtx.Provider value={{ theme, c: theme === 'dark' ? DARK : LIGHT, toggle }}>
      {children}
    </ThemeCtx.Provider>
  )
}

export const useTheme = () => useContext(ThemeCtx)
