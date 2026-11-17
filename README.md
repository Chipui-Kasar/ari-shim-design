# Pharmacy Interior Designer

A complete, interactive **3D pharmacy interior** – 9 ft × 12 ft × 10 ft (108 sq ft) – built with
**Next.js (App Router) · React · TypeScript · Tailwind CSS · Three.js · @react-three/fiber · @react-three/drei · Zustand**.

Everything in the scene is real 3D geometry (walls, floor, ceiling, door, shelves, counter, drawers, workstation,
lights, signage and every product pack). There are no flat-image interiors and **no external textures or models** –
wood, tile and label textures are generated procedurally, so nothing can fail to load.

## Run it

Requires Node.js 20.9+ (tested on Node 22).

```bash
npm install
npm run dev          # http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

Other scripts:

| Script              | What it does                                                                        |
| ------------------- | ----------------------------------------------------------------------------------- |
| `npm run typecheck` | Strict TypeScript check                                                             |
| `npm run validate`  | Headless **final design validation** + a 500-case stress test of the layout engine |

## The approved layout

Plan view – the **front is completely open (no front wall)**; you are standing outside looking in
(left is left, right is right):

```
╔══════════════════════════════════════════════════════════╗
║▒▒▒▒▒▒▒▒▒ BACK: closed stock cabinets, 12" deep ▒▒▒▒▒▒▒▒▒▒║
╟──────────────────────────────────────────────────────────╢
║COSM- │                  │                          │█████║
║ETICS │                  │                          │█████║
║▓▓▓▓▓▓│                  │      OTC / medicine      │█████║
║▓▓▓▓▓▓│  CUSTOMER AISLE  │    (open floor behind    │█████║
║▓▓▓▓▓▓│                  │       the counter)       │█████║
║▓▓▓▓▓▓│                  │                          │█████║
║▓▓▓▓▓▓│                  │                          │█████║
║11'0" │                  │                          │█████║
║▓▓▓▓▓▓│                  │▒▒▒▒▒▒▒▒▒▒│               │█████║
║▓▓▓▓▓▓│                  │▒▒▒▒▒▒▒▒▒▒│   PHARMACIST  │█████║
║▓▓▓▓▓▓│                  │ COUNTER  │    working    │█████║
║▓▓▓▓▓▓│                  │ side leg │     pocket    │█████║
║▓▓▓▓▓▓│    36" aisle     │20"x7'-0" │    30" wide   │█████║
║▓▓▓▓▓▓│                  │▒▒▒▒▒▒▒▒▒▒│    64" deep   │█████║
║▓▓▓▓▓▓│                  │▒▒▒▒▒▒▒▒▒▒│    monitor    │█████║
║▓▓▓▓▓▓│                  │▒▒▒▒▒▒▒▒▒▒│    open at    │█████║
║▓▓▓▓▓▓│                  │▒▒▒▒▒▒▒▒▒▒│    the back   │█████║
║▓▓▓▓▓▓│                  │▒▒▒▒▒▒▒▒▒▒│               │█████║
║▓▓▓▓▓▓│                  │▒▒▒▒▒▒▒▒▒▒│               │█████║
║▓▓▓▓▓▓│                  │▒COUNTER TABLE  5'-0" x 1'-8" ▒▒║
║▓▓▓▓▓▓│                  │▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒║
║▓▓▓▓▓▓│                  │◜ curved corner faces the street║
╚══════╧══════════════════╧                                ╝
        ╞═ GLASS DOOR 36", swung fully open ═╡   OPEN FRONT – no wall
