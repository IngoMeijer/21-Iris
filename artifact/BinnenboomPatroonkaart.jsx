import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  CalendarDays,
  Mail,
  Sparkles,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

/* ============================================================
   Binnenboom Patroonkaart, single-file React artifact
   ------------------------------------------------------------
   Praktijk Binnenboom, Hanneke Meijer, NEI therapie in Best.
   Plak dit bestand in een Claude.ai gesprek als React-artifact.
   ============================================================ */

// ---------- Palette (warm beige, sage green, terracotta) ----------
const C = {
  paper: '#fbf8f3',
  beige50: '#fbf8f3',
  beige100: '#f5efe4',
  beige200: '#ece2cd',
  beige300: '#decfae',
  sage50: '#f3f6f1',
  sage100: '#e3ebde',
  sage200: '#c7d6bd',
  sage300: '#a6bd96',
  sage400: '#85a273',
  sage600: '#516b43',
  sage700: '#3f5435',
  terra100: '#f4dfd2',
  terra200: '#e9c1a8',
  terra300: '#dc9f7d',
  terra400: '#cd7f57',
  terra500: '#b9663d',
  ink900: '#2a2622',
  ink700: '#4a423b',
  ink500: '#6f655b',
  ink300: '#a89e93',
}

const FONT_SERIF = "'Cormorant Garamond', 'Lora', Georgia, serif"
const FONT_SANS = "'Inter', system-ui, sans-serif"

// ---------- Storage (window.storage) ----------
// In the Claude artifact environment, window.storage uses get/set/delete.

const STORAGE_AVAILABLE =
  typeof window !== 'undefined' &&
  window.storage &&
  typeof window.storage.get === 'function'

async function rawGet(key) {
  if (!STORAGE_AVAILABLE) return null
  try {
    const result = await window.storage.get(key)
    return result ? result.value : null
  } catch {
    return null
  }
}
async function rawSet(key, value) {
  if (!STORAGE_AVAILABLE) return null
  try {
    return await window.storage.set(key, value, false)
  } catch {
    return null
  }
}
async function rawRemove(key) {
  if (!STORAGE_AVAILABLE) return null
  try {
    return await window.storage.delete(key, false)
  } catch {
    return null
  }
}

async function getJSON(key, fallback = null) {
  const raw = await rawGet(key)
  if (raw == null) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}
async function setJSON(key, value) {
  await rawSet(key, JSON.stringify(value))
}

// We keep a small index of checkin dates so we never depend on key listing.
async function readIndex() {
  return (await getJSON('checkin:index', [])) || []
}
async function writeIndex(dates) {
  await setJSON('checkin:index', dates)
}

async function loadCheckins() {
  const index = await readIndex()
  const out = []
  for (const date of index) {
    const entry = await getJSON(`checkin:${date}`)
    if (entry) out.push({ date, ...entry })
  }
  out.sort((a, b) => (a.date < b.date ? -1 : 1))
  return out
}

async function saveCheckin(date, payload) {
  await setJSON(`checkin:${date}`, payload)
  const index = await readIndex()
  if (!index.includes(date)) {
    index.push(date)
    index.sort()
    await writeIndex(index)
  }
}

async function clearAllStorage() {
  const index = await readIndex()
  for (const date of index) await rawRemove(`checkin:${date}`)
  await rawRemove('checkin:index')
  await rawRemove('patroon:beschrijving')
  await rawRemove('patroon:startdatum')
}

// ---------- Date utilities ----------

function dateKey(d) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
function todayKey() {
  return dateKey(new Date())
}
function diffDays(a, b) {
  const ms =
    new Date(a).setHours(0, 0, 0, 0) - new Date(b).setHours(0, 0, 0, 0)
  return Math.round(ms / (1000 * 60 * 60 * 24))
}
function weekdayIndex(dateString) {
  const d = new Date(dateString + 'T00:00:00')
  return (d.getDay() + 6) % 7 // 0 = monday
}
const WEEKDAY_LABELS = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']
const WEEKDAY_FULL = {
  ma: 'maandag',
  di: 'dinsdag',
  wo: 'woensdag',
  do: 'donderdag',
  vr: 'vrijdag',
  za: 'zaterdag',
  zo: 'zondag',
}

