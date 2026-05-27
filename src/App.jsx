import { useEffect, useMemo, useState } from 'react'
import Welcome from './components/Welcome.jsx'
import CheckIn from './components/CheckIn.jsx'
import Progress from './components/Progress.jsx'
import PatternCard from './components/PatternCard.jsx'
import { getJSON, setJSON, getAllCheckins, clearAll } from './storage.js'
import { todayKey, dateKey, diffDays } from './utils/dates.js'
import { generateDemoCheckins } from './utils/analyze.js'

const SCREENS = {
  WELCOME: 'welcome',
  CHECKIN: 'checkin',
  PROGRESS: 'progress',
  CARD: 'card',
  DEMO: 'demo',
}

export default function App() {
  const [pattern, setPattern] = useState('')
  const [startDate, setStartDate] = useState(null)
  const [checkins, setCheckins] = useState([])
  const [screen, setScreen] = useState(SCREENS.WELCOME)
  const [loaded, setLoaded] = useState(false)

  // Initial load
  useEffect(() => {
    const desc = getJSON('patroon:beschrijving', '')
    const start = getJSON('patroon:startdatum', null)
    const all = getAllCheckins()
    setPattern(desc || '')
    setStartDate(start)
    setCheckins(all)

    if (desc && start) {
      const today = todayKey()
      const todayDone = all.some((c) => c.date === today)
      const daysCompleted = all.length
      if (daysCompleted >= 21) {
        setScreen(SCREENS.CARD)
      } else if (todayDone) {
        setScreen(SCREENS.PROGRESS)
      } else {
        setScreen(SCREENS.CHECKIN)
      }
    }
    setLoaded(true)
  }, [])

  const daysCompleted = checkins.length
  const today = todayKey()
  const todayDone = checkins.some((c) => c.date === today)
  const todayEntry = checkins.find((c) => c.date === today)
  const canOpenCard = daysCompleted >= 21

  const dayNumber = useMemo(() => {
    if (!startDate) return 1
    return Math.min(21, diffDays(new Date(), new Date(startDate)) + 1)
  }, [startDate, today])

  function handleStart(desc) {
    const start = dateKey(new Date())
    setJSON('patroon:beschrijving', desc)
    setJSON('patroon:startdatum', start)
    setPattern(desc)
    setStartDate(start)
    setScreen(SCREENS.CHECKIN)
  }

  function handleSaveCheckin(payload) {
    const key = today
    setJSON(`checkin:${key}`, payload)
    setCheckins(getAllCheckins())
  }

  function handleReset() {
    if (typeof window !== 'undefined' && !window.confirm('Weet je zeker dat je opnieuw wil beginnen? Je huidige patroonkaart wordt gewist.')) {
      return
    }
    clearAll()
    setPattern('')
    setStartDate(null)
    setCheckins([])
    setScreen(SCREENS.WELCOME)
  }

  if (!loaded) {
    return <div className="min-h-dvh bg-paper" />
  }

  if (screen === SCREENS.DEMO) {
    return (
      <div className="min-h-dvh bg-paper">
        <PatternCard
          pattern="Ik trek me terug bij conflict"
          checkins={generateDemoCheckins()}
          isDemo
          onBack={() => setScreen(SCREENS.WELCOME)}
        />
      </div>
    )
  }

  if (screen === SCREENS.WELCOME || !pattern || !startDate) {
    return (
      <div className="min-h-dvh bg-paper">
        <Welcome
          initialPattern={pattern}
          onStart={handleStart}
          onDemo={() => setScreen(SCREENS.DEMO)}
        />
      </div>
    )
  }

  if (screen === SCREENS.CARD) {
    return (
      <div className="min-h-dvh bg-paper">
        <PatternCard
          pattern={pattern}
          checkins={checkins}
          onBack={() => setScreen(SCREENS.PROGRESS)}
        />
        <ResetCorner onReset={handleReset} />
      </div>
    )
  }

  if (screen === SCREENS.PROGRESS) {
    return (
      <div className="min-h-dvh bg-paper">
        <Progress
          pattern={pattern}
          startDate={startDate}
          checkins={checkins}
          daysCompleted={daysCompleted}
          canOpenCard={canOpenCard}
          todayDone={todayDone}
          onBack={() => setScreen(SCREENS.WELCOME)}
          onCheckIn={() => setScreen(SCREENS.CHECKIN)}
          onOpenCard={() => setScreen(SCREENS.CARD)}
        />
        <ResetCorner onReset={handleReset} />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-paper">
      <CheckIn
        pattern={pattern}
        dayNumber={dayNumber}
        todayDate={formatDateLong(new Date())}
        existing={todayEntry}
        onSave={handleSaveCheckin}
        onSkipToProgress={() => setScreen(SCREENS.PROGRESS)}
        onOpenCard={() => setScreen(SCREENS.CARD)}
        canOpenCard={canOpenCard}
      />
      <ResetCorner onReset={handleReset} />
    </div>
  )
}

function ResetCorner({ onReset }) {
  return (
    <button
      type="button"
      onClick={onReset}
      className="fixed bottom-4 right-4 text-[11px] text-ink-300 hover:text-ink-500 transition px-3 py-1.5 rounded-full bg-beige-50/80 border border-beige-200"
      aria-label="Begin opnieuw"
    >
      opnieuw beginnen
    </button>
  )
}

function formatDateLong(d) {
  const days = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag']
  const months = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december']
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`
}
