import type { Ride } from './types'

/** Demo-Routen, wenn Strava nicht verbunden ist */
export const DEMO_ROUTES: Ride[] = [
  {
    id: 'strava-demo-1',
    date: new Date().toISOString().slice(0, 10),
    distanceKm: 32.4,
    name: 'Abendrunde am Fluss',
    source: 'strava',
    stravaId: 9001,
  },
  {
    id: 'strava-demo-2',
    date: new Date(Date.now() - 86400000 * 5).toISOString().slice(0, 10),
    distanceKm: 61.2,
    name: 'Sonntags-Longride',
    source: 'strava',
    stravaId: 9002,
  },
]

export function getStravaConfig() {
  const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID as string | undefined
  const redirectUri =
    (import.meta.env.VITE_STRAVA_REDIRECT_URI as string | undefined) ||
    `${window.location.origin}/`
  return { clientId, redirectUri, configured: Boolean(clientId) }
}

/** Startet Strava OAuth (nur wenn Client-ID gesetzt). */
export function startStravaAuth(): void {
  const { clientId, redirectUri, configured } = getStravaConfig()
  if (!configured || !clientId) {
    throw new Error('Strava Client-ID fehlt (VITE_STRAVA_CLIENT_ID)')
  }
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: 'read,activity:read_all',
  })
  window.location.href = `https://www.strava.com/oauth/authorize?${params}`
}

/**
 * Aktivitäten von Strava laden.
 * MVP: ohne Backend-Proxy nur Demo; mit Token in localStorage echte API.
 */
export async function fetchStravaActivities(accessToken?: string): Promise<Ride[]> {
  if (!accessToken) return DEMO_ROUTES

  const res = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=10', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`Strava API ${res.status}`)
  const data = (await res.json()) as Array<{
    id: number
    name: string
    distance: number
    start_date_local: string
    type: string
  }>

  return data
    .filter((a) => a.type === 'Ride' || a.type === 'VirtualRide' || a.type === 'EBikeRide')
    .map((a) => ({
      id: `strava-${a.id}`,
      date: a.start_date_local.slice(0, 10),
      distanceKm: Math.round((a.distance / 1000) * 10) / 10,
      name: a.name,
      source: 'strava' as const,
      stravaId: a.id,
    }))
}

export const MAINTENANCE_TIPS = [
  'Kette nach nassen Touren abwischen und ölen — spart Zahnkränze.',
  'Bremsbeläge prüfen, wenn der Hebelweg länger wird.',
  'Reifenluftdruck vor jeder längeren Tour checken.',
  'Nach 500 km: Schaltwerk und Umlenkung reinigen.',
  'Speichenspannung bei unruhigem Laufrad prüfen lassen.',
]
