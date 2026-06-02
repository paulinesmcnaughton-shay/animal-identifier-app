# WildKind — Transactional Email Spec (Parental Consent)

A drop-in, email-client-safe HTML template for the WildKind "guardian permission" email, restyled to match the WildKind brand. Built table-based so it renders in Gmail, Apple Mail, and Outlook.

---

## 1. Brand tokens

| Token | Value | Use |
|---|---|---|
| Brand green | `#1F3B2D` | Logo, headings, primary button, links |
| Green (hover) | `#16301F` | Primary button hover |
| Ink | `#1F2A24` | Primary text / names |
| Body text | `#3A463E` | Paragraph copy |
| Muted | `#8A938B` / `#9AA29A` | Fine print, footer |
| Panel fill | `#F4F6F2` | "WildKind may use" box |
| Page bg | `#F4F2EC` | Email background (warm sand) |
| Card | `#FFFFFF` | Content card |
| Hairline | `#E7E3D8` / `#C9D2C8` | Dividers, secondary button border |
| Font stack | `-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif` | All copy |

**Layout:** 600px max card, 14px corner radius, 48px horizontal padding (28px on mobile).

---

## 2. What changed vs. the old email

- Replaced the flat full-bleed green header block with the **WildKind logo lockup** on white + a hairline rule — lighter, more brand-forward.
- Moved the green to **accents only** (logo, primary CTA, links, bullets) instead of a heavy banner.
- Permissions list is now a **soft green panel** with an uppercase label so it reads as a distinct "scope" block.
- Buttons are a proper **primary / secondary pair** (filled green + outlined), with bulletproof VML so they render in Outlook. They stack full-width on mobile.
- Added a **preheader**, **fine-print reassurance line**, and a **footer** with privacy/help links.
- Warm sand page background (`#F4F2EC`) instead of plain white so the white card has lift.

---

## 3. Implementation notes for Claude Code

- **Keep it table-based.** Do not refactor into `<div>`/flexbox — email clients (Outlook especially) need tables.
- **Logo:** host `wildkind-logo.png` on a public CDN and swap the `src`. It must be an absolute `https://` URL in production. Set explicit `width` (150). Provide `alt="WildKind"`.
- **Merge fields:** replace these tokens with your templating syntax (Handlebars/Liquid/etc.):
  - `Jane Moore` → `{{guardian_name}}`
  - `Alex Moore` → `{{child_name}}`
  - `nature1` → `{{child_username}}`
  - `Approve Access` href `#` → `{{approve_url}}`
  - `Decline Request` href `#` → `{{decline_url}}`
- **Inline the CSS** for production. The `<style>` block here covers resets + mobile media queries; most other styling is already inline. Run through an inliner (e.g. juice / premailer) before sending — Gmail strips `<head>` styles in some contexts.
- **Don't rely on `border-radius` / `box-shadow` in Outlook** — they degrade to square/no-shadow gracefully, which is fine.
- **Dark mode:** test in Apple Mail dark mode; the logo is solid dark green and may need a light-friendly variant (`@media (prefers-color-scheme: dark)`) if it disappears on dark backgrounds. Consider a white/knockout logo PNG for dark mode.
- **Accessibility:** keep `role="presentation"` on layout tables (already set) and meaningful `alt` on the logo.
- **Test before ship:** Litmus / Email on Acid across Gmail (web + iOS/Android), Apple Mail, Outlook 2016+/365.

---

## 4. Full HTML

The complete, ready template is in `WildKind Parental Consent Email.html`. Copy it verbatim, then apply the merge-field and logo-URL swaps above.

```
<!-- See WildKind Parental Consent Email.html for the full source -->
```
