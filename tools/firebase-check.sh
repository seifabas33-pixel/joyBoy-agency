#!/usr/bin/env bash
# Readiness probe for the team portal's Firebase project (public endpoints only).
K=$(grep -oP 'apiKey: "\K[^"]+' team/firebase-config.js); P=$(grep -oP 'projectId: "\K[^"]+' team/firebase-config.js); B=$(grep -oP 'storageBucket: "\K[^"]+' team/firebase-config.js)
echo "project=$P bucket=$B"
echo -n "Authentication: "; curl -sS -m 25 "https://identitytoolkit.googleapis.com/v1/projects?key=$K" | python3 -c "import sys,json; d=json.load(sys.stdin); print('NOT SET UP ('+d['error']['message']+')') if 'error' in d else print('ok · authorized domains:', ', '.join(d.get('authorizedDomains',[])))"
echo -n "Firestore: "; c=$(curl -sS -m 25 -o /tmp/fs.json -w '%{http_code}' "https://firestore.googleapis.com/v1/projects/$P/databases/(default)/documents/settings/registration?key=$K"); grep -q 'has not been used' /tmp/fs.json && echo "NOT CREATED" || echo "exists (HTTP $c — 403 means rules are protecting it, as intended)"
echo -n "Storage: "; c=$(curl -sS -m 25 -o /dev/null -w '%{http_code}' "https://firebasestorage.googleapis.com/v0/b/$B/o?maxResults=1"); [ "$c" = "404" ] && echo "NOT CREATED" || echo "exists (HTTP $c)"
