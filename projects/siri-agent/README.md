# Siri Agent portfolio integration

The case-study page uses the same embedded-prototype presentation as Magdalene:
an in-page app with an **open full size** link. Unlike Magdalene's browser-only
sample interactions, Siri uses the existing live Copilot backend. It is not
replaced by a scripted conversation.
The AI app is a separate project; this repository contains the case study and
embed launcher, not its Node backend.

The prototype is the final section of the case study. **Try interactive
prototype** near the top jumps straight to it without reloading or launching the
app. The link also works with a keyboard and without JavaScript.
Its blue-violet glow radiates outward in two slow, staggered rings.
Reduced-motion preferences retain a static glow.

## Local preview

Start the Siri app from the sibling project:

```sh
cd ../siri-trip-prototype/web
npm run dev
```

Serve this portfolio from its repository root in another terminal:

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

Open
`http://127.0.0.1:8080/projects/siri-agent/siri-agent.html#interactive-prototype`
and choose **Launch prototype**. Opening the HTML file directly also enables
the local launcher. The app is not loaded, and no AI connection is started,
until the visitor launches it.

The local launcher uses `http://127.0.0.1:5173/?screen=siri`. Public pages never
fall back to a visitor's localhost. Only a small ready signal passes from the
app to the case study; messages, session IDs, and app permissions stay inside
the app.

## Publishing

The `data-prototype-url` attribute on the `data-siri-prototype` section is
deliberately empty. On a public website, that means the page explains that the
live prototype is not yet available; it does not display a broken chat window.

After deploying the app and its authenticated, usage-limited backend, set that
attribute to its actual HTTPS URL. Keep credentials out of the URL, HTML, and
repository. The host must allow the portfolio origin to embed it. Its frontend
must include the `?embed=1` layout and `siri-prototype:ready` notification from
the Siri source project.

Do not copy the static Siri build into GitHub Pages and expect Copilot replies:
Pages cannot run its Node backend. A hosted backend still requires a supported
Copilot authentication/billing arrangement or a separately configured provider.
There is no public backend configured by this integration.

The Pages workflow deploys everything committed on `main`. Keep publication
scoped to Siri; do not stage or push unfinished projects. Include only the Siri
project card in `index.html` and its thumbnail styles in `css/styles.css`, leaving
unrelated changes local.

## Integration coverage

The Siri source project's existing Playwright runner can check the portfolio
loader and embedded app together, using mocked AI responses:

```sh
cd ../siri-trip-prototype/web
SIRI_PORTFOLIO_ROOT=../../grace-portfolio npm run test:ui -- tests/portfolio.spec.ts
```