```

* **LEFT wall** – 11'-0" run of cosmetics shelving: natural-oak shelves in an aluminium frame, 12" closed plinth,
  shelves from 1 ft up to 7'-6", LED strip under every shelf, two glass premium bays, category signage.
* **OPEN FRONT** – no front wall. A slim fascia beam spans the top carrying the back-lit **KK PHARMACY – Medicine & Cosmetics** signboard (styled on the supplied reference); the aluminium-framed glass
  door is swung **fully open** (folded flat outside the left wall) so the whole width is open to the street.
* **RIGHT-FRONT corner** – the **L-shaped counter table** (7'-0" side leg × 5'-0" front table, 20" deep, 36" high) stands
  at the open front with its **rounded corner facing the street**: fluted oak front, solid-surface top, LED toe-kick glow,
  KK Pharmacy signboard panel, lockable drawers, under-counter storage, monitor, keyboard, mouse, POS terminal, receipt
  printer, barcode scanner and hidden-cable grommets. The pharmacist works inside the L (30" × 64", open at the back) with Rx racks on the
  right wall in one straight run.
* **RIGHT wall** – ONE straight run of racks (no L): Rx racks behind the counter side leg, continuing into open OTC
  shelving (first-aid, vitamins, healthcare devices), plus a wall-hung shelf unit above the counter table.
* **BACK wall** – full-width closed stock cabinets in the same white-laminate system as the right wall.

### Dimension budget (verified by `npm run validate`)

| Across the width            |          | Along the right wall (front → back)  |          |
| --------------------------- | -------- | ------------------------------------ | -------- |
| Cosmetics shelving          | 12"      | Counter table (front)                | 20"      |
| Customer aisle              | **36"**  | Pharmacist pocket + Rx racks         | 64"      |
| Counter                     | 20"      | OTC shelving / open floor            | 48"      |
| Pharmacist zone             | 30"      | Back cabinets                        | 12"      |
| Medicine rack               | 10"      |                                      |          |
| **Total**                   | **108"** | **Total**                            | **144"** |

## Using the app

**Bottom toolbar – camera views**

| View        | What you get                                                                                          |
| ----------- | ----------------------------------------------------------------------------------------------------- |
| 3D View     | Professional perspective from the open front, ceiling removed – the whole interior at once           |
| Floor Plan  | Bird's-eye plan with dimension lines and zone labels                                                  |
| Front View  | From the entrance down the aisle to the back wall                                                     |
| Left View   | Section-cut elevation of the cosmetics wall                                                           |
| Right View  | Section-cut elevation of the counter and medicine racks                                               |
| Walkthrough | First person: start on the pavement outside the open front, walk in and down the aisle (collision detection) |

* **Orbit / pan / zoom**: left-drag, right-drag, scroll (one/two-finger touch on tablets). **Reset view** is in the top bar.
* **Walkthrough**: click the viewport to capture the mouse (or just drag to look) · `W A S D` / arrows to walk · `Shift` to run ·
  `Esc` releases the cursor. Touch devices get an on-screen D-pad.
* **Click any fixture** (or pick it in *Furniture & fixtures*) to select it. The right sidebar shows its dimensions,
  position, material and colour; the 3D view outlines it with its overall size.
* **Left sidebar** – room size and ceiling height, cosmetics shelving, medicine shelving, counter design, materials &
  colours, lighting (intensity, 2700–6500 K, downlights / shelf LEDs / cove / counter glow, render quality), per-wall
  Show / Ghost / Hide toggles, **Complete cutaway**, and a live **layout validation** panel.
* Dimensions are shown in **feet and inches** (inputs are in inches).

Every edit re-flows the layout through one normaliser (`lib/layout.ts`), so fixtures can never overlap each other,
cross a wall or exceed the ceiling – no matter what the sliders do.

## Project structure

```
app/                       layout.tsx · page.tsx · globals.css
components/
  editor/                  EditorLayout · TopBar · Sidebar · PropertiesPanel · Toolbar · Viewer · WalkthroughHud · ui · icons
  scene/                   PharmacyScene (Canvas + post-processing) · Room · Walls · Floor · Ceiling · Entrance
                           CosmeticsShelves · CosmeticsProducts · PharmacyCounter · Workstation
                           MedicineShelves · MedicineProducts · ProductInstances · Lighting
                           CameraControls · Walkthrough · Dimensions · SelectionBox · primitives
store/pharmacyStore.ts     Zustand store (config, derived layout, view, walls, selection, UI)
types/pharmacy.ts          Shared types
lib/
  layout.ts                Layout engine, constraint normaliser, validation checks
  views.ts                 Camera presets per view (incl. section cuts)
  materials.ts             Procedural PBR materials (oak, tile, laminate, aluminium, glass)
  products.ts              Product catalogue (fictional brands, real pack sizes)
  productGeometry.ts       3D geometry for tubes, pump bottles, jars, cans, perfume flacons, cartons
  labelTexture.ts          Canvas labels / signage (real, legible text)
  shelfGrid.ts · grids.ts · shelfFill.ts   Shelf maths + product placement (shared by structure & products)
scripts/validate-layout.ts Final design validation + stress test
```

The 3D scene is **separate from the UI** and loaded with `next/dynamic` (`ssr: false`), so Three.js never runs on the
server.

## Rendering & performance notes

* **Unit = 1 inch** everywhere in the scene, so physical proportions are exact.
* PBR materials, soft shadows (two shadow-casting spot lights), **N8AO ambient occlusion**, bloom on the LED strips,
  ACES filmic tone mapping, SMAA. Reflections come from a procedural light-former environment (no HDRI download).
* All products are **instanced** – each pack design is 1–3 `InstancedMesh`es, so the ~1,175 products (65 pack designs) cost only a few dozen draw calls.
* *Render quality* (Lighting panel): **Fast** drops AO/bloom/AA for weaker GPUs, **Balanced** halves AO resolution,
  **Best** is the full pipeline.
* A WebGL error boundary shows a friendly message if the browser can't create a GL context.

## Notes

* All brand names (KK Care, Silken, Vitalis, …) are fictional and every label is drawn from the catalogue strings.
* Fixtures are wall-anchored; position is displayed on the selected object but changes by resizing (the layout engine
  re-flows everything), not by free dragging.
* `AGENTS.md` is written by `next dev` itself; it is harmless.
# ari-shim-design
