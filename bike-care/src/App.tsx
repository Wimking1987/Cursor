import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Bike,
  CalendarDays,
  CircleDot,
  Disc,
  Home,
  Link2,
  MapPinned,
  Plus,
  Settings2,
  Wrench,
} from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import type { AppState, WearCategory, WearPart } from './types'
import { CATEGORY_LABELS, DEFAULT_INTERVALS } from './types'
import {
  addRide,
  addWearPart,
  loadState,
  monthSummary,
  remainingKm,
  servicePart,
  wearProgress,
} from './storage'
import {
  DEMO_ROUTES,
  MAINTENANCE_TIPS,
  fetchStravaActivities,
  getStravaConfig,
  startStravaAuth,
} from './strava'
import './index.css'

type Tab = 'dashboard' | 'add' | 'settings'
type AddMode = 'ride' | 'part' | 'service'

const CATEGORY_ICONS: Record<WearCategory, typeof Disc> = {
  brakes: Disc,
  drivetrain: Link2,
  wheels: CircleDot,
  other: Wrench,
}

function BrandHeader() {
  return (
    <header className="brand">
      <div className="brand-mark" aria-hidden>
        <Bike size={22} strokeWidth={1.8} />
      </div>
      <h1>NOAH&apos;S Garage</h1>
      <p>Bike Care · Verschleiß · Strava</p>
    </header>
  )
}

function StatusBar() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="status-row">
      <span className="clock">{format(now, 'HH.mm')}</span>
      <span>Kunde-Demo</span>
    </div>
  )
}

function SummaryCard({ state }: { state: AppState }) {
  const now = new Date()
  const summary = monthSummary(state, now.getFullYear(), now.getMonth())
  return (
    <section className="card summary-card" aria-label="Monats-Zusammenfassung">
      <div className="summary-left">
        <div className="month">{format(now, 'MMMM', { locale: de })}</div>
        <div className="day">{format(now, 'd')}</div>
        <div className="weekday">{format(now, 'EEEE', { locale: de })}</div>
      </div>
      <div className="divider" aria-hidden />
      <div className="summary-right">
        <div className="label-row">
          <span>Summary</span>
          <CalendarDays size={14} />
        </div>
        <div className="event-item">
          <strong>{summary.km} km</strong>
          <span>diesen Monat</span>
        </div>
        <div className="event-item">
          <strong>{summary.rideCount} Fahrten</strong>
          <span>{summary.maintenanceCount} Wartungen</span>
        </div>
      </div>
    </section>
  )
}

function WearTiles({
  parts,
  totalKm,
  onSelect,
}: {
  parts: WearPart[]
  totalKm: number
  onSelect: (id: string) => void
}) {
  const shown = parts.slice(0, 4)
  while (shown.length < 4) {
    shown.push({
      id: `empty-${shown.length}`,
      name: 'Teil hinzufügen',
      category: 'other',
      installedAtKm: totalKm,
      serviceIntervalKm: 1,
      updatedAt: '',
    })
  }

  return (
    <div className="tile-grid">
      {shown.map((part) => {
        const Icon = CATEGORY_ICONS[part.category]
        const isEmpty = part.id.startsWith('empty-')
        const rem = isEmpty ? null : remainingKm(part, totalKm)
        const badgeClass =
          rem == null ? '' : rem < 200 ? '' : rem < 500 ? 'warn' : 'ok'
        return (
          <button
            key={part.id}
            type="button"
            className="tile"
            onClick={() => !isEmpty && onSelect(part.id)}
            aria-label={part.name}
          >
            {!isEmpty && rem != null && (
              <span className={`badge ${badgeClass}`} title="Rest-km">
                {rem > 999 ? `${Math.round(rem / 1000)}k` : rem}
              </span>
            )}
            <span className="icon-wrap">
              {isEmpty ? <Plus size={22} /> : <Icon size={22} strokeWidth={1.6} />}
            </span>
            <label>{isEmpty ? 'Neu' : CATEGORY_LABELS[part.category]}</label>
          </button>
        )
      })}
    </div>
  )
}

function TipCard() {
  const tip = useMemo(() => {
    const i = new Date().getDate() % MAINTENANCE_TIPS.length
    return MAINTENANCE_TIPS[i]
  }, [])
  return (
    <aside className="tip-card">
      <div className="eyebrow">Wartungstipp</div>
      <blockquote>{tip}</blockquote>
    </aside>
  )
}

