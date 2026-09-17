'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Неверный email или пароль')
      setLoading(false)
    } else {
      router.push('/admin')
      router.refresh()
    }
  }

  return (
    <>
      <div className="bg-layer">
        <div className="bg-base"></div>
        <div className="bg-grid"></div>
        <div className="bg-grain"></div>
        <div className="halo h1"></div>
        <div className="halo h2"></div>
        <div className="halo h3"></div>
        <div className="halo h4"></div>
        <div className="bg-veil"></div>
      </div>

      <div className="app">
        <div className="topbar">
          <div>
            <div className="brand"><span className="brand-dot"></span> Wishlist</div>
            <span className="brand-sub">by IGORREZNIK</span>
          </div>
          <a href="/" className="lock-mini">✕</a>
        </div>

        <div className="sheet" style={{ marginTop: 60 }}>
          <div className="lock-badge">🔐</div>
          <h2>Вход для админа</h2>
          <p className="sheet-desc">Введите email и пароль</p>
          <form onSubmit={handleLogin}>
            {error && <div className="err">{error}</div>}
            <input
              className="field"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="field"
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="row">
              <a href="/" className="btn btn-ghost">Отмена</a>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? '...' : 'Войти'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}