function formatDateLong(d) {
  const days = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag']
  const months = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december']
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`
}

// ---------- Analysis ----------

const STOP_WORDS = new Set([
  'de', 'het', 'een', 'en', 'of', 'maar', 'want', 'dus', 'als', 'dan', 'toen',
  'ik', 'jij', 'je', 'hij', 'zij', 'wij', 'ze', 'we', 'mij', 'me', 'mijn', 'jouw',
  'ben', 'is', 'was', 'zijn', 'word', 'wordt', 'heb', 'had', 'heeft', 'hebben',
  'in', 'op', 'aan', 'bij', 'met', 'van', 'voor', 'naar', 'om', 'door', 'over',
  'er', 'dat', 'die', 'dit', 'deze', 'wat', 'wie', 'waar', 'hoe', 'niet', 'wel',
  'nog', 'al', 'ook', 'heel', 'erg', 'zo', 'te', 'tot', 'uit', 'af',
  'iemand', 'iets', 'mensen', 'mens',
])

const THEME_GROUPS = [
  { label: 'Werk en collegas', words: ['werk', 'collega', 'baas', 'kantoor', 'vergadering', 'meeting', 'manager', 'leidinggevende', 'klant', 'project', 'deadline'] },
  { label: 'Partner', words: ['partner', 'vriend', 'vriendin', 'man', 'vrouw', 'relatie', 'liefde'] },
  { label: 'Familie', words: ['moeder', 'vader', 'mama', 'papa', 'zus', 'broer', 'familie', 'ouder', 'ouders', 'schoonmoeder'] },
  { label: 'Kinderen', words: ['kind', 'kinderen', 'zoon', 'dochter', 'baby', 'puber'] },
  { label: 'Conflict en kritiek', words: ['ruzie', 'conflict', 'kritiek', 'boos', 'woede', 'discussie', 'verwijt'] },
  { label: 'Sociaal', words: ['feest', 'verjaardag', 'borrel', 'sociaal', 'groep'] },
  { label: 'Geld en financien', words: ['geld', 'rekening', 'belasting', 'salaris', 'kosten'] },
  { label: 'Lichaam en gezondheid', words: ['ziek', 'pijn', 'moe', 'lichaam', 'arts', 'huisarts', 'dokter'] },
  { label: 'Onderweg', words: ['auto', 'file', 'trein', 'fiets', 'verkeer', 'rijden'] },
  { label: 'Huishouden', words: ['huis', 'koken', 'eten', 'opruimen', 'wassen', 'huishouden', 'boodschappen'] },
]

const BODY_OPTIONS = [
  { key: 'borst', label: 'Borst' },
  { key: 'buik', label: 'Buik' },
  { key: 'keel', label: 'Keel' },
  { key: 'hoofd', label: 'Hoofd' },
  { key: 'schouders', label: 'Schouders' },
  { key: 'anders', label: 'Anders' },
]
const BODY_LABELS = Object.fromEntries(BODY_OPTIONS.map((b) => [b.key, b.label]))

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
}

function analyze(checkins) {
  const triggered = checkins.filter((c) => c.triggered)

  const weekdayCounts = Array(7).fill(0)
  for (const c of triggered) weekdayCounts[weekdayIndex(c.date)] += 1
  const weekday = WEEKDAY_LABELS.map((label, i) => ({
    day: label,
    count: weekdayCounts[i],
  }))

  const themeCounts = {}
  for (const c of triggered) {
    const tokens = tokenize(c.situation)
    const matched = new Set()
    for (const group of THEME_GROUPS) {
      if (
        tokens.some((t) =>
          group.words.some((w) => t.includes(w) || w.includes(t)),
        )
      )
        matched.add(group.label)
    }
    if (matched.size === 0 && tokens.length > 0) matched.add('Overig')
    for (const m of matched) themeCounts[m] = (themeCounts[m] || 0) + 1
  }
  const themes = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label, count]) => ({ label, count }))

  const bodyCounts = {}
  for (const c of triggered) if (c.body) bodyCounts[c.body] = (bodyCounts[c.body] || 0) + 1
  const body = Object.keys(BODY_LABELS).map((k) => ({
    key: k,
    label: BODY_LABELS[k],
    count: bodyCounts[k] || 0,
  }))

  const ageBuckets = [
    { label: '0-6', min: 0, max: 6, count: 0 },
    { label: '7-12', min: 7, max: 12, count: 0 },
    { label: '13-18', min: 13, max: 18, count: 0 },
    { label: 'Volwassen', min: 19, max: 200, count: 0 },
    { label: 'Onbekend', min: null, max: null, count: 0 },
  ]
  for (const c of triggered) {
    if (c.age == null || c.age === 'unknown') ageBuckets[4].count += 1
    else {
      const a = Number(c.age)
      const bucket = ageBuckets.find(
        (b) => b.min != null && a >= b.min && a <= b.max,
      )
      if (bucket) bucket.count += 1
    }
  }

  const totalDays = checkins.length
  const triggeredDays = triggered.length
  const triggerRate = totalDays > 0 ? triggeredDays / totalDays : 0

  return {
    weekday,
    themes,
    body,
    ageBuckets,
    totals: { totalDays, triggeredDays, triggerRate },
  }
}

function interpret(result, patternDescription) {
  const { weekday, themes, body, ageBuckets, totals } = result
  const sentences = []

  if (totals.triggeredDays === 0) {
    return 'In deze 21 dagen heb je geen momenten geregistreerd. Dat is op zichzelf ook een uitkomst, soms wordt een patroon stiller zodra je het bewust gaat zien.'
  }

  sentences.push(
    `In 21 dagen werd je patroon ${totals.triggeredDays} keer geraakt, ongeveer ${Math.round(totals.triggerRate * 100)} procent van de dagen.`,
  )

  const topDay = [...weekday].sort((a, b) => b.count - a.count)[0]
  if (topDay && topDay.count > 0) {
    sentences.push(`Het meest voelde je dit op ${WEEKDAY_FULL[topDay.day] || topDay.day}.`)
  }
  if (themes.length > 0) {
    const names = themes.map((t) => t.label.toLowerCase()).join(', ')
    sentences.push(`De situaties draaiden vooral om ${names}.`)
  }
  const topBody = [...body].sort((a, b) => b.count - a.count)[0]
  if (topBody && topBody.count > 0) {
    sentences.push(`In je lichaam kwam het vooral terug in je ${topBody.label.toLowerCase()}.`)
  }
  const topAge = [...ageBuckets].sort((a, b) => b.count - a.count)[0]
  if (topAge && topAge.count > 0 && topAge.label !== 'Onbekend') {
    if (topAge.label === 'Volwassen') sentences.push('De leeftijd die het meest meekwam, voelde volwassen.')
    else sentences.push(`De leeftijd die het meest meekwam, lag rond ${topAge.label} jaar.`)
  }
  if (patternDescription) {
    sentences.push(`Dit is wat je hebt verzameld rond, "${patternDescription}". Een patroonkaart geeft een richting, geen diagnose.`)
  }
  return sentences.join(' ')
}

function generateDemoCheckins() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(today)
  start.setDate(start.getDate() - 20)
  const samples = [
    { triggered: true, situation: 'Vergadering met manager liep uit, voelde me ineens klein.', body: 'borst', age: 8 },
    { triggered: false },
    { triggered: true, situation: 'Compliment van collega kreeg ik niet binnen.', body: 'keel', age: 6 },
    { triggered: true, situation: 'Ruzie met partner over de afwas.', body: 'buik', age: 12 },
    { triggered: false },
    { triggered: true, situation: 'Schoonmoeder belde, schoot in oude rol.', body: 'schouders', age: 10 },
    { triggered: true, situation: 'Kritiek van baas op project.', body: 'borst', age: 7 },
    { triggered: false },
    { triggered: true, situation: 'Discussie met partner, trok me terug.', body: 'buik', age: 11 },
    { triggered: true, situation: 'Werk deadline, paniek opkomen.', body: 'borst', age: 9 },
    { triggered: false },
    { triggered: true, situation: 'Vader belde, oud gevoel.', body: 'keel', age: 5 },
    { triggered: true, situation: 'Vergadering, durfde niets te zeggen.', body: 'keel', age: 8 },
    { triggered: false },
    { triggered: true, situation: 'Conflict met collega over verdeling.', body: 'borst', age: 9 },
    { triggered: true, situation: 'Partner gaf compliment, kon het niet ontvangen.', body: 'hoofd', age: 6 },
    { triggered: false },
    { triggered: true, situation: 'Manager vroeg om feedback, schrok.', body: 'borst', age: 8 },
    { triggered: true, situation: 'Avondeten met familie, trok me terug.', body: 'buik', age: 11 },
    { triggered: false },
    { triggered: true, situation: 'Beoordelingsgesprek baas, voelde me 8 jaar.', body: 'borst', age: 8 },
  ]
  const out = []
  for (let i = 0; i < 21; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    out.push({ date: dateKey(d), ...samples[i] })
  }
  return out
}

function pickMotivational(days) {
  if (days === 0) return 'Vandaag is dag een. Een patroon wordt zichtbaar als je het uitnodigt om gezien te worden.'
  if (days < 4) return 'Mooi, je bent begonnen. De eerste dagen voelen vaak nog onwennig, dat hoort erbij.'
  if (days < 8) return 'Je bent op weg. Soms zie je nog niks bijzonders, soms wel. Beide is goed.'
  if (days < 14) return 'Halverwege. Vaak begint er nu iets te dagen, een herhaling, een lichamelijke plek, een leeftijd.'
  if (days < 20) return 'Bijna een complete kaart. Blijf even dichtbij, juist nu kan er iets duidelijk worden.'
  if (days < 21) return 'Nog een dag te gaan. Mooi werk dat je dit voor jezelf hebt gedaan.'
  return 'Je hebt alle 21 dagen ingevuld. Je patroonkaart staat voor je klaar.'
}

function intensityColor(t) {
  const start = [245, 239, 228]
  const end = [205, 127, 87]
  const r = Math.round(start[0] + (end[0] - start[0]) * t)
  const g = Math.round(start[1] + (end[1] - start[1]) * t)
  const b = Math.round(start[2] + (end[2] - start[2]) * t)
  return `rgb(${r}, ${g}, ${b})`
}

// ---------- Shared UI bits ----------

const STYLES = `
  .bb-paper {
    background-color: ${C.paper};
    background-image:
      radial-gradient(at 20% 10%, rgba(236, 226, 205, 0.55) 0px, transparent 50%),
      radial-gradient(at 80% 90%, rgba(227, 235, 222, 0.55) 0px, transparent 50%);
    color: ${C.ink900};
    font-family: ${FONT_SANS};
    min-height: 100dvh;
  }
  .bb-serif { font-family: ${FONT_SERIF}; font-weight: 500; letter-spacing: -0.01em; }
  .bb-btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 1.5rem; border-radius: 9999px; font-weight: 500; font-size: 0.95rem; transition: all 0.15s ease; cursor: pointer; border: none; }
  .bb-btn:active { transform: scale(0.98); }
  .bb-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .bb-btn-primary { background: ${C.sage600}; color: ${C.beige50}; }
  .bb-btn-primary:hover:not(:disabled) { background: ${C.sage700}; }
  .bb-btn-secondary { background: ${C.beige100}; color: ${C.ink900}; border: 1px solid ${C.beige200}; }
  .bb-btn-secondary:hover { background: ${C.beige200}; }
  .bb-btn-ghost { background: transparent; color: ${C.ink700}; padding: 0.5rem 1rem; font-size: 0.85rem; }
  .bb-btn-ghost:hover { background: ${C.beige100}; }
  .bb-card { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(4px); border-radius: 1.5rem; border: 1px solid ${C.beige200}; box-shadow: 0 4px 24px -8px rgba(74, 66, 59, 0.12); }
  .bb-field { width: 100%; border-radius: 1rem; border: 1px solid ${C.beige200}; background: rgba(255, 255, 255, 0.7); padding: 0.75rem 1rem; color: ${C.ink900}; font-family: inherit; font-size: 0.95rem; transition: all 0.15s; }
  .bb-field:focus { outline: none; border-color: ${C.sage300}; box-shadow: 0 0 0 3px ${C.sage100}; }
  .bb-field::placeholder { color: ${C.ink300}; }
  .bb-eyebrow { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.16em; color: ${C.ink500}; }
  .bb-mut { color: ${C.ink500}; }
  .bb-range { width: 100%; accent-color: ${C.sage600}; }
  @media (max-width: 480px) {
    .bb-h1 { font-size: 2.25rem !important; }
  }
