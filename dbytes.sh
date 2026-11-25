#!/usr/bin/env bash
# usage: dbytes.sh — run main.ts into out/ and print dossier text bytes + headroom
cd ~/workspace/makefun/warung-sari-rasa
mkdir -p out
MAKEFUN_OUTPUT_DIR=out node main.ts 2>/dev/null
python3 -c "
import json
d=json.load(open('out/dossier.json'))
n=len(d['text'].encode())
print(f'text={n} cap=163840 headroom={163840-n} files={d[\"text\"].splitlines()[1] if len(d[\"text\"].splitlines())>1 else \"?\"}')"
