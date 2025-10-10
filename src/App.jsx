import './App.css'
import ReminderApp from './ReminderApp'

function App() {
  return (
    <div className="app-root">
      <header className="app-header">
        <h1>Напоминания</h1>
        <p className="subtitle">Простое приложение для создания и управления напоминаниями (localStorage)</p>
      </header>
      <main>
        <ReminderApp />
      </main>
    </div>
  )
}

export default App
