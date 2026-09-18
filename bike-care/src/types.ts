export type WearCategory = 'brakes' | 'drivetrain' | 'wheels' | 'other'

export interface WearPart {
  id: string
  name: string
  category: WearCategory
  installedAtKm: number
  serviceIntervalKm: number
  notes?: string
  updatedAt: string
}

export interface Ride {
  id: string
  date: string
  distanceKm: number
  name: string
  source: 'manual' | 'strava'
  stravaId?: number
}

export interface MaintenanceLog {
  id: string
  partId?: string
  date: string
  note: string
  kmAtService?: number
}

export interface AppState {
  wearParts: WearPart[]
  rides: Ride[]
  maintenance: MaintenanceLog[]
  totalBikeKm: number
  stravaConnected: boolean
}

export const CATEGORY_LABELS: Record<WearCategory, string> = {
  brakes: 'Bremsen',
  drivetrain: 'Antrieb',
  wheels: 'Räder',
  other: 'Wartung',
}

export const DEFAULT_INTERVALS: Record<WearCategory, number> = {
  brakes: 1500,
  drivetrain: 3000,
  wheels: 5000,
  other: 2000,
}
