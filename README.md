# JustDoad Offer Advisor (Wix Studio Integration)

This repository contains a ready-to-use chatbot/searchbar that recommends suitable offers from:

- https://eclass.justdoad.ch/de
- https://eclass.justdoad.ch/de/offers

The widget is inspired by the onboarding style used on sites like MasterClass ("What brings you here today?").

## File

- `standalone/justdoad-offer-advisor.html`  
  Standalone HTML widget (chat + smart recommendations + offer cards).
- `standalone/justdoad-offer-advisor-phone.html`  
  Mobile-first quick test version for phone screens.

## What it does

- Lets users describe their need in free text ("Ich brauche ...")
- Offers quick-start prompt chips
- Matches intent to JustDoad offers (course/package/coaching context)
- Shows top recommended possibilities with direct links
- Displays additional coaching formats:
  - Ping-Pong-Session
  - Training / Workshop
  - Hands-on-Hilfe
  - Full-Immersion

## Integrate into Wix Studio

### Option A: Fastest (Embed as iFrame)

1. Host `standalone/justdoad-offer-advisor.html` on any static host (e.g. Vercel, Netlify, S3, GitHub Pages).
2. In Wix Studio Editor:
   - Add Element -> Embed Code -> Embed a Site.
   - Paste the hosted URL.
3. Resize section to fit the widget (recommended min-height: 900px desktop / 1100px mobile).

### Option B: Paste HTML directly in Wix Embed

1. Open `standalone/justdoad-offer-advisor.html`.
2. Copy the full HTML.
3. In Wix Studio Editor:
   - Add Element -> Embed Code -> Embed HTML.
   - Paste the code.
4. Publish and test.

## Fast phone test

1. Open `standalone/justdoad-offer-advisor-phone.html`.
2. Copy all content.
3. In Wix Studio: Add Element -> Embed Code -> Embed HTML.
4. Paste, publish, and open your published Wix page on your phone.

## Data note

Offer names/prices are based on publicly visible content from the URLs above (captured June 2026).  
If JustDoad changes offers, update the `offers` array in the HTML file.
