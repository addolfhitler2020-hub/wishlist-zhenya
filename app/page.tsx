'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Gift = {
  id: string
  name: string
  description: string
  emoji: string
  color: number
  sort_order: number
  claimed_by: string | null
  claimed_at: string | null
}

const COLORS = [
  'linear-gradient(135deg,#7fd4f0,#1e88c7)',
  'linear-gradient(135deg,#ff8fb3,#c2185b)',
  'linear-gradient(135deg,#ffd166,#e67e22)',
  'linear-gradient(135deg,#fff59d,#f9a825)',
  'linear-gradient(135deg,#ce93d8,#7b1fa2)',
  'linear-gradient(135deg,#ffb877,#d35400)',
  'linear-gradient(135deg,#a5d6a7,#2e7d32)',
  'linear-gradient(135deg,#f48fb1,#ad1457)'
]

function pluralize(n: number, one: string, few: string, many: string) {
  const m10 = n % 10, m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few
  return many
}

export default function Home() {
  const [gifts, setGifts] = useState<Gift[]>([])
  const [loading, setLoading] = useState(true)
  const [modalGift, setModalGift] = useState<Gift | null>(null)
  const [name, setName] = useState('')
  const [toast, setToast] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadGifts()
    const ch = supabase
      .channel('gifts-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gifts' }, loadGifts)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  async function loadGifts() {
    const { data } = await supabase
      .from('gifts')
      .select('*')
      .order('sort_order', { ascending: true })
    if (data) setGifts(data)
    setLoading(false)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2600)
  }

  async function claimGift() {
    if (!name.trim() || !modalGift) return
    const { error } = await supabase
      .from('gifts')
      .update({ claimed_by: name.trim(), claimed_at: new Date().toISOString() })
      .eq('id', modalGift.id)
      .is('claimed_by', null)

    if (error) {
      showToast('Подарок уже занят 😔')
    } else {
      showToast(`«${modalGift.name}» теперь твой, ${name.trim()}! 🎉`)
      showConfetti()
    }
    setModalGift(null)
    setName('')
    loadGifts()
  }

  function showConfetti() {
    const palette = ['#ff6b9d','#d6336c','#ba68c8','#ffd166','#7fd4f0','#fff59d','#ff8fb3']
    for (let i = 0; i < 48; i++) {
      const el = document.createElement('div')
      el.className = 'confetti'
      const size = 6 + Math.random() * 9
      el.style.width = size + 'px'
      el.style.height = size + 'px'
      el.style.background = palette[Math.floor(Math.random() * palette.length)]
      el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px'
      el.style.left = '50%'
      el.style.top = '50%'
      document.body.appendChild(el)
      const a = Math.random() * Math.PI * 2
      const v = 6 + Math.random() * 10
      let vx = Math.cos(a) * v, vy = Math.sin(a) * v - 9, x = 0, y = 0, r = 0, o = 1
      ;(function tick() {
        x += vx; y += vy; vy += 0.55; r += 9; o -= 0.011
        el.style.transform = `translate(${x}px,${y}px) rotate(${r}deg)`
        el.style.opacity = String(o)
        if (o > 0) requestAnimationFrame(tick); else el.remove()
      })()
    }
  }

  if (loading) {
    return (
      <div className="app">
        <div className="hero"><h1>Загрузка...</h1></div>
      </div>
    )
  }

  const total = gifts.length
  const taken = gifts.filter(g => g.claimed_by).length
  const percent = total ? Math.round(taken / total * 100) : 0
  const word = pluralize(total, 'заветное желание', 'заветных желания', 'заветных желаний')
  const verb = total === 1 ? 'собрано' : 'собраны'

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
        <div className="sparkle s1">✦</div>
        <div className="sparkle s2">✧</div>
        <div className="sparkle s3">✦</div>
        <div className="sparkle s4">✧</div>
        <div className="sparkle s5">✦</div>
        <div className="sparkle s6">✧</div>
        <div className="bg-veil"></div>
      </div>

      <div className="app">
        <div className="topbar">
          <div>
            <div className="brand"><span className="brand-dot"></span> Wishlist</div>
            <span className="brand-sub">by IGORREZNIK</span>
          </div>
          <div className="topbar-actions">
            <span className="topbar-hint">для Жени · 2026</span>
            <a href="/login" className="lock-mini">🔒</a>
          </div>
        </div>

        <div className="hero">
          <div className="hero-tag"><span className="dot"></span> Персональный список желаний</div>
          <h1>Подари Жене<br /><em>что-то особенное</em></h1>
          <p className="hero-lead">
            Здесь {verb} <b>{total} {word}</b>. Выбери одно, которое откликается именно тебе,
            и оставь своё имя — так никто не подарит то же самое.
          </p>
        </div>

        <div className="progress-wrap">
          <div className="progress">
            <div className="progress-top">
              <span>Уже занято подарков</span>
              <span><b>{taken}</b> / {total}</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${percent}%` }}></div>
            </div>
          </div>
        </div>

        <div className="grid">
          {gifts.map((g, i) => {
            const grad = COLORS[g.color % COLORS.length]
            const claimed = !!g.claimed_by
            const num = String(i + 1).padStart(2, '0')
            return (
              <div
                key={g.id}
                className={`card ${claimed ? 'claimed' : ''}`}
                style={{ animationDelay: `${0.08 * i + 0.2}s` }}
                onClick={() => !claimed && setModalGift(g)}
              >
                <div className="card-index">{num}</div>
                <div className="icon" style={{ background: grad }}>{g.emoji}</div>
                <div className="card-title">{g.name}</div>
                <div className="card-desc">{g.description}</div>
                {claimed
                  ? <span className="card-status">Занято</span>
                  : <span className="card-status free">Можно выбрать</span>}
              </div>
            )
          })}
        </div>

        <div className="how">
          <div className="how-label">Как это работает</div>
          <h2>Просто, честно, <em>по-дружески</em></h2>
          <div className="how-grid">
            <div className="how-step">
              <div className="how-num">1</div>
              <h3>Выбери желание</h3>
              <p>Тапни на карточку, которая больше всего откликается</p>
            </div>
            <div className="how-step">
              <div className="how-num">2</div>
              <h3>Оставь имя</h3>
              <p>Одно короткое поле — и подарок закреплён за тобой</p>
            </div>
            <div className="how-step">
              <div className="how-num">3</div>
              <h3>Никаких дублей</h3>
              <p>Каждое желание дарится один раз. Всё честно</p>
            </div>
          </div>
        </div>

        <div className="footer">
          Сделано с <span className="heart">♥</span> для Жени
          <div className="footer-sign">by <b>IGORREZNIK</b></div>
        </div>
      </div>

      {modalGift && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setModalGift(null) }}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-icon" style={{ background: COLORS[modalGift.color % COLORS.length] }}>
              {modalGift.emoji}
            </div>
            <h2>{modalGift.name}</h2>
            <p className="sheet-desc">{modalGift.description}</p>
            <input
              className="field"
              type="text"
              placeholder="Как тебя зовут?"
              maxLength={30}
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) claimGift() }}
            />
            <div className="row">
              <button className="btn btn-ghost" onClick={() => { setModalGift(null); setName('') }}>Отмена</button>
              <button
                className="btn btn-primary"
                disabled={!name.trim()}
                onClick={claimGift}
              >
                Забрать желание
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast show">{toast}</div>}
    </>
  )
}
