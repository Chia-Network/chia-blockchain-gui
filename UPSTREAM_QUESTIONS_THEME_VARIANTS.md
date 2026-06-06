# Theme Variant Follow-up Questions

Date: 2026-06-07

Context:

The current work is based on `origin/feature/chia-theme-variants-and-overview`.
The goal is to keep follow-up changes small and reviewable while polishing the existing theme-variant branch.

## Questions

1. Should the Overview page refinement continue?

   The branch already has a new `DashboardOverview` structure with status cards and navigation cards.
   Is it acceptable to continue polishing this Overview direction in a separate, focused PR?

2. Is the more compact Akita-like interaction feel acceptable?

   Recent local testing suggests that lighter hover/click feedback and a denser sidebar feel more consistent across the Classic, Chia, and Autumn themes.
   Is there any concern with reducing stronger theme-specific hover effects where they make one theme feel structurally different from the others?

3. Is the current theme-variant structure the right base?

   The current structure uses shared component behavior plus per-variant palette/assets.
   Should future fixes continue to preserve this format, with theme variants changing color/assets first and only adding component overrides when a variant truly needs unique behavior?

## Proposed Direction

Keep the first upstream PRs narrow:

- theme-aware colors for charts, status dots, bars, and import/drop areas
- shared interaction behavior across variants
- no broad Overview redesign unless the direction above is approved

## Japanese Notes

- Overview の改修は、現行の `DashboardOverview` 方向を磨いてよいかの確認。
- クリック感は、秋だけ別構造に見えないように Akita 寄りの控えめ・密度高めへ寄せる確認。
- 構造は、共通コンポーネント + variant palette/assets を基本にしてよいかの確認。
