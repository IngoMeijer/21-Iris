import { useState } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'
import BinnenboomMark from './BinnenboomMark.jsx'

const EXAMPLES = [
  'Ik trek me terug bij conflict',
  'Ik raak in paniek bij autoriteit',
  'Ik kan geen complimenten ontvangen',
]

export default function Welcome({ initialPattern = '', onStart, onDemo }) {
  const [pattern, setPattern] = useState(initialPattern)

  function pick(example) {
    setPattern(example)
  }

  function submit(e) {
    e.preventDefault()
    const trimmed = pattern.trim()
    if (trimmed.length < 3) return
    onStart(trimmed)
  }

  return (
    <div className="mx-auto max-w-xl px-5 pt-10 pb-24">
      <header className="flex items-center gap-3 text-sage-700 mb-10">
        <BinnenboomMark size={36} className="text-sage-600" />
        <div>
          <p className="font-serif text-xl leading-none">Binnenboom</p>
          <p className="text-xs uppercase tracking-[0.18em] text-ink-500 mt-1">Patroonkaart</p>
        </div>
      </header>

      <h1 className="font-serif text-4xl sm:text-5xl text-ink-900 leading-[1.05] mb-5">
        Wat blijft zich,<br />in jou herhalen?
      </h1>

      <p className="text-ink-700 text-[15px] leading-relaxed mb-5">
        Een patroon is een reactie die je vaker hebt dan je zou willen. Iets dat
        opspeelt zonder dat je het bewust kiest. Vaak komt het uit een eerdere
        ervaring, en is het ooit nuttig geweest. Alleen, vandaag past het niet meer.
      </p>
      <p className="text-ink-700 text-[15px] leading-relaxed mb-8">
        In 21 dagen leer je jouw patroon herkennen. Elke dag een korte vraag,
        twintig seconden invultijd. Aan het einde krijg je een patroonkaart die je
        terugziet wat zich heeft laten zien.
      </p>

      <div className="card p-5 sm:p-6 mb-6">
        <p className="text-xs uppercase tracking-[0.16em] text-ink-500 mb-3">
          Voorbeelden
        </p>
        <ul className="space-y-2 mb-5">
          {EXAMPLES.map((ex) => (
            <li key={ex}>
              <button
                type="button"
                onClick={() => pick(ex)}
                className="text-left w-full px-4 py-3 rounded-2xl border border-beige-200 bg-beige-50/60 hover:bg-beige-100 hover:border-beige-300 transition text-ink-900 text-[15px]"
              >
                {ex}
              </button>
            </li>
          ))}
        </ul>

        <form onSubmit={submit}>
          <label
            htmlFor="patroon"
            className="block text-xs uppercase tracking-[0.16em] text-ink-500 mb-2"
          >
            Welk patroon wil jij onderzoeken?
          </label>
          <textarea
            id="patroon"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            rows={3}
            maxLength={200}
            placeholder="Schrijf in je eigen woorden..."
            className="field resize-none"
          />
          <div className="mt-5 flex items-center justify-between gap-3">
            <span className="text-xs text-ink-500">{pattern.length}/200</span>
            <button
              type="submit"
              disabled={pattern.trim().length < 3}
              className="btn-primary"
            >
              Begin de 21 dagen
              <ArrowRight size={18} />
            </button>
          </div>
        </form>
      </div>

      <button
        type="button"
        onClick={onDemo}
        className="btn-ghost text-ink-500 hover:text-ink-700 mx-auto flex"
      >
        <Sparkles size={14} />
        Bekijk voorbeeld patroonkaart
      </button>

      <footer className="mt-16 text-center text-xs text-ink-500">
        <p>Praktijk Binnenboom, Hanneke Meijer</p>
        <p>NEI therapie in Best, Noord-Brabant</p>
      </footer>
    </div>
  )
}
