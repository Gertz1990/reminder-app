import { useEffect, useState } from 'react'

const STORAGE_KEY = 'reminder_app_items_v1'

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to parse reminders from localStorage', e)
    return []
  }
}

function saveItems(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch (e) {
    console.error('Failed to save reminders to localStorage', e)
  }
}

function formatDateInput(dt) {
  if (!dt) return ''
  const d = new Date(dt)
  return d.toLocaleString()
}

export default function ReminderApp() {
  const [items, setItems] = useState(() => loadItems())
  const [text, setText] = useState('')
  const [date, setDate] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    saveItems(items)
  }, [items])

  function addItem(e) {
    e?.preventDefault()
    setError('')
    const trimmed = text.trim()
    if (!trimmed) {
      setError('Текст напоминания не может быть пустым')
      return
    }
    const newItem = {
      id: Date.now() + Math.random().toString(36).slice(2, 9),
      text: trimmed,
      when: date || null,
      done: false,
    }
    setItems((s) => [newItem, ...s])
    setText('')
    setDate('')
  }

  function removeItem(id) {
    setItems((s) => s.filter((it) => it.id !== id))
  }

  function toggleDone(id) {
    setItems((s) => s.map((it) => it.id === id ? { ...it, done: !it.done } : it))
  }

  return (
    <div className="reminder-app">
      <form className="reminder-form" onSubmit={addItem}>
        <input
          className="input-text"
          placeholder="Что нужно сделать..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <input
          className="input-date"
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button className="btn-add" type="submit">Добавить</button>
      </form>

      {error && <div className="error">{error}</div>}

      <div className="reminder-list">
        {items.length === 0 && <div className="empty">Нет напоминаний — добавьте первое.</div>}
        {items.map((it) => (
          <div key={it.id} className={`reminder-item ${it.done ? 'done' : ''}`}>
            <div className="left">
              <input type="checkbox" checked={it.done} onChange={() => toggleDone(it.id)} />
            </div>
            <div className="center">
              <div className="text">{it.text}</div>
              <div className="meta">{it.when ? formatDateInput(it.when) : '—'}</div>
            </div>
            <div className="right">
              <button className="btn-delete" onClick={() => removeItem(it.id)}>Удалить</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
