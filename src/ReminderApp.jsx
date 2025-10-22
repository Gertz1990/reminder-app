import { useEffect, useRef, useState } from 'react'

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
  const [filter, setFilter] = useState('all') // all | active | done
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [editDate, setEditDate] = useState('')
  const fileInputRef = useRef(null)

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

  function startEdit(it) {
    setEditingId(it.id)
    setEditText(it.text)
    setEditDate(it.when || '')
  }

  function saveEdit(id) {
    const trimmed = editText.trim()
    if (!trimmed) {
      setError('Текст напоминания не может быть пустым')
      return
    }
    setItems((s) => s.map((it) => it.id === id ? { ...it, text: trimmed, when: editDate || null } : it))
    setEditingId(null)
    setEditText('')
    setEditDate('')
    setError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditText('')
    setEditDate('')
    setError('')
  }

  function removeItem(id) {
    setItems((s) => s.filter((it) => it.id !== id))
  }

  function toggleDone(id) {
    setItems((s) => s.map((it) => it.id === id ? { ...it, done: !it.done } : it))
  }

  function isOverdue(it) {
    if (!it.when) return false
    if (it.done) return false
    try {
      const d = new Date(it.when)
      return d.getTime() < Date.now()
    } catch (e) {
      return false
    }
  }

  const filtered = items.filter((it) => {
    if (filter === 'all') return true
    if (filter === 'active') return !it.done
    if (filter === 'done') return it.done
    return true
  })

  function exportJSON() {
    try {
      const data = JSON.stringify(items, null, 2)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reminders-${new Date().toISOString()}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      setError('Не удалось экспортировать данные')
    }
  }

  function importFromFile(file) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result)
        if (!Array.isArray(parsed)) throw new Error('JSON должен быть массивом')
        // Basic validation: ensure id and text exist
        const valid = parsed.every((it) => it && typeof it.text === 'string')
        if (!valid) throw new Error('Неверный формат файла')
        setItems(parsed)
      } catch (e) {
        console.error(e)
        setError('Не удалось импортировать: неверный формат')
      }
    }
    reader.onerror = () => setError('Ошибка чтения файла')
    reader.readAsText(file)
  }

  function triggerImport() {
    fileInputRef.current?.click()
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

      <div style={{display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12}}>
        <div className="filters">
          <button className={`filter-btn ${filter==='all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Все</button>
          <button className={`filter-btn ${filter==='active' ? 'active' : ''}`} onClick={() => setFilter('active')}>Активные</button>
          <button className={`filter-btn ${filter==='done' ? 'active' : ''}`} onClick={() => setFilter('done')}>Выполненные</button>
        </div>
        <div style={{marginLeft: 'auto', display: 'flex', gap: 8}}>
          <button className="filter-btn" onClick={exportJSON}>Экспорт</button>
          <button className="filter-btn" onClick={triggerImport}>Импорт</button>
          <input ref={fileInputRef} type="file" accept="application/json" style={{display:'none'}} onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) importFromFile(f)
            e.target.value = ''
          }} />
        </div>
      </div>

      <div className="reminder-list">
        {items.length === 0 && <div className="empty">Нет напоминаний — добавьте первое.</div>}
        {filtered.map((it) => (
          <div key={it.id} className={`reminder-item ${it.done ? 'done' : ''} ${isOverdue(it) ? 'overdue' : ''}`}>
            <div className="left">
              <input type="checkbox" checked={it.done} onChange={() => toggleDone(it.id)} />
            </div>
            <div className="center">
              {editingId === it.id ? (
                <div>
                  <input className="input-text" value={editText} onChange={(e) => setEditText(e.target.value)} />
                  <input className="input-date" type="datetime-local" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                </div>
              ) : (
                <>
                  <div className="text">{it.text}</div>
                  <div className="meta">{it.when ? formatDateInput(it.when) : '—'}</div>
                </>
              )}
            </div>
            <div className="right">
              {editingId === it.id ? (
                <>
                  <button className="filter-btn" onClick={() => saveEdit(it.id)}>Сохранить</button>
                  <button className="filter-btn" onClick={cancelEdit}>Отмена</button>
                </>
              ) : (
                <>
                  <button className="filter-btn" onClick={() => startEdit(it)}>Редактировать</button>
                  <button className="btn-delete" onClick={() => removeItem(it.id)}>Удалить</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
