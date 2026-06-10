import { useState } from 'react'
import { Check, ArrowRight, ArrowLeft, CalendarDays } from 'lucide-react'
import BinnenboomMark from './BinnenboomMark.jsx'

const BODY_OPTIONS = [
  { key: 'borst', label: 'Borst' },
  { key: 'buik', label: 'Buik' },
  { key: 'keel', label: 'Keel' },
  { key: 'hoofd', label: 'Hoofd' },
  { key: 'schouders', label: 'Schouders' },
  { key: 'anders', label: 'Anders' },
]

export default function CheckIn({
  pattern,
  dayNumber,
  todayDate,
  existing,
  onSave,
  onSkipToProgress,
  onOpenCard,
  canOpenCard,
}) {
  const [step, setStep] = useState(0)
  const [triggered, setTriggered] = useState(existing?.triggered ?? null)
  const [situation, setSituation] = useState(existing?.situation ?? '')
  const [body, setBody] = useState(existing?.body ?? '')
  const [age, setAge] = useState(existing?.age ?? 12)
  const [ageUnknown, setAgeUnknown] = useState(existing?.age === 'unknown')
  const [saved, setSaved] = useState(false)

  function choose(value) {
    setTriggered(value)
    if (value === false) {
      finalize({ triggered: false })
    } else {
      setStep(1)
    }
  }

  function finalize(override = {}) {
    const payload = {
      triggered: triggered ?? false,
      situation: situation.trim(),
      body,
      age: ageUnknown ? 'unknown' : Number(age),
      ...override,
    }
    if (payload.triggered === false) {
      payload.situation = ''
      payload.body = ''
      payload.age = null
    }
    onSave(payload)
    setSaved(true)
  }

  if (saved) {
    return (
      <div className="mx-auto max-w-xl px-5 pt-16 pb-24 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center mb-5">
          <Check size={26} />
        </div>
        <h1 className="font-serif text-3xl text-ink-900 mb-3">Bewaard</h1>
        <p className="text-ink-700 mb-8">
          Mooi dat je vandaag even stil hebt gestaan. Tot morgen.
        </p>
        <div className="flex flex-col gap-3 items-center">
          <button onClick={onSkipToProgress} className="btn-primary">
            Bekijk je voortgang
            <ArrowRight size={18} />
          </button>
          {canOpenCard && (
            <button onClick={onOpenCard} className="btn-ghost">
              Naar je patroonkaart
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-5 pt-8 pb-24">
      <header className="flex items-center justify-between text-ink-700 mb-8">
        <div className="flex items-center gap-2">
          <BinnenboomMark size={26} className="text-sage-600" />
          <span className="font-serif text-lg">Binnenboom</span>
        </div>
        <div className="text-xs text-ink-500 flex items-center gap-1.5">
          <CalendarDays size={14} />
          Dag {dayNumber} van 21
        </div>
      </header>

      <div className="mb-2 text-xs uppercase tracking-[0.16em] text-ink-500">
        Jouw patroon
      </div>
      <p className="font-serif text-2xl text-ink-900 leading-snug mb-8">
        {pattern}
      </p>

      {step === 0 && (
        <section>
          <h2 className="font-serif text-2xl text-ink-900 mb-6">
            Speelde je patroon vandaag?
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => choose(true)}
              className="rounded-2xl border border-beige-200 bg-white/70 hover:bg-terracotta-100/60 hover:border-terracotta-200 py-8 transition text-ink-900 font-medium"
            >
              Ja
            </button>
            <button
              onClick={() => choose(false)}
              className="rounded-2xl border border-beige-200 bg-white/70 hover:bg-sage-100 hover:border-sage-200 py-8 transition text-ink-900 font-medium"
            >
              Nee
            </button>
          </div>
          <p className="text-xs text-ink-500 mt-6 leading-relaxed">
            Een "nee" telt ook. Het is even waardevol om te zien wanneer je
            patroon stil bleef.
          </p>
        </section>
      )}

      {step === 1 && (
        <section>
          <h2 className="font-serif text-2xl text-ink-900 mb-5">
            Welke situatie triggerde het?
          </h2>
          <input
            type="text"
            value={situation}
            onChange={(e) => setSituation(e.target.value.slice(0, 100))}
            maxLength={100}
            placeholder="Bijvoorbeeld, vergadering met manager"
            className="field"
            autoFocus
          />
          <div className="text-xs text-ink-500 mt-2 mb-8">
            {situation.length}/100
          </div>
          <Nav onBack={() => setStep(0)} onNext={() => setStep(2)} disabled={situation.trim().length < 2} />
        </section>
      )}

      {step === 2 && (
        <section>
          <h2 className="font-serif text-2xl text-ink-900 mb-5">
            Waar voelde je het in je lichaam?
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-8">
            {BODY_OPTIONS.map((b) => (
              <button
                key={b.key}
                onClick={() => setBody(b.key)}
                className={`rounded-2xl border py-4 px-3 text-center transition text-ink-900 ${
                  body === b.key
                    ? 'bg-sage-100 border-sage-300'
                    : 'bg-white/70 border-beige-200 hover:bg-beige-100'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
          <Nav onBack={() => setStep(1)} onNext={() => setStep(3)} disabled={!body} />
        </section>
      )}

      {step === 3 && (
        <section>
          <h2 className="font-serif text-2xl text-ink-900 mb-2">
            Welke leeftijd voelde dit?
          </h2>
          <p className="text-sm text-ink-500 mb-7">
            Een gevoel kan jonger zijn dan je nu bent. Hoe oud voelde het van
            binnen?
          </p>

          {!ageUnknown && (
            <>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xs uppercase tracking-[0.16em] text-ink-500">
                  Leeftijd
                </span>
                <span className="font-serif text-3xl text-sage-700">
                  {age >= 25 ? 'Volwassen' : age}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full accent-sage-600"
              />
              <div className="flex justify-between text-xs text-ink-500 mt-1 mb-6">
                <span>0</span>
                <span>Volwassen</span>
              </div>
            </>
          )}

          <button
            type="button"
            onClick={() => setAgeUnknown((v) => !v)}
            className={`w-full rounded-2xl border py-3 px-4 transition ${
              ageUnknown
                ? 'bg-sage-100 border-sage-300 text-ink-900'
                : 'bg-white/70 border-beige-200 text-ink-700 hover:bg-beige-100'
            }`}
          >
            Weet ik niet
          </button>

          <div className="mt-8">
            <Nav
              onBack={() => setStep(2)}
              onNext={() => finalize()}
              nextLabel="Bewaar dag"
              disabled={false}
            />
          </div>
        </section>
      )}

      <div className="mt-12 text-center text-xs text-ink-500">
        {todayDate}
      </div>
    </div>
  )
}

function Nav({ onBack, onNext, disabled, nextLabel = 'Verder' }) {
  return (
    <div className="flex items-center justify-between">
      <button onClick={onBack} className="btn-ghost">
        <ArrowLeft size={16} />
        Terug
      </button>
      <button onClick={onNext} disabled={disabled} className="btn-primary">
        {nextLabel}
        <ArrowRight size={18} />
      </button>
    </div>
  )
}
