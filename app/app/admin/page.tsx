'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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

const EMOJI = ['🎁','🏖️','💖','⚡','🐣','🐱','🍺','🌸','💎','📱','💻','🚗','🏠','🎮','👗','💄','✈️','🌍','🎂','💐','🍫','🎧','⌚','🛋️','🎀','🦄','🍕','☕']

export default function AdminPage() {
  const [gifts, setGifts] = useState<Gift[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formEmoji, setFormEmoji] = useState('🎁')
  const [formColor, setFormColor] = useState(0)
  const [toast, setToast] = useState('')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    load()
    const ch = supabase
      .channel('admin-gifts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gifts' }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  async function load() {
    const { data } = await supabase.from('gifts').select('*').order('sort_order', { ascending: true })
    if (data) setGifts(data)
    setLoading(false)
  }

  function showMsg(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2600)
  }

  function openAdd() {
    setEditId(null)
    setFormName('')
    setFormDesc('')
    setFormEmoji('🎁')
    setFormColor(0)
    setShowForm(true)
  }

  function openEdit(g: Gift) {
    setEditId(g.id)
    setFormName(g.name)
    setFormDesc(g.description)
    setFormEmoji(g.emoji)
    setFormColor(g.color)
    setShowForm(true)
  }

  async function saveGift() {
    if (!formName.trim()) return
    if (editId) {
      await supabase.from('gifts').update({
        name: formName.trim(),
        description: formDesc.trim() || 'Особенное желание',
        emoji: formEmoji,
        color: formColor,
      }).eq('id', editId)
      showMsg('Обновлено ✏️')
    } else {
      const maxOrder = gifts.reduce((m, g) => Math.max(m, g.sort_order), 0)
      await supabase.from('gifts').insert({
        name: formName.trim(),
        description: formDesc.trim() || 'Особенное желание',
        emoji: formEmoji,
        color: formColor,
        sort_order: maxOrder + 1,
      })
      showMsg(`«${formName.trim()}» добавлен 🎉`)
    }
    setShowForm(false)
    load()
  }

  async function release(id: string, name: string) {
    await supabase.from('gifts').update({ claimed_by: null, claimed_at: null }).eq('id', id)
    showMsg(`«${name}» снова свободен ✨`)
    load()
  }

  async function removeGift(id: string, name: string) {
    if (!confirm(`Удалить «${name}»?`)) return
    await supabase.from('gifts').delete().eq('id', id)
    showMsg('Подарок удалён')
    load()
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
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
  const free = total - taken

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
        <div className="admin-hero">
          <div>
            <h1>Панель <em>админа</em></h1>
            <p>Управляй списком и следи, кто что выбрал</p>
          </div>
          <a href="/" className="icon-btn">←</a>
        </div>

        <div className="stats">
          <div className="stat"><div className="stat-num accent">{taken}</div><div className="stat-label">Занято</div></div>
          <div className="stat"><div className="stat-num">{free}</div><div className="stat-label">Свободно</div></div>
          <div className="stat"><div className="stat-num">{total}</div><div className="stat-label">Всего</div></div>
        </div>

        <button className="add-gift" onClick={openAdd}>
          <span style={{ fontSize: 18 }}>＋</span> Добавить подарок
        </button>

        <div className="admin-list">
          {gifts.map((g, i) => (
            <div key={g.id} className="admin-item" style={{ animation: `cardEnter 0.5s cubic-bezier(0.22,1,0.36,1) ${0.05 * i}s backwards` }}>
              <div className="icon-mini" style={{ background: COLORS[g.color % COLORS.length] }}>{g.emoji}</div>
              <div className="admin-body">
                <div className="title">{g.name}</div>
                <div className={`meta ${g.claimed_by ? 'taken' : ''}`}>
                  {g.claimed_by
                    ? `${g.claimed_by} · ${new Date(g.claimed_at!).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`
                    : 'Свободно'}
                </div>
              </div>
              <div className="actions">
                {g.claimed_by && (
                  <button className="action rel" title="Снять выбор" onClick={() => release(g.id, g.name)}>🔓</button>
                )}
                <button className="action edit" title="Редактировать" onClick={() => openEdit(g)}>✏️</button>
                <button className="action del" title="Удалить" onClick={() => removeGift(g.id, g.name)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button className="btn btn-ghost" style={{ padding: '12px 24px', maxWidth: 200, margin: '0 auto' }} onClick={logout}>
            Выйти
          </button>
        </div>

        <div className="admin-sign">Wishlist · <b>by IGORREZNIK</b> · 2026</div>
      </div>

      {showForm && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h2>{editId ? 'Редактировать' : 'Новый подарок'}</h2>
            <p className="sheet-desc">Выбери иконку, цвет и заполни описание</p>

            <div className="label">Иконка</div>
            <div className="emoji-grid">
              {EMOJI.map((e) => (
                <button
                  key={e}
                  type="button"
                  className={`emoji-pick ${e === formEmoji ? 'on' : ''}`}
                  onClick={() => setFormEmoji(e)}
                >{e}</button>
              ))}
            </div>

            <div className="label">Цвет</div>
            <div className="color-grid">
              {COLORS.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  className={`color-pick ${i === formColor ? 'on' : ''}`}
                  style={{ background: c }}
                  onClick={() => setFormColor(i)}
                />
              ))}
            </div>

            <input
              className="field"
              style={{ textAlign: 'left' }}
              type="text"
              placeholder="Название подарка"
              maxLength={40}
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />

            <textarea
              className="field"
              style={{ textAlign: 'left', minHeight: 80, resize: 'none', fontFamily: 'inherit', lineHeight: 1.5 }}
              placeholder="Короткое описание"
              maxLength={140}
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
            />

            <div className="row">
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Отмена</button>
              <button className="btn btn-primary" disabled={!formName.trim()} onClick={saveGift}>Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast show">{toast}</div>}
    </>
  )
}