function RouteCard({ state }: { state: AppState }) {
  const latest =
    [...state.rides].sort((a, b) => b.date.localeCompare(a.date))[0] ?? DEMO_ROUTES[0]
  const critical = state.wearParts
    .map((p) => ({ p, rem: remainingKm(p, state.totalBikeKm), prog: wearProgress(p, state.totalBikeKm) }))
    .sort((a, b) => a.rem - b.rem)[0]

  return (
    <section className="card route-card" aria-label="Aktuelle Route">
      <div className="route-thumb">
        <MapPinned size={24} />
      </div>
      <div className="route-meta">
        <h3>{latest.name}</h3>
        <p>
          {latest.distanceKm} km · {latest.source === 'strava' ? 'Strava' : 'Manuell'} ·{' '}
          {format(new Date(latest.date), 'dd.MM.')}
        </p>
        <div className="progress" title={critical ? `${critical.p.name}: ${critical.rem} km Rest` : ''}>
          <span style={{ width: `${critical?.prog ?? 40}%` }} />
        </div>
      </div>
      <div className="brand-pill" title="Strava / Activity">
        <Activity size={14} />
      </div>
    </section>
  )
}

function AddPanel({
  state,
  setState,
  onDone,
}: {
  state: AppState
  setState: (s: AppState) => void
  onDone: () => void
}) {
  const [mode, setMode] = useState<AddMode>('ride')
  const [toast, setToast] = useState<string | null>(null)

  function flash(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  function submitRide(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const distanceKm = Number(fd.get('distance'))
    const name = String(fd.get('name') || 'Manuelle Fahrt')
    const date = String(fd.get('date'))
    if (!distanceKm || distanceKm <= 0) return
    setState(addRide(state, { distanceKm, name, date, source: 'manual' }))
    flash('Fahrt gespeichert')
    e.currentTarget.reset()
    onDone()
  }

  function submitPart(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const category = String(fd.get('category')) as WearCategory
    const name = String(fd.get('name') || CATEGORY_LABELS[category])
    const serviceIntervalKm = Number(fd.get('interval')) || DEFAULT_INTERVALS[category]
    setState(
      addWearPart(state, {
        name,
        category,
        installedAtKm: state.totalBikeKm,
        serviceIntervalKm,
        notes: String(fd.get('notes') || ''),
      }),
    )
    flash('Verschleißteil angelegt')
    e.currentTarget.reset()
    onDone()
  }

  function submitService(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const partId = String(fd.get('partId'))
    const note = String(fd.get('note') || 'Wartung erledigt')
    setState(servicePart(state, partId, note))
    flash('Wartung eingetragen')
    e.currentTarget.reset()
    onDone()
  }

  return (
    <div className="panel">
      <h2>Manuell eintragen</h2>
      <div className="tabs" role="tablist">
        {(
          [
            ['ride', 'Fahrt'],
            ['part', 'Teil'],
            ['service', 'Wartung'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={mode === id ? 'active' : ''}
            onClick={() => setMode(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'ride' && (
        <form className="form" onSubmit={submitRide}>
          <label>
            Distanz (km)
            <input name="distance" type="number" step="0.1" min="0.1" required placeholder="32.5" />
          </label>
          <label>
            Name
            <input name="name" type="text" placeholder="Abendrunde" />
          </label>
          <label>
            Datum
            <input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
          </label>
          <button className="btn-primary" type="submit">
            Fahrt speichern
          </button>
        </form>
      )}

      {mode === 'part' && (
        <form className="form" onSubmit={submitPart}>
          <label>
            Kategorie
            <select name="category" defaultValue="brakes">
              {(Object.keys(CATEGORY_LABELS) as WearCategory[]).map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Bezeichnung
            <input name="name" type="text" placeholder="z. B. Scheibenbeläge" />
          </label>
          <label>
            Service-Intervall (km)
            <input name="interval" type="number" min="100" placeholder="1500" />
          </label>
          <label>
            Notiz
            <textarea name="notes" rows={2} placeholder="optional" />
          </label>
          <button className="btn-primary" type="submit">
            Teil anlegen
          </button>
        </form>
      )}

      {mode === 'service' && (
        <form className="form" onSubmit={submitService}>
          <label>
            Verschleißteil
            <select name="partId" required>
              {state.wearParts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({CATEGORY_LABELS[p.category]})
                </option>
              ))}
            </select>
          </label>
          <label>
            Notiz
            <input name="note" type="text" placeholder="Beläge gewechselt" />
          </label>
          <button className="btn-primary" type="submit">
            Wartung speichern
          </button>
        </form>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

function SettingsPanel({
  state,
  setState,
}: {
  state: AppState
  setState: (s: AppState) => void
}) {
  const { configured } = getStravaConfig()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function syncDemo() {
    setBusy(true)
    try {
      const activities = await fetchStravaActivities()
      let next = { ...state }
      for (const ride of activities) {
        if (next.rides.some((r) => r.stravaId && r.stravaId === ride.stravaId)) continue
        next = addRide(next, {
          date: ride.date,
          distanceKm: ride.distanceKm,
          name: ride.name,
          source: 'strava',
          stravaId: ride.stravaId,
        })
      }
      next = { ...next, stravaConnected: true }
      setState(next)
      setMsg('Demo-Routen synchronisiert')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Sync fehlgeschlagen')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="panel">
      <h2>Einstellungen</h2>
      <section className="card settings-block">
        <h3>Strava</h3>
        <p>
          {configured
            ? 'Client-ID gefunden — OAuth starten oder Demo nutzen.'
            : 'Keine Client-ID gesetzt. Demo-Modus verfügbar. Für echte Sync: VITE_STRAVA_CLIENT_ID in .env.'}
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn-primary" type="button" disabled={busy} onClick={syncDemo}>
            {busy ? '…' : 'Demo-Routen laden'}
          </button>
          {configured && (
            <button className="btn-ghost" type="button" onClick={() => startStravaAuth()}>
              Mit Strava verbinden
            </button>
          )}
        </div>
        {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
        {state.stravaConnected && (
          <p style={{ marginTop: 8, color: 'var(--accent)' }}>Strava/Demo aktiv</p>
        )}
      </section>

      <section className="card settings-block">
        <h3>Gesamt-Kilometerstand</h3>
        <p>Aktuell: {state.totalBikeKm} km am Rad</p>
      </section>

      <section className="card settings-block">
        <h3>Verschleißteile</h3>
        <div className="list">
          {state.wearParts.map((p) => (
            <div key={p.id} className="list-item" style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
              <div>
                <h4>
                  {p.name} · {CATEGORY_LABELS[p.category]}
                </h4>
                <p>
                  Rest {remainingKm(p, state.totalBikeKm)} km von {p.serviceIntervalKm} km Intervall
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [state, setState] = useState<AppState>(() => loadState())
  const [selectedPart, setSelectedPart] = useState<string | null>(null)

  useEffect(() => {
    const part = state.wearParts.find((p) => p.id === selectedPart)
    if (!part) return
    const rem = remainingKm(part, state.totalBikeKm)
    // brief focus: switch to add/service when tapping a tile
    setTab('add')
    setSelectedPart(null)
    void rem
  }, [selectedPart, state])

  return (
    <div className="app-shell">
      <BrandHeader />
      <StatusBar />

      {tab === 'dashboard' && (
        <>
          <SummaryCard state={state} />
          <div className="mid-row">
            <WearTiles
              parts={state.wearParts}
              totalKm={state.totalBikeKm}
              onSelect={(id) => setSelectedPart(id)}
            />
            <TipCard />
          </div>
          <RouteCard state={state} />
        </>
      )}

      {tab === 'add' && (
        <AddPanel state={state} setState={setState} onDone={() => setTab('dashboard')} />
      )}

      {tab === 'settings' && <SettingsPanel state={state} setState={setState} />}

      <nav className="bottom-nav" aria-label="Hauptnavigation">
        <button
          type="button"
          className={`nav-btn ${tab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setTab('dashboard')}
        >
          <Home size={20} />
          Dashboard
        </button>
        <button
          type="button"
          className={`nav-btn ${tab === 'add' ? 'active' : ''}`}
          onClick={() => setTab('add')}
        >
          <Plus size={20} />
          Eintragen
        </button>
        <button
          type="button"
          className={`nav-btn ${tab === 'settings' ? 'active' : ''}`}
          onClick={() => setTab('settings')}
        >
          <Settings2 size={20} />
          Sync
        </button>
      </nav>
    </div>
  )
}
