import { WEEKDAY_LABELS, weekdayIndex } from './dates.js'

const STOP_WORDS = new Set([
  'de', 'het', 'een', 'en', 'of', 'maar', 'want', 'dus', 'als', 'dan', 'toen',
  'ik', 'jij', 'je', 'hij', 'zij', 'wij', 'ze', 'we', 'mij', 'me', 'mijn', 'jouw',
  'ben', 'is', 'was', 'zijn', 'word', 'wordt', 'heb', 'had', 'heeft', 'hebben',
  'in', 'op', 'aan', 'bij', 'met', 'van', 'voor', 'naar', 'om', 'door', 'over',
  'er', 'dat', 'die', 'dit', 'deze', 'wat', 'wie', 'waar', 'hoe', 'niet', 'wel',
  'nog', 'al', 'ook', 'maar', 'heel', 'erg', 'zo', 'te', 'tot', 'uit', 'af',
  'iemand', 'iets', 'mensen', 'mens', 'mn', 'm', 'n',
])

const THEME_GROUPS = [
  { label: 'Werk en collegas', words: ['werk', 'collega', 'baas', 'kantoor', 'vergadering', 'meeting', 'manager', 'leidinggevende', 'klant', 'project', 'deadline'] },
  { label: 'Partner', words: ['partner', 'vriend', 'vriendin', 'man', 'vrouw', 'relatie', 'liefde'] },
  { label: 'Familie', words: ['moeder', 'vader', 'ma', 'pa', 'mama', 'papa', 'zus', 'broer', 'familie', 'ouder', 'ouders', 'schoonmoeder'] },
  { label: 'Kinderen', words: ['kind', 'kinderen', 'zoon', 'dochter', 'baby', 'puber'] },
  { label: 'Vrienden en sociaal', words: ['vriend', 'vriendin', 'feest', 'verjaardag', 'borrel', 'sociaal', 'groep'] },
  { label: 'Conflict en kritiek', words: ['ruzie', 'conflict', 'kritiek', 'boos', 'woede', 'discussie', 'verwijt'] },
  { label: 'Geld en financien', words: ['geld', 'rekening', 'belasting', 'salaris', 'kosten', 'koop'] },
  { label: 'Lichaam en gezondheid', words: ['ziek', 'pijn', 'moe', 'lichaam', 'arts', 'huisarts', 'dokter'] },
  { label: 'Onderweg en verkeer', words: ['auto', 'file', 'trein', 'fiets', 'verkeer', 'weg', 'rijden'] },
  { label: 'Huishouden', words: ['huis', 'koken', 'eten', 'opruimen', 'wassen', 'huishouden', 'boodschappen'] },
]

const BODY_LABELS = {
  borst: 'Borst',
  buik: 'Buik',
  keel: 'Keel',
  hoofd: 'Hoofd',
  schouders: 'Schouders',
  anders: 'Anders',
}

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
}

export function analyze(checkins) {
  const triggered = checkins.filter((c) => c.triggered)

  // Weekday distribution
  const weekdayCounts = Array(7).fill(0)
  for (const c of triggered) {
    const idx = weekdayIndex(c.date)
    weekdayCounts[idx] += 1
  }
  const weekday = WEEKDAY_LABELS.map((label, i) => ({ day: label, count: weekdayCounts[i] }))

  // Themes: group by predefined buckets, fall back to keyword frequency
  const themeCounts = {}
  for (const c of triggered) {
    const tokens = tokenize(c.situation)
    const matched = new Set()
    for (const group of THEME_GROUPS) {
      if (tokens.some((t) => group.words.some((w) => t.includes(w) || w.includes(t)))) {
        matched.add(group.label)
      }
    }
    if (matched.size === 0 && tokens.length > 0) {
      matched.add('Overig')
    }
    for (const m of matched) {
      themeCounts[m] = (themeCounts[m] || 0) + 1
    }
  }
  const themes = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label, count]) => ({ label, count }))

  // Body sensations
  const bodyCounts = {}
  for (const c of triggered) {
    if (c.body) bodyCounts[c.body] = (bodyCounts[c.body] || 0) + 1
  }
  const body = Object.keys(BODY_LABELS).map((k) => ({
    key: k,
    label: BODY_LABELS[k],
    count: bodyCounts[k] || 0,
  }))

  // Age buckets
  const ageBuckets = [
    { label: '0-6', min: 0, max: 6, count: 0 },
    { label: '7-12', min: 7, max: 12, count: 0 },
    { label: '13-18', min: 13, max: 18, count: 0 },
    { label: 'Volwassen', min: 19, max: 200, count: 0 },
    { label: 'Onbekend', min: null, max: null, count: 0 },
  ]
  for (const c of triggered) {
    if (c.age == null || c.age === 'unknown') {
      ageBuckets[4].count += 1
    } else {
      const a = Number(c.age)
      const bucket = ageBuckets.find((b) => b.min != null && a >= b.min && a <= b.max)
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

export function interpret(result, patternDescription) {
  const { weekday, themes, body, ageBuckets, totals } = result
  const sentences = []

  if (totals.triggeredDays === 0) {
    return 'In deze 21 dagen heb je geen momenten geregistreerd. Dat is op zichzelf ook een uitkomst, soms wordt een patroon stiller zodra je het bewust gaat zien.'
  }

  sentences.push(
    `In 21 dagen werd je patroon ${totals.triggeredDays} keer geraakt, ongeveer ${Math.round(
      totals.triggerRate * 100,
    )} procent van de dagen.`,
  )

  const topDay = [...weekday].sort((a, b) => b.count - a.count)[0]
  if (topDay && topDay.count > 0) {
    const names = { ma: 'maandag', di: 'dinsdag', wo: 'woensdag', do: 'donderdag', vr: 'vrijdag', za: 'zaterdag', zo: 'zondag' }
    sentences.push(`Het meest voelde je dit op ${names[topDay.day] || topDay.day}.`)
  }

  if (themes.length > 0) {
    if (themes.length === 1) {
      sentences.push(`De situaties draaiden vooral om ${themes[0].label.toLowerCase()}.`)
    } else {
      const names = themes.map((t) => t.label.toLowerCase()).join(', ')
      sentences.push(`De situaties draaiden vooral om ${names}.`)
    }
  }

  const topBody = [...body].sort((a, b) => b.count - a.count)[0]
  if (topBody && topBody.count > 0) {
    sentences.push(`In je lichaam kwam het vooral terug in je ${topBody.label.toLowerCase()}.`)
  }

  const topAge = [...ageBuckets].sort((a, b) => b.count - a.count)[0]
  if (topAge && topAge.count > 0 && topAge.label !== 'Onbekend') {
    if (topAge.label === 'Volwassen') {
      sentences.push('De leeftijd die het meest meekwam, voelde volwassen.')
    } else {
      sentences.push(`De leeftijd die het meest meekwam, lag rond ${topAge.label} jaar.`)
    }
  }

  if (patternDescription) {
    sentences.push(
      `Dit is wat je hebt verzameld rond, "${patternDescription}". Een patroonkaart geeft een richting, geen diagnose.`,
    )
  }

  return sentences.join(' ')
}

export function generateDemoCheckins() {
  // 21 days of realistic dummy data
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
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const date = `${yyyy}-${mm}-${dd}`
    const s = samples[i]
    out.push({ date, ...s })
  }
  return out
}