`

function BinnenboomMark({ size = 28, color = C.sage600, accent = C.terra400 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      {/* trunk */}
      <path d="M32 60 V44" stroke={color} strokeWidth="1.8" strokeLinecap="round" opacity="0.55" />
      {/* branches reaching the side leaves */}
      <path d="M32 46 C28 40 24 36 22 32" stroke={color} strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.4" />
      <path d="M32 46 C36 40 40 36 42 32" stroke={color} strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.4" />
      {/* leaves */}
      <path d="M22 32 C16 28 14 22 18 16 C24 20 26 26 22 32 Z" fill={color} opacity="0.5" />
      <path d="M42 32 C48 28 50 22 46 16 C40 20 38 26 42 32 Z" fill={color} opacity="0.5" />
      <path d="M32 22 C28 18 26 10 30 6 C34 12 36 16 32 22 Z" fill={color} opacity="0.6" />
      <path d="M32 22 C36 18 38 10 34 6 C30 12 28 16 32 22 Z" fill={color} opacity="0.75" />
      {/* heart in the middle */}
      <path d="M32 40 C28 36 24 33 24 29 C24 27 26 25.5 28 25.5 C30 25.5 31 26.5 32 28 C33 26.5 34 25.5 36 25.5 C38 25.5 40 27 40 29 C40 33 36 36 32 40 Z" fill={accent} />
    </svg>
  )
}

function Header({ right }) {
  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <BinnenboomMark size={30} />
        <div className="bb-serif" style={{ fontSize: '1.15rem', color: C.sage700 }}>Binnenboom</div>
      </div>
      <div>{right}</div>
    </header>
  )
}

// ---------- Welcome ----------

const EXAMPLES = [
  'Ik trek me terug bij conflict',
  'Ik raak in paniek bij autoriteit',
  'Ik kan geen complimenten ontvangen',
]

function Welcome({ initialPattern, onStart, onDemo }) {
  const [pattern, setPattern] = useState(initialPattern || '')

  function submit(e) {
    if (e && e.preventDefault) e.preventDefault()
    const t = pattern.trim()
    if (t.length < 3) return
    onStart(t)
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '2.5rem 1.25rem 6rem' }}>
      <Header
        right={<span className="bb-eyebrow">Patroonkaart</span>}
      />

      <h1 className="bb-serif bb-h1" style={{ fontSize: '3rem', lineHeight: 1.05, color: C.ink900, margin: '0 0 1.25rem' }}>
        Wat blijft zich,<br />in jou herhalen?
      </h1>

      <p style={{ color: C.ink700, fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 1rem' }}>
        Een patroon is een reactie die je vaker hebt dan je zou willen. Iets dat opspeelt zonder dat je het bewust kiest. Vaak komt het uit een eerdere ervaring, en is het ooit nuttig geweest. Alleen, vandaag past het niet meer.
      </p>
      <p style={{ color: C.ink700, fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 2rem' }}>
        In 21 dagen leer je jouw patroon herkennen. Elke dag een korte vraag, twintig seconden invultijd. Aan het einde krijg je een patroonkaart die je terugziet wat zich heeft laten zien.
      </p>

      <div className="bb-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="bb-eyebrow" style={{ marginBottom: '0.75rem' }}>Voorbeelden</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setPattern(ex)}
              style={{
                textAlign: 'left',
                padding: '0.75rem 1rem',
                borderRadius: '1rem',
                border: `1px solid ${C.beige200}`,
                background: 'rgba(251, 248, 243, 0.6)',
                color: C.ink900,
                fontSize: '0.95rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.beige100 }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(251, 248, 243, 0.6)' }}
            >
              {ex}
            </button>
          ))}
        </div>

        <div>
          <label htmlFor="patroon" className="bb-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Welk patroon wil jij onderzoeken?
          </label>
          <textarea
            id="patroon"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            rows={3}
            maxLength={200}
            placeholder="Schrijf in je eigen woorden..."
            className="bb-field"
            style={{ resize: 'none' }}
          />
          <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: C.ink500 }}>{pattern.length}/200</span>
            <button type="button" onClick={submit} disabled={pattern.trim().length < 3} className="bb-btn bb-btn-primary">
              Begin de 21 dagen
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button type="button" onClick={onDemo} className="bb-btn bb-btn-ghost" style={{ color: C.ink500 }}>
          <Sparkles size={14} />
          Bekijk voorbeeld patroonkaart
        </button>
      </div>

      <footer style={{ marginTop: '4rem', textAlign: 'center', fontSize: '0.75rem', color: C.ink500, lineHeight: 1.6 }}>
        <div>Praktijk Binnenboom, Hanneke Meijer</div>
        <div>NEI therapie in Best, Noord-Brabant</div>
      </footer>
    </div>
  )
}

// ---------- CheckIn ----------

function CheckIn({ pattern, dayNumber, todayDate, existing, onSave, onSkipToProgress, onOpenCard, canOpenCard }) {
  const [step, setStep] = useState(0)
  const [triggered, setTriggered] = useState(existing?.triggered ?? null)
  const [situation, setSituation] = useState(existing?.situation ?? '')
  const [body, setBody] = useState(existing?.body ?? '')
  const [age, setAge] = useState(existing?.age != null && existing?.age !== 'unknown' ? existing.age : 12)
  const [ageUnknown, setAgeUnknown] = useState(existing?.age === 'unknown')
  const [saved, setSaved] = useState(false)

  function choose(value) {
    setTriggered(value)
    if (value === false) finalize({ triggered: false })
    else setStep(1)
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
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '4rem 1.25rem 6rem', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, margin: '0 auto 1.25rem', borderRadius: '50%', background: C.sage100, color: C.sage700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Check size={26} />
        </div>
        <h1 className="bb-serif" style={{ fontSize: '2rem', color: C.ink900, margin: '0 0 0.75rem' }}>Bewaard</h1>
        <p style={{ color: C.ink700, margin: '0 0 2rem' }}>Mooi dat je vandaag even stil hebt gestaan. Tot morgen.</p>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={onSkipToProgress} className="bb-btn bb-btn-primary">
            Bekijk je voortgang
            <ArrowRight size={18} />
          </button>
          {canOpenCard && (
            <button onClick={onOpenCard} className="bb-btn bb-btn-ghost">Naar je patroonkaart</button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem 1.25rem 6rem' }}>
      <Header
        right={
          <div style={{ fontSize: '0.75rem', color: C.ink500, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CalendarDays size={14} />
            Dag {dayNumber} van 21
          </div>
        }
      />

      <div className="bb-eyebrow" style={{ marginBottom: '0.5rem' }}>Jouw patroon</div>
      <p className="bb-serif" style={{ fontSize: '1.5rem', color: C.ink900, lineHeight: 1.3, margin: '0 0 2rem' }}>
        {pattern}
      </p>

      {step === 0 && (
        <section>
          <h2 className="bb-serif" style={{ fontSize: '1.5rem', color: C.ink900, margin: '0 0 1.5rem' }}>
            Speelde je patroon vandaag?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <ChoiceBig onClick={() => choose(true)} hoverBg={C.terra100}>Ja</ChoiceBig>
            <ChoiceBig onClick={() => choose(false)} hoverBg={C.sage100}>Nee</ChoiceBig>
          </div>
          <p style={{ fontSize: '0.75rem', color: C.ink500, marginTop: '1.5rem', lineHeight: 1.6 }}>
            Een "nee" telt ook. Het is even waardevol om te zien wanneer je patroon stil bleef.
          </p>
        </section>
      )}

      {step === 1 && (
        <section>
          <h2 className="bb-serif" style={{ fontSize: '1.5rem', color: C.ink900, margin: '0 0 1.25rem' }}>
            Welke situatie triggerde het?
          </h2>
          <input
            type="text"
            value={situation}
            onChange={(e) => setSituation(e.target.value.slice(0, 100))}
            maxLength={100}
            placeholder="Bijvoorbeeld, vergadering met manager"
            className="bb-field"
            autoFocus
          />
          <div style={{ fontSize: '0.75rem', color: C.ink500, marginTop: '0.5rem', marginBottom: '2rem' }}>
            {situation.length}/100
          </div>
          <Nav onBack={() => setStep(0)} onNext={() => setStep(2)} disabled={situation.trim().length < 2} />
        </section>
      )}

      {step === 2 && (
        <section>
          <h2 className="bb-serif" style={{ fontSize: '1.5rem', color: C.ink900, margin: '0 0 1.25rem' }}>
            Waar voelde je het in je lichaam?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.625rem', marginBottom: '2rem' }}>
            {BODY_OPTIONS.map((b) => {
              const selected = body === b.key
              return (
                <button
                  key={b.key}
                  onClick={() => setBody(b.key)}
                  style={{
                    padding: '1rem 0.75rem',
                    borderRadius: '1rem',
                    border: `1px solid ${selected ? C.sage300 : C.beige200}`,
                    background: selected ? C.sage100 : 'rgba(255, 255, 255, 0.7)',
                    color: C.ink900,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: '0.95rem',
                    transition: 'all 0.15s',
                  }}
                >
                  {b.label}
                </button>
              )
            })}
          </div>
          <Nav onBack={() => setStep(1)} onNext={() => setStep(3)} disabled={!body} />
        </section>
      )}

      {step === 3 && (
        <section>
          <h2 className="bb-serif" style={{ fontSize: '1.5rem', color: C.ink900, margin: '0 0 0.5rem' }}>
            Welke leeftijd voelde dit?
          </h2>
          <p style={{ fontSize: '0.875rem', color: C.ink500, margin: '0 0 1.75rem' }}>
            Een gevoel kan jonger zijn dan je nu bent. Hoe oud voelde het van binnen?
          </p>

          {!ageUnknown && (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span className="bb-eyebrow">Leeftijd</span>
                <span className="bb-serif" style={{ fontSize: '1.875rem', color: C.sage700 }}>
                  {age >= 25 ? 'Volwassen' : age}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="bb-range"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: C.ink500, margin: '0.25rem 0 1.5rem' }}>
                <span>0</span>
                <span>Volwassen</span>
              </div>
            </>
          )}

          <button
            type="button"
            onClick={() => setAgeUnknown((v) => !v)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '1rem',
              border: `1px solid ${ageUnknown ? C.sage300 : C.beige200}`,
              background: ageUnknown ? C.sage100 : 'rgba(255, 255, 255, 0.7)',
              color: ageUnknown ? C.ink900 : C.ink700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '0.95rem',
            }}
          >
            Weet ik niet
          </button>

          <div style={{ marginTop: '2rem' }}>
            <Nav onBack={() => setStep(2)} onNext={() => finalize()} nextLabel="Bewaar dag" />
          </div>
        </section>
      )}

      <div style={{ marginTop: '3rem', textAlign: 'center', fontSize: '0.75rem', color: C.ink500 }}>{todayDate}</div>
    </div>
  )
}

function ChoiceBig({ children, onClick, hoverBg }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '2rem 1rem',
        borderRadius: '1rem',
        border: `1px solid ${C.beige200}`,
        background: 'rgba(255, 255, 255, 0.7)',
        color: C.ink900,
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: '1.05rem',
        fontWeight: 500,
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = hoverBg }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)' }}
    >
      {children}
    </button>
  )
}

function Nav({ onBack, onNext, disabled, nextLabel = 'Verder' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <button onClick={onBack} className="bb-btn bb-btn-ghost">
        <ArrowLeft size={16} />
        Terug
      </button>
      <button onClick={onNext} disabled={disabled} className="bb-btn bb-btn-primary">
        {nextLabel}
        <ArrowRight size={18} />
      </button>
    </div>
  )
}

// ---------- Progress ----------

function Progress({ pattern, startDate, checkins, daysCompleted, canOpenCard, todayDone, onBack, onCheckIn, onOpenCard }) {
  const today = todayKey()
  const days = []
  for (let i = 0; i < 21; i++) {
    const d = new Date(startDate + 'T00:00:00')
    d.setDate(d.getDate() + i)
    const key = dateKey(d)
    const entry = checkins.find((c) => c.date === key)
    const isToday = key === today
    const isPast = key < today
    days.push({ key, entry, isToday, isPast, index: i + 1 })
  }
  const motivational = pickMotivational(daysCompleted)
  const currentDay = Math.min(daysCompleted + (todayDone ? 0 : 1), 21)

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem 1.25rem 6rem' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <button onClick={onBack} className="bb-btn bb-btn-ghost">
          <ArrowLeft size={16} />
          Terug
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BinnenboomMark size={24} />
          <span className="bb-serif" style={{ fontSize: '1.05rem', color: C.sage700 }}>Binnenboom</span>
        </div>
      </header>

      <div className="bb-eyebrow" style={{ marginBottom: '0.5rem' }}>Jouw patroon</div>
      <p className="bb-serif" style={{ fontSize: '1.25rem', color: C.ink900, lineHeight: 1.35, margin: '0 0 2rem' }}>
        {pattern}
      </p>

      <div className="bb-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
          <h2 className="bb-serif" style={{ fontSize: '1.5rem', color: C.ink900, margin: 0 }}>Dag {currentDay} van 21</h2>
          <span style={{ fontSize: '0.85rem', color: C.ink500 }}>{daysCompleted} ingevuld</span>
        </div>
        <p style={{ fontSize: '0.875rem', color: C.ink700, lineHeight: 1.6, margin: 0 }}>{motivational}</p>
      </div>

      <div className="bb-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="bb-eyebrow" style={{ marginBottom: '1rem' }}>Kalender</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
          {days.map((d) => <DayCell key={d.key} day={d} />)}
        </div>
        <Legend />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {!todayDone && (
          <button onClick={onCheckIn} className="bb-btn bb-btn-primary">
            Vul vandaag in
            <ArrowRight size={18} />
          </button>
        )}
        {todayDone && (
          <div style={{ textAlign: 'center', fontSize: '0.875rem', color: C.sage700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} />
            Vandaag is ingevuld
          </div>
        )}
        {canOpenCard && (
          <button onClick={onOpenCard} className="bb-btn bb-btn-secondary">
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
  let bg, border, color
  if (filled) {
    if (triggered) { bg = C.terra200; border = C.terra300; color = C.terra500 }
    else { bg = C.sage100; border = C.sage200; color = C.sage700 }
  } else if (day.isToday) {
    bg = C.beige100; border = C.sage400; color = C.ink900
  } else if (day.isPast) {
    bg = C.beige50; border = C.beige200; color = C.ink300
  } else {
    bg = 'rgba(251, 248, 243, 0.6)'; border = C.beige200; color = C.ink300
  }
  return (
    <div
      style={{
        aspectRatio: '1 / 1',
        borderRadius: '0.75rem',
        background: bg,
        border: `${day.isToday ? '2px' : '1px'} ${day.isToday || filled || day.isPast ? 'solid' : 'dashed'} ${border}`,
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.8rem',
        fontWeight: 500,
      }}
    >
      {day.index}
    </div>
  )
}

function Legend() {
  return (
    <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', fontSize: '0.75rem', color: C.ink500 }}>
      <LegendDot bg={C.terra200} border={C.terra300} label="Patroon speelde" />
      <LegendDot bg={C.sage100} border={C.sage200} label="Rust" />
      <LegendDot bg={C.beige100} border={C.sage400} label="Vandaag" />
    </div>
  )
}
function LegendDot({ bg, border, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
      <span style={{ width: 12, height: 12, borderRadius: 4, background: bg, border: `1px solid ${border}` }} />
      {label}
    </span>
  )
}

// ---------- PatternCard ----------

const CHART_COLORS = [C.terra400, C.terra500, C.sage600, C.sage400, C.beige300]

function PatternCard({ pattern, checkins, isDemo, onBack }) {
  const result = analyze(checkins)
  const interpretation = interpret(result, pattern)
  const themeData = result.themes
  const ageData = result.ageBuckets.filter((b) => b.count > 0)
  const maxBody = Math.max(1, ...result.body.map((b) => b.count))
  const maxAge = Math.max(1, ...ageData.map((a) => a.count))

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.25rem 6rem' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <button onClick={onBack} className="bb-btn bb-btn-ghost">
          <ArrowLeft size={16} />
          Terug
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BinnenboomMark size={24} />
          <span className="bb-serif" style={{ fontSize: '1.05rem', color: C.sage700 }}>Binnenboom</span>
        </div>
      </header>

      {isDemo && (
        <div style={{ marginBottom: '1.5rem', borderRadius: '1rem', background: 'rgba(244, 223, 210, 0.6)', border: `1px solid ${C.terra200}`, padding: '0.75rem 1rem', fontSize: '0.875rem', color: C.terra500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={16} />
          Voorbeeldkaart, opgebouwd uit dummy data
        </div>
      )}

      <div className="bb-eyebrow" style={{ marginBottom: '0.5rem' }}>Jouw patroonkaart</div>
      <h1 className="bb-serif" style={{ fontSize: '2.5rem', color: C.ink900, lineHeight: 1.1, margin: '0 0 0.75rem' }}>
        Wat zich heeft laten zien.
      </h1>
      <p className="bb-serif" style={{ fontSize: '1.25rem', color: C.sage700, lineHeight: 1.35, margin: '0 0 2.5rem' }}>
        "{pattern}"
      </p>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '2rem' }}>
        <Stat label="Dagen ingevuld" value={result.totals.totalDays} />
        <Stat label="Patroon speelde" value={result.totals.triggeredDays} />
        <Stat label="Aandeel" value={`${Math.round(result.totals.triggerRate * 100)}%`} />
      </section>

      <Card title="Wanneer in de week">
        <div style={{ height: 192 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={result.weekday} margin={{ top: 10, right: 8, bottom: 0, left: -28 }}>
              <XAxis dataKey="day" stroke={C.ink500} tickLine={false} axisLine={false} fontSize={12} />
              <YAxis allowDecimals={false} stroke={C.ink500} tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip
                cursor={{ fill: 'rgba(236,226,205,0.4)' }}
                contentStyle={{ background: C.paper, border: `1px solid ${C.beige200}`, borderRadius: 12, fontSize: 12, color: C.ink900 }}
                formatter={(v) => [`${v}`, 'keer']}
                labelFormatter={(l) => `Dag, ${l}`}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} fill={C.terra400} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Terugkerende thema's">
        {themeData.length === 0 ? (
          <p style={{ fontSize: '0.875rem', color: C.ink500, fontStyle: 'italic', margin: 0 }}>
            Nog te weinig invoer om thema's te herkennen.
          </p>
        ) : (
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column' }}>
            {themeData.map((t, i) => (
              <li key={t.label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem',
                padding: '0.625rem 0',
                borderBottom: i < themeData.length - 1 ? `1px solid ${C.beige200}` : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ width: 28, height: 28, borderRadius: '50%', background: CHART_COLORS[i], color: C.beige50, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_SERIF, fontSize: '1rem' }}>
                    {i + 1}
                  </span>
                  <span style={{ color: C.ink900 }}>{t.label}</span>
                </div>
                <span style={{ fontSize: '0.875rem', color: C.ink500 }}>{t.count}x</span>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card title="In je lichaam">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          {result.body.map((b) => {
            const intensity = b.count / maxBody
            const bg = b.count === 0 ? C.beige100 : intensityColor(intensity)
            return (
              <div key={b.key} style={{
                borderRadius: '1rem',
                padding: '0.75rem',
                border: `1px solid ${C.beige200}`,
                background: bg,
                aspectRatio: '1 / 1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }}>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: C.ink700 }}>
                  {b.label}
                </span>
                <span className="bb-serif" style={{ fontSize: '1.75rem', color: C.ink900, marginTop: '0.25rem' }}>
                  {b.count}
                </span>
              </div>
            )
          })}
        </div>
      </Card>

      <Card title="Welke leeftijden komen terug">
        {ageData.length === 0 ? (
          <p style={{ fontSize: '0.875rem', color: C.ink500, fontStyle: 'italic', margin: 0 }}>
            Nog geen leeftijden geregistreerd.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {ageData.map((a, i) => {
              const pct = (a.count / maxAge) * 100
              return (
                <div key={a.label}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.875rem', color: C.ink900 }}>{a.label}</span>
                    <span style={{ fontSize: '0.75rem', color: C.ink500 }}>{a.count}x</span>
                  </div>
                  <div style={{ height: 12, borderRadius: 9999, background: C.beige100, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length], borderRadius: 9999 }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Card title="Wat de kaart vertelt">
        <p className="bb-serif" style={{ fontSize: '1.2rem', color: C.ink900, lineHeight: 1.6, margin: 0 }}>
          {interpretation}
        </p>
      </Card>

      <section style={{ marginTop: '2.5rem' }}>
        <div style={{
          borderRadius: '1.5rem',
          background: C.sage50,
          border: `1px solid ${C.sage200}`,
          padding: '1.75rem',
          textAlign: 'center',
        }}>
          <div style={{ width: 48, height: 48, margin: '0 auto 1rem', borderRadius: '50%', background: C.sage100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BinnenboomMark size={28} color={C.sage700} />
          </div>
          <h2 className="bb-serif" style={{ fontSize: '1.75rem', color: C.ink900, margin: '0 0 0.75rem' }}>
            Wil je begrijpen wat deze kaart betekent?
          </h2>
          <p style={{ color: C.ink700, margin: '0 auto 1.5rem', maxWidth: 420, lineHeight: 1.6 }}>
            Plan een kennismaking van 30 minuten met Hanneke. We kijken samen naar wat je hebt verzameld, en bespreken hoe NEI je verder kan helpen. Geen verplichting.
          </p>
          <a
            href="mailto:hanneke@praktijkbinnenboom.nl?subject=Kennismaking%20Patroonkaart"
            className="bb-btn bb-btn-primary"
            style={{ textDecoration: 'none' }}
          >
            <Mail size={18} />
            Plan een kennismaking
          </a>
          <p style={{ fontSize: '0.75rem', color: C.ink500, margin: '1rem 0 0' }}>
            Praktijk Binnenboom, Hanneke Meijer, NEI in Best
          </p>
        </div>
      </section>
    </div>
  )
}

function Card({ title, children }) {
  return (
    <section className="bb-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
      <h2 className="bb-serif" style={{ fontSize: '1.1rem', color: C.ink700, margin: '0 0 1rem' }}>{title}</h2>
      {children}
    </section>
  )
}

function Stat({ label, value }) {
  return (
    <div className="bb-card" style={{ padding: '1rem', textAlign: 'center' }}>
      <div className="bb-serif" style={{ fontSize: '1.875rem', color: C.sage700 }}>{value}</div>
      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: C.ink500, marginTop: '0.25rem' }}>{label}</div>
    </div>
  )
}

// ---------- Main App ----------

const SCREENS = { WELCOME: 'welcome', CHECKIN: 'checkin', PROGRESS: 'progress', CARD: 'card', DEMO: 'demo' }

export default function App() {
  const [pattern, setPattern] = useState('')
  const [startDate, setStartDate] = useState(null)
  const [checkins, setCheckins] = useState([])
  const [screen, setScreen] = useState(SCREENS.WELCOME)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Inject Google Fonts (Cormorant Garamond, Inter)
    if (typeof document !== 'undefined' && !document.getElementById('bb-fonts')) {
      const link = document.createElement('link')
      link.id = 'bb-fonts'
      link.rel = 'stylesheet'
      link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap'
      document.head.appendChild(link)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const desc = await getJSON('patroon:beschrijving', '')
      const start = await getJSON('patroon:startdatum', null)
      const all = await loadCheckins()
      if (cancelled) return
      setPattern(desc || '')
      setStartDate(start)
      setCheckins(all)
      if (desc && start) {
        const today = todayKey()
        const todayDone = all.some((c) => c.date === today)
        if (all.length >= 21) setScreen(SCREENS.CARD)
        else if (todayDone) setScreen(SCREENS.PROGRESS)
        else setScreen(SCREENS.CHECKIN)
      }
      setLoaded(true)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const today = todayKey()
  const todayDone = checkins.some((c) => c.date === today)
  const todayEntry = checkins.find((c) => c.date === today)
  const canOpenCard = checkins.length >= 21
  const daysCompleted = checkins.length

  const dayNumber = useMemo(() => {
    if (!startDate) return 1
    return Math.min(21, diffDays(new Date(), new Date(startDate + 'T00:00:00')) + 1)
  }, [startDate, today])

  async function handleStart(desc) {
    const start = dateKey(new Date())
    await setJSON('patroon:beschrijving', desc)
    await setJSON('patroon:startdatum', start)
    setPattern(desc)
    setStartDate(start)
    setScreen(SCREENS.CHECKIN)
  }

  async function handleSaveCheckin(payload) {
    await saveCheckin(today, payload)
    const fresh = await loadCheckins()
    setCheckins(fresh)
  }

  async function handleReset() {
    if (!window.confirm('Weet je zeker dat je opnieuw wil beginnen? Je huidige patroonkaart wordt gewist.')) return
    await clearAllStorage()
    setPattern('')
    setStartDate(null)
    setCheckins([])
    setScreen(SCREENS.WELCOME)
  }

  return (
    <div className="bb-paper">
      <style>{STYLES}</style>

      {!loaded && null}

      {loaded && screen === SCREENS.DEMO && (
        <PatternCard
          pattern="Ik trek me terug bij conflict"
          checkins={generateDemoCheckins()}
          isDemo
          onBack={() => setScreen(SCREENS.WELCOME)}
        />
      )}

      {loaded && (screen === SCREENS.WELCOME || !pattern || !startDate) && screen !== SCREENS.DEMO && (
        <Welcome
          initialPattern={pattern}
          onStart={handleStart}
          onDemo={() => setScreen(SCREENS.DEMO)}
        />
      )}

      {loaded && screen === SCREENS.CARD && pattern && startDate && (
        <PatternCard
          pattern={pattern}
          checkins={checkins}
          onBack={() => setScreen(SCREENS.PROGRESS)}
        />
      )}

      {loaded && screen === SCREENS.PROGRESS && pattern && startDate && (
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
      )}

      {loaded && screen === SCREENS.CHECKIN && pattern && startDate && (
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
      )}

      {loaded && pattern && startDate && screen !== SCREENS.DEMO && (
        <button
          type="button"
          onClick={handleReset}
          style={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            fontSize: 11,
            color: C.ink300,
            background: 'rgba(251, 248, 243, 0.8)',
            border: `1px solid ${C.beige200}`,
            borderRadius: 9999,
            padding: '6px 12px',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
          aria-label="Begin opnieuw"
        >
          opnieuw beginnen
        </button>
      )}
    </div>
  )
}
