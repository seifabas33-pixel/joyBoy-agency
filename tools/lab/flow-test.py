#!/usr/bin/env python3
"""Build flow-test.html (root of gh-pages) from portfolio.html: the spotlight
photo wall in the hero is replaced by the WebGPU flow-field canvas
(tools/lab/flow.js, published as lab/flow.js). Test page only: noindex."""
import re, sys, pathlib
root = pathlib.Path(__file__).resolve().parents[2]
src = (root / "portfolio.html").read_text(encoding="utf-8")
out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else root / "flow-test.html"
ver = sys.argv[2] if len(sys.argv) > 2 else "1"

s = src
# 1) hero background: wall + dim -> canvas + veil
a = s.index('<div class="wall" aria-hidden="true">')
b = s.index('<div class="dim" aria-hidden="true"></div>') + len('<div class="dim" aria-hidden="true"></div>')
s = s[:a] + '<canvas id="flow" class="flow" aria-hidden="true"></canvas>\n  <div class="flowveil" aria-hidden="true"></div>' + s[b:]
# 2) head: noindex, no canonical, test title
s = s.replace("<title>", "<title>Flow test · ", 1)
s = re.sub(r'\s*<link rel="canonical"[^>]*>', "", s, count=1)
s = s.replace("<head>", '<head>\n<meta name="robots" content="noindex,nofollow">', 1)
css = """
<style>
/* lab: flow-field hero */
.hero .flow{position:absolute;inset:0;z-index:0;width:100%;height:100%;display:block;opacity:0;transition:opacity 1.4s ease}
.hero.flow-on .flow{opacity:1}
.hero .flowveil{position:absolute;inset:0;z-index:0;pointer-events:none;background:linear-gradient(90deg,rgba(13,10,20,.6) 0%,rgba(13,10,20,.28) 42%,rgba(13,10,20,0) 72%)}
.hero.flow-off{background:radial-gradient(60% 80% at 82% 18%,#A03DE6 0%,rgba(160,61,230,0) 62%),radial-gradient(52% 62% at 18% 92%,#F03FA8 0%,rgba(240,63,168,0) 60%),radial-gradient(40% 50% at 62% 70%,#FF4D2E 0%,rgba(255,77,46,0) 60%),var(--stage)}
.hero.flow-off .flow{display:none}
#flow-badge{font-family:"IBM Plex Mono",monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--yellow);border:1px solid rgba(255,214,10,.4);border-radius:4px;padding:3px 7px;margin-left:auto;white-space:nowrap}
.lab{position:fixed;right:12px;bottom:12px;z-index:60;width:min(290px,calc(100vw - 24px));background:rgba(13,10,20,.84);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:10px 12px;font:12px/1.4 "IBM Plex Mono",monospace;color:#fff}
.lab h2{font:700 12px/1 "IBM Plex Mono",monospace;letter-spacing:.1em;text-transform:uppercase;margin:0 0 8px;display:flex;justify-content:space-between;align-items:center;color:var(--yellow)}
.lab button{background:none;border:1px solid rgba(255,255,255,.2);border-radius:6px;color:#fff;font:inherit;font-size:11px;padding:3px 8px;cursor:pointer}
.lab .row{display:grid;grid-template-columns:78px 1fr 40px;gap:8px;align-items:center;margin:6px 0}
.lab output{text-align:right;color:rgba(255,255,255,.65);font-variant-numeric:tabular-nums}
.lab input[type=range]{width:100%;accent-color:var(--yellow);margin:0}
.lab select{width:100%;background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.15);border-radius:6px;padding:4px 6px;font:inherit}
.lab p{margin:8px 0 0;color:rgba(255,255,255,.5);font-size:11px}
@media(max-width:560px){.lab{right:8px;bottom:8px;left:8px;width:auto}}
</style>
</head>"""
s = s.replace("</head>", css, 1)
# 3) status badge in the hero foot
s = s.replace('Red Sea, Egypt</span></div>\n</header>', 'Red Sea, Egypt</span><span id="flow-badge">loading shader…</span></div>\n</header>', 1)
assert 'id="flow-badge"' in s, "hero-foot anchor not found"
# 4) lab panel + module script
panel = f"""
<aside class="lab" id="lab" aria-label="Flow test controls">
  <h2>Flow test <button id="lab-toggle" type="button">Hide</button></h2>
  <div class="controls">
    <div class="row"><label for="palette">Palette</label><select id="palette" name="palette"><option value="night">Night (aubergine → magenta)</option><option value="sunset">Sunset (magenta → yellow)</option><option value="aqua">Aqua</option><option value="demo">Demo (blue/gold)</option></select><span></span></div>
    <div class="row"><label for="strength">Strength</label><input type="range" id="strength" name="strength" min="0" max="0.5" step="0.01"><output for="strength"></output></div>
    <div class="row"><label for="detail">Detail</label><input type="range" id="detail" name="detail" min="0.5" max="5" step="0.1"><output for="detail"></output></div>
    <div class="row"><label for="speed">Flow speed</label><input type="range" id="speed" name="speed" min="0" max="10" step="0.1"><output for="speed"></output></div>
    <div class="row"><label for="evolutionSpeed">Evolution</label><input type="range" id="evolutionSpeed" name="evolutionSpeed" min="0" max="10" step="0.1"><output for="evolutionSpeed"></output></div>
    <div class="row"><label for="swirl">Swirl</label><input type="range" id="swirl" name="swirl" min="-1" max="1" step="0.05"><output for="swirl"></output></div>
    <div class="row"><label for="count">Points</label><input type="range" id="count" name="count" min="2" max="8" step="1"><output for="count"></output></div>
    <div class="row"><label for="edges">Edges</label><select id="edges" name="edges"><option value="mirror">Mirror</option><option value="wrap">Wrap</option><option value="stretch">Stretch</option></select><span></span></div>
    <p>Test page only. Needs WebGPU (iOS 26 Safari, Chrome, Edge). Tell Claude which settings you like.</p>
  </div>
</aside>
<script type="module" src="lab/flow.js?v={ver}"></script>
</body>"""
s = s.replace("</body>", panel, 1)
out.write_text(s, encoding="utf-8")
print("wrote", out, len(s), "bytes")
