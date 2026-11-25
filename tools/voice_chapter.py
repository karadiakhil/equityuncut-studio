"""Multi-voice ElevenLabs take for one chapter of an Equity Uncut script, with per-character timestamps.
  python -I voice_chapter.py <episode_dir> <chapter_no> <out.mp3> [--dry]
Reads <episode_dir>/lines.json (tools/parse_script.mjs) and cast.json (voice per speaker, acting tag per line id).
Writes <episode_dir>/audio/chNN/<line>.mp3 + .json (alignment) and the joined chapter mp3, plus <out>.timeline.json:
[{id, speaker, text, start, end, alignment:{characters, character_start_times_seconds, ...} (chapter time)}].
The key comes only from the ELEVENLABS_API_KEY environment variable and is never printed.
"""
import base64, json, os, subprocess, sys, urllib.request, urllib.error

def api(path, body):
    req = urllib.request.Request("https://api.elevenlabs.io/v1" + path, data=json.dumps(body).encode(),
                                 headers={"xi-api-key": os.environ[os.environ.get("VOICE_KEY_ENV", "ELEVENLABS_API_KEY")], "Content-Type": "application/json"})
    try:
        return json.load(urllib.request.urlopen(req, timeout=300))
    except urllib.error.HTTPError as e:
        raise SystemExit(f"API error {e.code}: {e.read()[:400].decode(errors='replace')}")

def dur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", p],
                                capture_output=True, text=True).stdout.strip())

def main():
    ep, chn, out = sys.argv[1], int(sys.argv[2]), sys.argv[3]
    dry = "--dry" in sys.argv
    lines = json.load(open(os.path.join(ep, "lines.json"), encoding="utf-8"))
    cast = json.load(open(os.path.join(ep, "cast.json"), encoding="utf-8"))
    ch = next(c for c in lines["chapters"] if c["id"] == chn)
    adir = os.path.join(ep, "audio", f"ch{chn:02d}"); os.makedirs(adir, exist_ok=True)
    cost = sum(len(cast["acting"].get(l["id"], "")) + 1 + len(l["tts"]) for l in ch["lines"])
    print(f"CH {chn:02d}: {len(ch['lines'])} lines, ~{cost} characters (= credits at 1/char)")
    if dry: return
    takes = []
    for l in ch["lines"]:
        v = cast["voices"][l["speaker"]]
        mp3, js = os.path.join(adir, l["id"] + ".mp3"), os.path.join(adir, l["id"] + ".json")
        if not os.path.exists(mp3):
            tag = cast["acting"].get(l["id"], "")
            body = {"text": (tag + " " + l["tts"]).strip(), "model_id": cast["model"],
                    "voice_settings": {"stability": 0.5, "similarity_boost": 0.8}}
            d = api(f"/text-to-speech/{v['id']}/with-timestamps?output_format=mp3_44100_128", body)
            open(mp3, "wb").write(base64.b64decode(d["audio_base64"]))
            al = d.get("alignment") or d.get("normalized_alignment")
            # drop the acting tag characters from the alignment so it maps to the spoken text
            if tag and al and "".join(al["characters"]).startswith(tag):
                n = len(tag) + 1
                al = {k: v2[n:] for k, v2 in al.items()}
            json.dump({"alignment": al, "voice": v["name"], "tag": tag}, open(js, "w", encoding="utf-8"))
            print(f"  {l['id']} {l['speaker']:<13} {v['name']:<7} {dur(mp3):5.2f}s")
        takes.append((l, mp3, json.load(open(js, encoding="utf-8"))["alignment"]))
    # join with turn-taking gaps
    g = cast["gaps"]; t = 0.35; parts = []; timeline = []; prev = None
    for i, (l, mp3, al) in enumerate(takes):
        if prev:
            gap = g["same"] if prev == l["speaker"] else g["toNarrator"] if l["speaker"] == "NARRATOR" else g["fromNarrator"] if prev == "NARRATOR" else g["turn"]
            t += gap
        d = dur(mp3)
        a2 = None
        if al:
            a2 = {"characters": al["characters"],
                  "character_start_times_seconds": [round(x + t, 4) for x in al["character_start_times_seconds"]],
                  "character_end_times_seconds": [round(x + t, 4) for x in al["character_end_times_seconds"]]}
        timeline.append({"id": l["id"], "speaker": l["speaker"], "text": l["text"], "start": round(t, 3), "end": round(t + d, 3), "alignment": a2})
        parts.append((t, mp3)); t += d; prev = l["speaker"]
    total = t + 0.6
    inputs, filt = [], []
    for i, (st, p) in enumerate(parts):
        inputs += ["-i", p]; filt.append(f"[{i}:a]aresample=44100,adelay={int(st * 1000)}|{int(st * 1000)}[a{i}]")
    filt.append("".join(f"[a{i}]" for i in range(len(parts))) + f"amix=inputs={len(parts)}:normalize=0,apad,atrim=0:{total:.3f},loudnorm=I=-16:TP=-1.5:LRA=11[out]")
    os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(filt), "-map", "[out]", "-ar", "44100", "-b:a", "192k", out], check=True)
    json.dump({"chapter": chn, "duration": round(total, 3), "lines": timeline}, open(out.replace(".mp3", ".timeline.json"), "w", encoding="utf-8"), indent=1)
    print(f"wrote {out} ({total:.2f}s) + timeline")

main()
