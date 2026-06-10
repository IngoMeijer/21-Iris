import { ArrowLeft, Mail, Sparkles } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import BinnenboomMark from './BinnenboomMark.jsx'
import { analyze, interpret } from '../utils/analyze.js'

const COLORS = ['#cd7f57', '#b9663d', '#688756', '#85a273', '#c9b58a']

export default function PatternCard({
  pattern,
  checkins,
  isDemo,
  onBack,
}) {
  const result = analyze(checkins)
  const interpretation = interpret(result, pattern)

  const themeData = result.themes
  const ageData = result.ageBuckets.filter((b) => b.count > 0)
  const maxBody = Math.max(1, ...result.body.map((b) => b.count))

  return (
    <div className="mx-auto max-w-2xl px-5 pt-8 pb-24">
      <header className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="btn-ghost">
          <ArrowLeft size={16} />
          Terug
        </button>
        <div className="flex items-center gap-2 text-sage-700">
          <BinnenboomMark size={24} className="text-sage-600" />
          <span className="font-serif text-lg">Binnenboom</span>
        </div>
      </header>

      {isDemo && (
        <div className="mb-6 rounded-2xl bg-terracotta-100/60 border border-terracotta-200 px-4 py-3 text-sm text-terracotta-600 flex items-center gap-2">
          <Sparkles size={16} />
          Voorbeeldkaart, opgebouwd uit dummy data
        </div>
      )}

      <p className="text-xs uppercase tracking-[0.18em] text-ink-500 mb-2">
        Jouw patroonkaart
      </p>
      <h1 className="font-serif text-4xl text-ink-900 leading-tight mb-3">
        Wat zich heeft laten zien.
      </h1>
      <p className="font-serif text-xl text-sage-700 leading-snug mb-10">
        "{pattern}"
      </p>

      {/* Totals */}
      <section className="grid grid-cols-3 gap-3 mb-8">
        <Stat label="Dagen ingevuld" value={result.totals.totalDays} />
        <Stat
          label="Patroon speelde"
          value={result.totals.triggeredDays}
        />
        <Stat
          label="Aandeel"
          value={`${Math.round(result.totals.triggerRate * 100)}%`}
        />
      </section>

      {/* Weekday chart */}
      <Card title="Wanneer in de week">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={result.weekday} margin={{ top: 10, right: 8, bottom: 0, left: -28 }}>
              <XAxis
                dataKey="day"
                stroke="#6f655b"
                tickLine={false}
                axisLine={false}
                fontSize={12}
              />
              <YAxis
                allowDecimals={false}
                stroke="#6f655b"
                tickLine={false}
                axisLine={false}
                fontSize={12}
              />
              <Tooltip
                cursor={{ fill: 'rgba(236,226,205,0.4)' }}
                contentStyle={{
                  background: '#fbf8f3',
                  border: '1px solid #ece2cd',
                  borderRadius: 12,
                  fontSize: 12,
                  color: '#2a2622',
                }}
                formatter={(v) => [`${v}`, 'keer']}
                labelFormatter={(l) => `Dag, ${l}`}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#cd7f57" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Themes */}
      <Card title="Terugkerende thema's">
        {themeData.length === 0 ? (
          <Empty>Nog te weinig invoer om thema's te herkennen.</Empty>
        ) : (
          <ol className="space-y-3">
            {themeData.map((t, i) => (
              <li
                key={t.label}
                className="flex items-center justify-between gap-3 py-2 border-b border-beige-200/70 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-beige-50 font-serif text-base"
                    style={{ background: COLORS[i] }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-ink-900">{t.label}</span>
                </div>
                <span className="text-sm text-ink-500">{t.count}x</span>
              </li>
            ))}
          </ol>
        )}
      </Card>

      {/* Body heatmap */}
      <Card title="In je lichaam">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {result.body.map((b) => {
            const intensity = b.count / maxBody
            const bg = b.count === 0
              ? '#f5efe4'
              : intensityColor(intensity)
            return (
              <div
                key={b.key}
                className="rounded-2xl p-3 border border-beige-200/70 flex flex-col items-center justify-center aspect-square text-center"
                style={{ background: bg }}
              >
                <span className="text-[11px] uppercase tracking-wider text-ink-700">
                  {b.label}
                </span>
                <span className="font-serif text-2xl text-ink-900 mt-1">
                  {b.count}
                </span>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Age distribution */}
      <Card title="Welke leeftijden komen terug">
        {ageData.length === 0 ? (
          <Empty>Nog geen leeftijden geregistreerd.</Empty>
        ) : (
          <div className="space-y-3">
            {ageData.map((a, i) => (
              <AgeBar key={a.label} item={a} color={COLORS[i % COLORS.length]} max={Math.max(...ageData.map((x) => x.count))} />
            ))}
          </div>
        )}
      </Card>

      {/* Interpretation */}
      <Card title="Wat de kaart vertelt">
        <p className="font-serif text-[19px] text-ink-900 leading-relaxed">
          {interpretation}
        </p>
      </Card>

      {/* CTA */}
      <section className="mt-10">
        <div className="rounded-3xl bg-sage-50 border border-sage-200 p-6 sm:p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center mb-4">
            <BinnenboomMark size={28} className="text-sage-700" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-ink-900 mb-3">
            Wil je begrijpen wat deze kaart betekent?
          </h2>
          <p className="text-ink-700 mb-6 max-w-md mx-auto leading-relaxed">
            Plan een kennismaking van 30 minuten met Hanneke. We kijken samen
            naar wat je hebt verzameld, en bespreken hoe NEI je verder kan
            helpen. Geen verplichting.
          </p>
          <a
            href="mailto:hanneke@praktijkbinnenboom.nl?subject=Kennismaking%20Patroonkaart"
            className="btn-primary"
          >
            <Mail size={18} />
            Plan een kennismaking
          </a>
          <p className="text-xs text-ink-500 mt-4">
            Praktijk Binnenboom, Hanneke Meijer, NEI in Best
          </p>
        </div>
      </section>
    </div>
  )
}

function Card({ title, children }) {
  return (
    <section className="card p-5 sm:p-6 mb-6">
      <h2 className="font-serif text-lg text-ink-700 mb-4">{title}</h2>
      {children}
    </section>
  )
}

function Stat({ label, value }) {
  return (
    <div className="card p-4 text-center">
      <div className="font-serif text-3xl text-sage-700">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-ink-500 mt-1">
        {label}
      </div>
    </div>
  )
}

function Empty({ children }) {
  return <p className="text-sm text-ink-500 italic">{children}</p>
}

function AgeBar({ item, color, max }) {
  const pct = max > 0 ? (item.count / max) * 100 : 0
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-sm text-ink-900">{item.label}</span>
        <span className="text-xs text-ink-500">{item.count}x</span>
      </div>
      <div className="h-3 rounded-full bg-beige-100 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}

function intensityColor(t) {
  // Linear blend from beige to terracotta
  const start = [245, 239, 228] // beige-100
  const end = [205, 127, 87] // terracotta-400
  const r = Math.round(start[0] + (end[0] - start[0]) * t)
  const g = Math.round(start[1] + (end[1] - start[1]) * t)
  const b = Math.round(start[2] + (end[2] - start[2]) * t)
  return `rgb(${r}, ${g}, ${b})`
}
