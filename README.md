# Grace — Portfolio 💕

Hi! I'm Grace — a software engineer who lives at the intersection of design and engineering. I love wearing different hats, whether that's sketching out a product concept, wiring up an Arduino, or shipping a full-stack feature. I'm happiest when I'm rapidly prototyping an idea and watching it come to life.

This is my personal portfolio site, styled as a little macOS desktop — frosted-glass windows, pastel gradients, and all. I built it from scratch because honestly, making things is my favorite thing to do.

## What's Inside

Three tabs you can click through, just like navigating a real desktop:

- **Portfolio** — who I am and the projects I've designed and built
- **Faith** — my journey as a Christ follower and what grounds and guides me
- **Scribbles** — a notebook for unbuilt concepts, design experiments, and product visions, alongside my existing Small Wins Diary

## Built With

- HTML / CSS / vanilla JavaScript
- No frameworks, no build tools — just open `index.html` and go

I kept the stack intentionally simple. The fun here is in the design and interaction details, not dependency management.

## Fun Details

- macOS-inspired window chrome with frosted-glass blur effects
- Sidebar navigator that switches sections with smooth transitions
- A real-time clock ticking away in the menu bar
- A photo-led Scribbles tab with gentle motion and a macOS-style journal reader
- Dreamy pastel gradient background because aesthetics matter

## Getting Started

```bash
git clone https://github.com/chag60460/grace-portfolio.git
cd grace-portfolio
open index.html
```

## Adding a journal entry

**Scribbles** introduces my unbuilt concepts, design experiments, and product
visions with "What if? A place for the not-yet." and "Before the product, there's
a scribble." The existing Small Wins Diary remains here, separate from Faith;
brainstorm-preview topics are not published as entries.

Existing entries are preserved, with three covers shown at a time, newest first. Select a
cover to read the full entry; **older** and **newer** browse published entries
without stepping through empty calendar days.

Scribbles keeps the macOS window chrome and the same pastel-pink icon as the
other tabs. Its wider scene uses blush-pink lighting, rose accents, and
translucent pink glass covers and reader. The portrait is centered, dense
vertical TypeScript fragments fill the left, and entry covers sit on the right.
The code glow uses the same rose-pink palette. The letters
stay fixed while a thin, straight highlight crosses one or two columns at a
time. The fragments are decorative, not executed or connected to a terminal.
On narrow screens the covers move beneath the centered portrait. The code
backdrop keeps the same top and bottom anchors at every width, extending through
the taller stacked scene instead of shrinking to a fixed-height strip.
**Read the latest entry** opens the newest entry directly.

Add an object to `THOUGHT_ENTRIES` in [js/main.js](./js/main.js):

```js
{
  date: '2026-10-25',
  title: 'A title for this moment',
  category: 'small beginnings',
  paragraphs: [
    'Write what happened, in your own words.',
    'Add another paragraph when there is more to say.',
  ],
},
```

Use a unique `YYYY-MM-DD` date. Entries sort automatically; titles, categories,
and paragraphs are plain text, not HTML. No account, service, or build step is
needed. Commit and publish the updated file to make new entries visible.

The supplied glasses portrait is stored as [thoughts-portrait.webp](./thoughts-portrait.webp),
with camera and location metadata removed. It is an illustration of the diary's
author, not a photo assigned to each entry's date. Motion is limited to the code
scan, slow photo drift, light, and short cover entrances; it does not synthesize
facial movement. The code is rendered locally on a transparent canvas: its
stationary glyphs are cached, with only the highlight updated at up to 30 frames
per second. It stops when the canvas is off screen, another section is selected,
or the browser tab is hidden. No video, model, or external service is required.
The **Motion** control pauses it, and reduced-motion preferences show a still
version. Tabs, covers, page controls, and the reader support
keyboard navigation; Escape closes the reader and restores focus to the button
that opened it.

## Playable Games

Borrowed Wind and Bellweather Row load automatically in an embedded player when
their project page opens, showing the game's own landing screen without an extra
Play step. Each game retains its existing saved-progress behavior. Fullscreen is
available in supported browsers, and Close game unloads the player and restores
the screenshot with a **Reopen game** button. Closing can discard unsaved progress.
Their production builds and assets are bundled under `projects/<game>/play/`,
so the published portfolio needs no separate game server or account.

For local gameplay, serve this folder over HTTP instead of opening an HTML file:

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

Open http://127.0.0.1:8080/ and select either game card. Borrowed Wind's optional
camera controls require localhost or HTTPS; keyboard and touch do not need a
camera. TouchDesigner controls are only available in the original local game
setup, not on the published portfolio.

To refresh the bundled games, use Node.js 22.18 or newer with the `borrowed-wind`
and `bellweather-row` source folders beside this portfolio and their npm
dependencies installed:

```bash
node scripts/build-games.mjs
```

This replaces only the generated `projects/<game>/play/` directories, building
with relative asset URLs so the games also work under `/grace-portfolio/` on
GitHub Pages. Include those generated directories with the project-page changes
when publishing the portfolio.

## Project Structure

### Corner Cafe case study

`projects/corner-cafe/corner-cafe.html` presents the product decisions, service
workflow, component states, token-to-CSS mapping, and planned validation. Its
interactive prototype is bundled under `projects/corner-cafe/play/` and loads
only when a visitor launches it; it can also open in a full tab. No separate
server, account, or build step is required on GitHub Pages.

The case study includes tabbed Figma prototype and design-system embeds, plus
separate customer and coffee-team walkthroughs. The embeds retain Figma's access
rules; verify view-only link sharing for public visitors. The coded demo does not
need a Figma account and uses an explicit app-ready message rather than guessing
when an iframe has initialized.

The library uses Figma's working presentation viewer for its foundations, with a
link to the full component canvas. The regular design-file viewer returned a
Figma-side 403 during validation; both presentation URLs loaded without a login.

The demo is shipped as a classic JavaScript bundle, so it does not depend on
browser ES-module loading when opened from a downloaded file. For development,
run these commands from `projects/corner-cafe/`:

```sh
npm install
npm run build:demo
npx playwright install chromium --only-shell
npm run capture
npm test
```

Capture and HTTP tests expect this portfolio to be served on
`http://127.0.0.1:4174`; set `PORTFOLIO_PREVIEW` to use another origin. The tests
also cover file-URL startup, iframe readiness, both role entry points, and narrow
milk-choice layouts. Browser binaries and `node_modules/` are development-only;
the published site needs neither. Rebuild the bundle after changing the demo
source. The case study remains labeled as a prototype, not a launched or
field-validated service.

```
index.html          — The whole page
css/styles.css      — All the styling magic
js/main.js          — Section switcher, clock, Scribbles entries, and journal interactions
thoughts-portrait.webp — Metadata-free portrait used in Scribbles
```

## Say Hi!

I'm always down to chat about design-engineering crossovers, creative coding, or whatever you're building.

- [GitHub](https://github.com/chag60460)
- [LinkedIn](https://www.linkedin.com/in/grace-chang-112300cs/)
- Email: gc1@wellesley.edu
