# Grace — Portfolio 💕

Hi! I'm Grace — a software engineer who lives at the intersection of design and engineering. I love wearing different hats, whether that's sketching out a product concept, wiring up an Arduino, or shipping a full-stack feature. I'm happiest when I'm rapidly prototyping an idea and watching it come to life.

This is my personal portfolio site, styled as a little macOS desktop — frosted-glass windows, pastel gradients, and all. I built it from scratch because honestly, making things is my favorite thing to do.

## What's Inside

Five sections you can click through, just like navigating a real desktop:

- **About Me** — who I am, what excites me, and an alarming matcha latte count hehe
- **Faith** — my journey as a Christ follower, plus an interactive Small Wins calendar I coded to celebrate everyday victories
- **Projects** — passion projects spanning tangible interfaces, AI systems, and open-source tools (Sonic Stitches, Solar Proximity, AI Arduino Temperature Monitor, Yours Truly)
- **Skills** — languages, frontend, and backend/infra — the full toolkit
- **Resume** — experience at Microsoft and MIT Media Lab, education, and a downloadable PDF

## Built With

- HTML / CSS / vanilla JavaScript
- No frameworks, no build tools — just open `index.html` and go

I kept the stack intentionally simple. The fun here is in the design and interaction details, not dependency management.

## Fun Details

- macOS-inspired window chrome with frosted-glass blur effects
- Sidebar navigator that switches sections with smooth transitions
- A real-time clock ticking away in the menu bar
- A hand-coded monthly calendar with illustrated entries for daily small wins
- Dreamy pastel gradient background because aesthetics matter

## Getting Started

```bash
git clone https://github.com/chag60460/grace-portfolio.git
cd grace-portfolio
open index.html
```

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
js/main.js          — Section switcher, clock, and the Small Wins calendar
```

## Say Hi!

I'm always down to chat about design-engineering crossovers, creative coding, or whatever you're building.

- [GitHub](https://github.com/chag60460)
- [LinkedIn](https://www.linkedin.com/in/grace-chang-112300cs/)
- Email: gc1@wellesley.edu
