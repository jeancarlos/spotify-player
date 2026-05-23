# Home Refactor — Design Spec

**Date:** 2026-05-22
**Scope:** Home layout, VinylCard, arc carousel animation, disk entrance

---

## Goal

Bring the Home screen in line with the wireframe diagram: disk animates in from the bottom, arc carousel explodes outward from the disk after it lands, track info is always visible below each cover, no navigation arrows.

---

## 1. Layout — `Home.tsx`

Remove `offsetDeg` state and the two `<button>` navigation elements (ChevronLeft / ChevronRight).

Limit recently-played tracks to **7** (fits the arc on a ~390 px screen without overlap).

Visual hierarchy (top → bottom):

```
AppShell TopBar (unchanged)
SearchBar — fixed top-14, already present
"músicas mais recentes" heading — pt-36, text-center
ArcCarousel — centered, sits above the vinyl
VinylDisk — absolute bottom-0, animated entrance
```

The container height stays around 580 px. The disk (`size="lg"`, 560 px) is centered and half-clipped at the bottom (`bottom-0`), identical to the current positioning.

---

## 2. Disk entrance animation

Wrap the `VinylDisk` in a `motion.div` with:

```
initial:  { scale: 0.6, y: 80, opacity: 0 }
animate:  { scale: 1,   y: 0,  opacity: 1 }
transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1], delay: 0.1 }
```

Total disk animation duration: **~0.7 s** (0.1 delay + 0.6 duration).

The Login disk continues to exit via `y: '-110vh'` (unchanged).

---

## 3. Arc carousel — explode from disk center

After the disk lands, each card slides and fades in **from the disk center outward** to its arc position.

In `ArcCarousel` (or the `motion.div` wrappers inside it), each item starts at the disk center and animates to its computed `(pos.x, pos.y)`:

```
initial:  { x: 0, y: 0, opacity: 0, scale: 0.4 }
animate:  { x: pos.x, y: pos.y - 60, opacity: 1, scale: 1 }
transition: {
  type: 'spring', stiffness: 220, damping: 22,
  delay: DISK_DONE_DELAY + i * 0.06   // DISK_DONE_DELAY ≈ 0.75s
}
```

Stagger of 0.06 s per item gives a fan-opening effect.

### ArcCarousel parameter adjustments

| Param    | Before | After | Reason |
|----------|--------|-------|--------|
| `radius` | 280    | 220   | Tighter fit for 7 items on narrow screens |
| `arcDeg` | 140    | 110   | Reduces overlap with taller cards (image + text) |

`calcArcPositions` logic is unchanged.

---

## 4. VinylCard — static text below cover

Remove the hover overlay entirely. The card becomes a vertical stack:

```
┌─────────────┐
│  album art  │  ← square image, same width
│  (80–104px) │
└─────────────┘
  Track name       ← 9 px semibold, truncate 1 line
  Artist name      ← 8 px, muted color, truncate 1 line
```

- Remove `group`, `group-hover:*`, overlay `<div>`, and heart button (heart is a separate concern, not in this scope).
- Card container changes from a fixed-square to `flex flex-col` with `w-[80px]` (reduce from 104 to 80 to accommodate text area and fit 7 items).
- Total item height: ~80 px image + ~28 px text = ~108 px.

---

## 5. Files to change

| File | Change |
|------|--------|
| `src/pages/Home.tsx` | Remove arrows + offsetDeg; limit to 7 tracks; wrap VinylDisk in motion.div for entrance |
| `src/components/shared/VinylCard.tsx` | Remove hover overlay; add static name/artist text below image; resize to 80 px |
| `src/components/vinyl/ArcCarousel.tsx` | Add `baseDelay` prop; animate each item from `(0,0)` to `(pos.x, pos.y)` |
| `src/pages/__tests__/Home.test.tsx` | Update snapshot / assertions for removed arrows |

---

## 6. Out of scope

- "Lista de próximas músicas" sidebar (diagram annotation, separate feature)
- Login page changes (disk exit animation is already correct)
- Heart/favorite button in VinylCard
- Drag/swipe navigation on the arc
