#!/usr/bin/env python3
"""Stamp a fresh ?v= on the team portal's script/style references so browsers never mix old and new files. Run before every team/ deploy."""
import pathlib, re, datetime
v = datetime.datetime.utcnow().strftime("%Y%m%d%H%M"); root = pathlib.Path(__file__).resolve().parents[1]
for f in ["team/index.html", "team/admin.html"]:
    p = root / f; s = p.read_text()
    s = re.sub(r'from "\./portal\.js(\?v=\d+)?"', f'from "./portal.js?v={v}"', s)
    s = re.sub(r'href="portal\.css(\?v=\d+)?"', f'href="portal.css?v={v}"', s)
    s = re.sub(r'src="firebase-config\.js(\?v=\d+)?"', f'src="firebase-config.js?v={v}"', s)
    p.write_text(s)
print("portal version", v)
