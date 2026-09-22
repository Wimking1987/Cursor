# Bike Care — Plan

Web-App zur Fahrrad-Wartung: Verschleißteile tracken, Strava-Routen anzeigen, monatliche Zusammenfassung, manuelle Eingaben. UI: dunkles Glassmorphismus-Dashboard (Referenzbild).

## Ziele

1. **Verschleißteile** manuell erfassen (Bremsen, Antrieb, Räder, …) inkl. Start-km und Intervall
2. **Strava** letzte Aktivitäten / Route via API (Fallback: Demo-Daten)
3. **Monats-Summary**: km, Fahrten, Wartungen im Monat
4. **Manuelle Einträge** ohne Strava (km, Wartung, Teilwechsel)
5. **UI** wie Referenz: Dark Mode, Soft-Cards, Orange-Akzent, 2×2-Tiles mit Badges

## Architektur

```
React + Vite + TypeScript
├── Dashboard (eine Mobile-First-Ansicht)
├── localStorage Persistenz (kein Backend in MVP)
├── Strava OAuth + REST (optional via Env)
└── Monats-Aggregation aus Fahrten + Wartungen
```

| Schicht | Technik |
|--------|---------|
| UI | React 19, CSS Variables, Lucide Icons |
| State | React state + `localStorage` |
| Strava | OAuth 2 Authorization Code, Activities API |
| Deploy | Vite static build (z. B. Netlify/Vercel) |

## Datenmodell

```ts
WearPart {
  id, name, category: 'brakes' | 'drivetrain' | 'wheels' | 'other'
  installedAtKm, serviceIntervalKm, currentKm?, notes?, updatedAt
}

ManualRide {
  id, date, distanceKm, name?, source: 'manual' | 'strava'
  stravaId?
}

MaintenanceLog {
  id, partId?, date, note, kmAtService?
}
```

**Restleben (Badge):** `interval - (aktuellerKm - installedAtKm)` → Warnung wenn niedrig.

## Screens / Layout (1:1 zum Bild)

| Widget | Inhalt |
|--------|--------|
| Oben (Datum \| Events) | Monat links, rechts Summary: km, Fahrten, Wartungen |
| 2×2 Tiles | Bremsen, Antrieb, Räder, + Teil — Badge = Rest-km |
| Quote-Karte | Wartungstipp oder letzte Strava-Highlight |
| Untere Karte | Aktuelle Route / Bike Health + Progress-Bar |
| Bottom Nav | Dashboard · Eintragen · Sync/Settings |

## Strava

1. App auf [strava.com/settings/api](https://www.strava.com/settings/api) anlegen
2. Env: `VITE_STRAVA_CLIENT_ID`, `VITE_STRAVA_CLIENT_SECRET` (Secret nur über Backend/Proxy in Produktion)
3. OAuth → Token in `localStorage` (MVP)
4. `GET /athlete/activities` → Distanz aufs Rad anrechnen
5. Ohne Credentials: Demo-Modus mit Beispieldaten

**Hinweis Produktion:** Client Secret nicht im Frontend; kleiner Proxy (Cloud Function) empfohlen.

## Manuelle Eingabe

- Formular: Distanz (km), Datum, optional Name
- Formular: Verschleißteil (Kategorie, Name, Intervall, Start-km)
- Formular: Wartung erledigt (setzt `installedAtKm` neu)

## Monats-Summary

Pro Kalendermonat aus allen Fahrten (manual + Strava):

- Summe km
- Anzahl Fahrten
- Anzahl Wartungen
- Optional: Vergleich Vormonat

## Phasen

### Phase 1 — MVP (dieses Repo)
- [x] Dark-Glass Dashboard
- [x] Verschleißteile CRUD (localStorage)
- [x] Manuelle km-Einträge
- [x] Monats-Summary
- [x] Strava Demo + Hook für echte API
- [x] Bottom Nav + Eintragen-Flow

### Phase 2
- [ ] Strava OAuth mit Secure Proxy
- [ ] Mehrere Räder / Profile
- [ ] Push-/E-Mail-Erinnerung bei niedrigem Rest-km
- [ ] Export CSV/PDF Monatsreport

### Phase 3
- [ ] Accounts / Sync (Supabase o. ä.)
- [ ] Foto vom Teil / Rechnung
- [ ] PWA Install + Offline

## Design-Tokens

```css
--bg: #1a1625;
--card: #2a2438;
--accent: #ff6b4a;
--text: #f5f3f0;
--muted: #9a94a8;
--radius: 24px;
```

## Starten

```bash
cd bike-care
npm install
npm run dev
```

Optional `.env`:

```
VITE_STRAVA_CLIENT_ID=...
VITE_STRAVA_REDIRECT_URI=http://localhost:5173
```
