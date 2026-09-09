#!/usr/bin/env python3
"""Before every team/ deploy:
 1. stamp a fresh ?v= on the portal's script/style references so browsers never mix old and new files;
 2. refresh the Content-Security-Policy meta on both pages, hashing the inline scripts (static hosting cannot send headers or nonces).
Allowed hosts are exactly what Firebase Auth (Google popup) and Firestore need."""
import pathlib, re, datetime, hashlib, base64
v = datetime.datetime.utcnow().strftime("%Y%m%d%H%M"); root = pathlib.Path(__file__).resolve().parents[1]
cfg = (root / "team/firebase-config.js").read_text()
auth_domain = (re.search(r'authDomain:\s*"([^"]+)"', cfg) or [None, "joy-boy-agency.firebaseapp.com"])[1]
def csp(hashes):
    return "; ".join([
        "default-src 'self'",
        "script-src 'self' https://www.gstatic.com https://apis.google.com " + " ".join(f"'sha256-{h}'" for h in hashes),
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob: https://*.googleusercontent.com",
        "connect-src 'self' https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://apis.google.com https://www.gstatic.com",
        f"frame-src https://{auth_domain} https://accounts.google.com https://apis.google.com",
        "manifest-src 'self'", "base-uri 'self'", "form-action 'self'", "object-src 'none'",
    ])
for f in ["team/index.html", "team/admin.html"]:
    p = root / f; s = p.read_text()
    s = re.sub(r'from "\./portal\.js(\?v=\d+)?"', f'from "./portal.js?v={v}"', s)
    s = re.sub(r'href="portal\.css(\?v=\d+)?"', f'href="portal.css?v={v}"', s)
    s = re.sub(r'src="firebase-config\.js(\?v=\d+)?"', f'src="firebase-config.js?v={v}"', s)
    s = re.sub(r'\n?<meta http-equiv="Content-Security-Policy"[^>]*>', "", s)      # drop the old policy, then hash the inline scripts
    hashes = [base64.b64encode(hashlib.sha256(m.group(1).encode()).digest()).decode() for m in re.finditer(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', s, re.S)]
    meta = f'<meta http-equiv="Content-Security-Policy" content="{csp(hashes)}">'
    s = re.sub(r'(<meta charset="[^"]+">)', r'\1\n' + meta, s, count=1)
    p.write_text(s)
print("portal version", v)
