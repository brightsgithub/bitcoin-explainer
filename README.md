# How Bitcoin works

An interactive, scroll-driven explainer of how Bitcoin works, written for people with no technical background.

Plain HTML, CSS and JavaScript. No build step and no backend, so it can be hosted as-is on GitHub Pages.

## Preview locally

From this folder:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. (Opening `index.html` directly won't work: browsers only load JavaScript modules over http.)

To see the reduced-motion version without changing your device settings, open <http://localhost:8000/?reduced-motion>.

## How it is organised

```
index.html          page structure and all caption text
css/style.css       colours, type, layout, reduced-motion rules
js/main.js          loads the scene file for each section
js/lib/helpers.js   shared code: connects scrolling to a scene's animation
js/scenes/          one file per scene (its drawing, animation and demo)
```

| Scene | File |
|---|---|
| Title | `00-intro.js` |
| 1. The problem | `01-problem.js` |
| 2. Wallets and keys | `02-wallets.js` |
| 3. A transaction | `03-transaction.js` |
| 4. The mempool | `04-mempool.js` |
| 5. Hashing | `05-hashing.js` |
| 6. Blocks and the chain | `06-chain.js` |
| 7. Mining and proof of work | `07-mining.js` |
| 8. The network and consensus | `08-network.js` |
| 9. Supply | `09-supply.js` |
| Recap | `10-recap.js` |

To change what a scene **says**, edit its captions in `index.html`.
To change what a scene **shows**, edit its file in `js/scenes/`.

Each scene's timeline follows one rule: caption N's animation sits between time N and N+1. Add a caption card in `index.html` and a matching block in the scene file, and the scrolling takes care of itself.

To add a scene, add a `<section class="scene" data-scene="NAME">` to `index.html` and create `js/scenes/NAME.js` exporting an `init(section)` function. Nothing else needs registering.

## Libraries

- [GSAP](https://gsap.com) 3.12.5 with ScrollTrigger, loaded from cdnjs.
- Fonts: Inter and JetBrains Mono, from Google Fonts.

## Accuracy

Where the explainer simplifies how Bitcoin really works, the scene's source file says so in a comment marked `SIMPLIFIED`.
