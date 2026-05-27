import { ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'
import BinnenboomMark from './BinnenboomMark.jsx'

export default function Progress({
  pattern,
  startDate,
  checkins,
  daysCompleted,
  canOpenCard,
  onBack,
  onOpenCard,
  onCheckIn,
  todayDone,
}) {
  // Build 21-day grid
  const days = []
  for (let i = 0; i < 21; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const key = `${yyyy}-${mm}-${dd}`
    const entry = checkins.find((c) => c.date === key)
    const isToday = key === todayKey()
    const isPast = new Date(key + 'T23:59:59') < new Date()
    days.push({ key, entry, isToday, isPast, index: i + 1, date: d })
  }

  const motivational = pickMotivational(daysCompleted)

  return (
    <div className="mx-auto max-w-xl px-5 pt-8 pb-24">
      <header className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="btn-ghost">
          <ArrowLeft size={16} />
          Terug
        </button>
        <div className="flex items-center gap-2 text-sage-700">
          <BinnenboomMark size={24} className="text-sage-600" />
          <span className="font-serif text-lg">Binnenboom</span>
        </div>
      </header>

      <p className="text-xs uppercase tracking-[0.16em] text-ink-500 mb-2">
        Jouw patroon
      </p>
      <p className="font-serif text-xl text-ink-900 mb-8 leading-snug">
        {pattern}
      </p>

      <div className="card p-5 mb-6">
        <div className="flex items-baseline justify-between mb-1">
          <h2 className="font-serif text-2xl text-ink-900">
            Dag {Math.min(daysCompleted + (todayDone ? 0 : 1), 21)} van 21
          </h2>
          <span className="text-sm text-ink-500">{daysCompleted} ingevuld</span>
        </div>
        <p className="text-sm text-ink-700 leading-relaxed">{motivational}</p>
      </div>

      <div className="card p-5 mb-6">
        <p className="text-xs uppercase tracking-[0.16em] text-ink-500 mb-4">
          Kalender
        </p>
        <div className="grid grid-cols-7 gap-2">
          {days.map((d) => (
            <DayCell key={d.key} day={d} />
          ))}
        </div>
        <Legend />
      </div>

      <div className="flex flex-col gap-3">
        {!todayDone && (
          <button onClick={onCheckIn} className="btn-primary">
            Vul vandaag in
            <ArrowRight size={18} />
          </button>
        )}
        {todayDone && (
          <div className="text-center text-sm text-sage-700 flex items-center justify-center gap-2">
            <CheckCircle2 size={16} />
            Vandaag is ingevuld
          </div>
        )}
        {canOpenCard && (
          <button onClick={onOpenCard} className="btn-secondary">
            Bekijk je patroonkaart
          </button>
        )}
      </div>
    </div>
  )
}

function DayCell({ day }) {
  const filled = !!day.entry
  const triggered = day.entry?.triggered
  let cls = 'aspect-square rounded-xl flex flex-col items-center justify-center text-xs '

  if (filled) {
    cls += triggered
      ? 'bg-terracotta-200 text-terracotta-600 border border-terracotta-300'
      : 'bg-sage-100 text-sage-700 border border-sage-200'
  } else if (day.isToday) {
    cls += 'bg-beige-100 text-ink-900 border-2 border-sage-400'
  } else if (day.isPast) {
    cls += 'bg-beige-50 text-ink-300 border border-beige-200'
  } else {
    cls += 'bg-beige-50/60 text-ink-300 border border-dashed border-beige-200'
  }

  return (
    <div className={cls}>
      <span className="font-medium text-[13px]">{day.index}</span>
    </div>
  )
}

function Legend() {
  return (
    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-ink-500">
      <Dot color="bg-terracotta-200 border-terracotta-300" label="Patroon speelde" />
      <Dot color="bg-sage-100 border-sage-200" label="Rust" />
      <Dot color="bg-beige-100 border-sage-400" label="Vandaag" />
    </div>
  )
}

function Dot({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-3 h-3 rounded border ${color}`} />
      {label}
    </span>
  )
}

function todayKey() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function pickMotivational(days) {
  if (days === 0) {
    return 'Vandaag is dag een. Een patroon wordt zichtbaar als je het uitnodigt om gezien te worden.'
  }
  if (days < 4) {
    return 'Mooi, je bent begonnen. De eerste dagen voelen vaak nog onwennig, dat hoort erbij.'
  }
  if (days < 8) {
    return 'Je bent op weg. Soms zie je nog niks bijzonders, soms wel. Beide is goed.'
  }
  if (days < 14) {
    return 'Halverwege. Vaak begint er nu iets te dagen, een herhaling, een lichamelijke plek, een leeftijd.'
  }
  if (days < 20) {
    return 'Bijna een complete kaart. Blijf even dichtbij, juist nu kan er iets duidelijk worden.'
  }
  if (days < 21) {
    return 'Nog een dag te gaan. Mooi werk dat je dit voor jezelf hebt gedaan.'
  }
  return 'Je hebt alle 21 dagen ingevuld. Je patroonkaart staat voor je klaar.'
}
