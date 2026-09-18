import type { AppState, MaintenanceLog, Ride, WearPart } from './types'

export type { AppState }

const KEY = 'bike-care-v1'

const seed: AppState = {
  totalBikeKm: 1247,
  stravaConnected: false,
  wearParts: [
    {
      id: 'wp-brakes',
      name: 'Bremsbeläge',
      category: 'brakes',
      installedAtKm: 900,
      serviceIntervalKm: 1500,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'wp-drive',
      name: 'Kette',
      category: 'drivetrain',
      installedAtKm: 400,
      serviceIntervalKm: 3000,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'wp-wheels',
      name: 'Reifen',
      category: 'wheels',
      installedAtKm: 200,
      serviceIntervalKm: 5000,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'wp-cables',
      name: 'Züge',
      category: 'other',
      installedAtKm: 1000,
      serviceIntervalKm: 2000,
      updatedAt: new Date().toISOString(),
    },
  ],
  rides: [
    {
      id: 'r1',
      date: new Date().toISOString().slice(0, 10),
      distanceKm: 32.4,
      name: 'Abendrunde am Fluss',
      source: 'strava',
      stravaId: 1,
    },
    {
      id: 'r2',
      date: daysAgo(3),
      distanceKm: 48.1,
      name: 'Wochenend-Tour',
      source: 'manual',
    },
    {
      id: 'r3',
      date: daysAgo(8),
      distanceKm: 21.0,
      name: 'Pendeln',
      source: 'manual',
    },
    {
      id: 'r4',
      date: daysAgo(12),
      distanceKm: 55.6,
      name: 'Bergtour',
      source: 'strava',
      stravaId: 2,
    },
  ],
  maintenance: [
    {
      id: 'm1',
      partId: 'wp-brakes',
      date: daysAgo(20),
      note: 'Beläge geprüft',
      kmAtService: 900,
    },
  ],
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      localStorage.setItem(KEY, JSON.stringify(seed))
      return structuredClone(seed)
    }
    return JSON.parse(raw) as AppState
  } catch {
    return structuredClone(seed)
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function remainingKm(part: WearPart, totalBikeKm: number): number {
  const used = Math.max(0, totalBikeKm - part.installedAtKm)
  return Math.max(0, Math.round(part.serviceIntervalKm - used))
}

export function wearProgress(part: WearPart, totalBikeKm: number): number {
  const used = Math.max(0, totalBikeKm - part.installedAtKm)
  return Math.min(100, Math.round((used / part.serviceIntervalKm) * 100))
}

export function uid(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

export function addRide(state: AppState, ride: Omit<Ride, 'id'>): AppState {
  const next: AppState = {
    ...state,
    rides: [{ ...ride, id: uid('ride') }, ...state.rides],
    totalBikeKm: Math.round((state.totalBikeKm + ride.distanceKm) * 10) / 10,
  }
  saveState(next)
  return next
}

export function addWearPart(state: AppState, part: Omit<WearPart, 'id' | 'updatedAt'>): AppState {
  const next: AppState = {
    ...state,
    wearParts: [
      ...state.wearParts,
      { ...part, id: uid('wp'), updatedAt: new Date().toISOString() },
    ],
  }
  saveState(next)
  return next
}

export function servicePart(state: AppState, partId: string, note: string): AppState {
  const part = state.wearParts.find((p) => p.id === partId)
  if (!part) return state
  const log: MaintenanceLog = {
    id: uid('m'),
    partId,
    date: new Date().toISOString().slice(0, 10),
    note,
    kmAtService: state.totalBikeKm,
  }
  const next: AppState = {
    ...state,
    wearParts: state.wearParts.map((p) =>
      p.id === partId
        ? { ...p, installedAtKm: state.totalBikeKm, updatedAt: new Date().toISOString() }
        : p,
    ),
    maintenance: [log, ...state.maintenance],
  }
  saveState(next)
  return next
}

export function monthSummary(state: AppState, year: number, month: number) {
  const rides = state.rides.filter((r) => {
    const d = new Date(r.date)
    return d.getFullYear() === year && d.getMonth() === month
  })
  const maintenance = state.maintenance.filter((m) => {
    const d = new Date(m.date)
    return d.getFullYear() === year && d.getMonth() === month
  })
  const km = rides.reduce((s, r) => s + r.distanceKm, 0)
  return {
    km: Math.round(km * 10) / 10,
    rideCount: rides.length,
    maintenanceCount: maintenance.length,
    rides,
  }
}
