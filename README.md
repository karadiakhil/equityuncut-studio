# Equity Uncut shared studio

Pure-code 2.5D scenes for finance stories. Characters stay the existing puppet rigs. The picture gets its weight from lighting, parallax, dressed sets, acting, and screen graphics, all described by one JSON file.

```bash
npm install
node build.mjs
node tools/bind-spec.mjs demos/nk-dorm-fbi/scene_spec.json demos/nk-dorm-fbi/scene_spec.js
node tools/render-spec.mjs demos/nk-dorm-fbi/scene_spec.json --out renders/nk-dorm-fbi
```

`ELEVENLABS_API_KEY` stays in the environment. Nothing in this repo reads or stores it.

The local prop-SVG library (tens of thousands of files) is not in git. Point at it with `window.Studio.PROP_SVG_ROOT` or, for node tools, `PROP_SVG_ROOT` (default: `../story_video/assets/props` next to this repo). `Studio.propSvgPath("desks/oak.svg")` joins that root and rejects `..`.

Sets are dressed from that library. `tools/render-spec.mjs` scans the bundle and the spec for `"<set>/<name>.svg"` refs and bare `fluent-emoji` names, reads them under `PROP_SVG_ROOT`, and injects them as `window.__PROP_SVGS`. Nothing is copied into the bundle. `Studio.libProp(parent, "fluent-emoji/books.svg", {x, y, size, ink})` places one inline. It prefixes the ids and adds the house ink edge. A page opened without the injection still renders: library dressing is skipped and built-ins stay. A spec prop with `"file"` is recorded on `scene.propFiles`.

### Cast (rig8 "paper" grammar)

`Milo`, `TheSuit`, `TheClipboard` and `TheSchemer` are built with `Studio.paper8()` (`cast/paper8.js`), a port of `story_video/tools/puppet/rig8.mjs`:

- a big round head with no ears or nose;
- dark oval eyes with a catch-light, flattened by skin lids;
- thin brows that carry the acting;
- a bean torso with a vertical sheen and a trouser band;
- thin ink legs;
- noodle arms: one ink curve shoulder > elbow > wrist, redrawn every frame from the FK chain;
- mitten hands with a thumb and a slight curl.

The old sculpted rigs remain as `MiloV1`, `TheSuitV1`, `TheClipboardV1` and `TheSchemerV1`.

Acting (`actions/acting.js`, a port of act7) solves every gesture as wrist targets with 2-bone IK on the character's own joints:

- joints cascade: the upper arm leads, then the forearm overshoots, then the hand drags;
- the two hands are offset by 0.06–0.1 s;
- big moves get an anticipation dip, and the body leans with a counter head tilt;
- holds keep moving instead of freezing;
- hand angles are locked to the world (fingers up for hands-up and phone, down onto the keys for typing).

A character whose keys include `"gesture": "type"` is seated at a workstation (`Studio.Workstation.attach`): a chair behind, the desk top and keyboard between body and arms, and a desk front over the legs. The wrists rest on the keys and tap in an irregular alternating rhythm. `"workstation": false` opts out; an object passes options (`side`, `width`, `drop`, `clutter`).

### Vehicles

The art faces +x and the facing always follows the direction of travel. Position is analytic, `fromX + span * ease(u)`, which gives three things:

- wheels roll exactly the distance travelled, with no sliding;
- the body pitches nose-up on acceleration and dips on braking;
- the brake light follows deceleration.

Lettering never mirrors. `node tools/check_vehicles.mjs <spec>` measures facing and roll ratio in layer space and exits non-zero on failure.

`node build.mjs` still concatenates the engine to `dist/studio.js`. `tools/parse_script.mjs` is unchanged.

## Scene spec

`Studio.Scene.render(host, spec)` builds a paused GSAP timeline. Scrubbing it is the render. There is no free-running clock. The demo page is `demos/nk-dorm-fbi/index.html`. `tools/render-spec.mjs` injects the JSON as `window.__SPEC_OVERRIDE`, so the file on disk is what gets drawn.

Frame size is 1920×1080. EU specs use `"fps": 30` (the renderer default when `fps` is omitted). A spec that sets `"fps": 24` still renders at 24. `tools/render-spec.mjs` writes `render_report.json` with the resolved fps and `frames = round(duration * fps)`. Ink outlines are 6 px at camera zoom 1, before the camera scales the stage.

Coordinates inside a set are plate-local: camera `x: 960` looks at the middle of a set. Shots cut by hiding every other set. Parallax is the existing five layers (backdrop, architecture, set, characters, foreground).

```json
{
  "version": 1,
  "id": "cold-open",
  "duration": 5,
  "fps": 30,
  "size": [1920, 1080],
  "seed": 1,
  "brands": [
    {"id": "northline", "name": "NORTHLINE", "short": "NL", "tag": "SYSTEMS", "primary": "#0B1F33", "accent": "#F5C542", "trim": "#E8EEF5"}
  ],
  "setParams": {"dorm": {"poster": "NO WINDOWS", "brand": "northline"}},
  "shots": [
    {"t": 0, "dur": 2.4, "set": "dorm", "lighting": "dorm-night", "time": "night", "weather": "haze",
      "camera": {"x": 1040, "y": 660, "zoom": 1.04, "to": {"x": 1160, "y": 520, "zoom": 1.4}, "ease": "sine.inOut"}},
    {"t": 2.4, "dur": 2.6, "set": "city-night", "lighting": "street-night", "time": "night", "weather": "rain", "transition": "whip",
      "camera": {"x": 900, "y": 690, "zoom": 1.05, "to": {"x": 1100, "y": 660, "zoom": 1.16}}}
  ],
  "characters": [
    {"id": "milo", "cast": "Milo", "set": "dorm", "x": 1160, "scale": 0.84, "brand": "northline",
      "keys": [{"t": 0.2, "expression": "focused", "gesture": "type", "look": {"y": 0.7}, "ease": "anticipate"}]}
  ],
  "vehicles": [
    {"id": "sedan", "kind": "car", "set": "city-night", "brand": "northline", "fromX": 200, "toX": 1100, "y": 992, "t": 2.5, "dur": 2.2, "ease": "power2.out"}
  ],
  "props": [
    {"set": "dorm", "slot": "desk-main", "kind": "mug", "scale": 0.5}
  ],
  "mograph": [
    {"type": "caption", "t": 0.3, "out": 2.2, "kicker": "2:14 AM", "text": "THE DORM ROOM"}
  ]
}
```

`duration` must equal the end of the last shot. Shots cannot overlap. `version`, `fps`, `size`, `seed`, and `stills` are optional. `stills` is only a hint for `tools/render-spec.mjs`.

### Shots

| Field | Meaning |
| --- | --- |
| `t`, `dur` | Start and length, seconds |
| `set` | One of the set names below |
| `lighting` | Grade preset |
| `time` | `day`, `dusk`, or `night` |
| `weather` | `clear`, `rain`, or `haze` |
| `transition` | `cut` (default), `whip` (6 frames at the spec fps), or `crash` (2-frame white flash) |
| `camera` | `{x, y, zoom, to:{x,y,zoom}, ease, focus, preset, shake}` in plate space. `preset` is `static`, `push` (about 4.5% when `to.zoom` is omitted), `drift` (+48 px when `to.x` is omitted), `crash-zoom` (reaches the target zoom in 6 frames), or `ots` (needs `foreground: {cast, side}`). A preset only fills defaults. `shake` is `{amp: 2-4, at, dur}` and lasts at most 8 frames. |

`y` around 640–700 is a wide room. A face sits near `y: 500` once `zoom` is above 1.4. Street shots want `y` near 680 so the road and the tower crown both read.

### Lighting presets

Mount them on any stage without a spec:

```js
const light = Studio.Lighting.mount(stage.el, {preset: 'dorm-night', time: 'night', weather: 'haze', seed: 4});
light.cut(tl, 'interrogation', 'night', 'clear', 12, 0.12);
```

| Preset | Look |
| --- | --- |
| `flat` | Legacy even paper. Use it for a before still |
| `night-office` | Warm key from the left, cool rim, lamp and monitor pools, vignette |
| `interrogation` | Hard overhead cone, crushed edges |
| `server-room` | Cyan pools, scanlines, dark multiply |
| `newsroom` | Brighter overhead, blue rim, lighter vignette |
| `luxury` | Amber key, gold pools, soft vignette |
| `dorm-night` | Bare-bulb pool plus green screen spill |
| `street-night` | Teal night, warm lamp pools along the curb |

Time of day is a separate hue bias (`day`, `dusk`, `night`). Weather is separate too: `rain` is a seeded streak field, `haze` is a fog veil. Dust in interior light shafts is on by default.

### Sets

`office`, `trading-floor`, `server-room`, `apartment`, `courtroom`, `dorm`, `factory`, `city-night`, `newsroom`, `paper`, `evidence-table`, `video-call-grid`, `debate-split`.

Each one fills backdrop, architecture, floor, and a foreground frame, and publishes slots (`desk-main`, `stamp`, `foreground`, `curb`, depending on the room). `setParams[name]` is passed through: `density` (`full` or `bare`), `brand`, `sign`, `poster`, `luxury`, `plots`, `crossX`, `wall`, `floor`, `ceiling`, `time`, `weather`.

`city-night` is the exterior. `plots` is a list of `{x, kind, w, floors, brand, sign}`. Kinds: `office`, `bank`, `hq`, `shop`, `apartment`, `factory`. Windows are lit from `time`. Far facades sit on layer 1, the street and hero facades on layer 2, the skyline and water on layer 0, a lamp and a dark edge on layer 4.

Street lines, for placing vehicles: building baseline `y = 768`, far lane `y = 868`, near lane `y = 992`.

### Brands

Fictional only. Defaults, if you omit `brands`, are `northline`, `harbor`, `redcab`, `kiln`, `lumen`, `nightwire`. A record is `{id, name, short, tag, primary, accent, trim}`. Colours may be hex or a palette key (`gold`, `navy`, …). The same record paints signs, vehicle stripes, screen chrome, and a chest badge when a character has `"brand"`.

### Characters and acting

`cast` is `Milo`, `TheSuit`, `TheClipboard`, or `TheSchemer`. `x` is plate-local. Omit `y` to stand on the set floor.

Keys are absolute times:

| Key | Effect |
| --- | --- |
| `expression` | `neutral`, `deadpan`, `suspicious`, `shocked`, `smug`, `panicked`, `dollar-eyes`, `happy`, `focused`, `angry`, `tired`, `sad`, `talk`, `whisper` |
| `gesture` | `idle`, `type`, `explain`, `point`, `hands-up`, `fold`, `phone`, `wave` |
| `ease` | `settle`, `snap`, `heavy`, `smooth`, `anticipate`, `overshoot` |
| `look` | `{x, y}` pupil, about −1 to 1. Positive `y` looks down |
| `turn` | 2.5D head turn, −1 to 1, with hair follow-through |
| `head` | Extra tilt in degrees |
| `say` | `{text, dur}` visemes plus nods. No network call |
| `walk` | `{from, to, dur}` four-phase walk |
| `blink` | `true` forces a blink |

`anticipate` dips, then settles with overshoot. `type` keeps a finite finger loop until the next key. Blinks, saccades, and breathing are already on the rig.

### Vehicles

`kind`: `car`, `taxi`, `police`, `van`, `truck`, `jet`, `ship`.

`fromX` / `toX` drive along the street. Omit them and set `x` to park. `facing` (`1` or `-1`) applies only to parked vehicles; a moving vehicle always faces its direction of travel. `layer` defaults to 2 for cars, 1 for van and truck, 0 for jet and ship. Wheel spin, brake lights, the police bar, and the jet turbine are functions of time, so a seek lands on the same frame.

### Props

`{set, slot, kind, scale, word, anim}`. `kind` is a built-in in `Studio.Props` (`mug`, `ledger`, `stamp`, `wallClock`, …). `anim` is forwarded, so a stamp can take `{"at": 27.1}`. `file` is an external SVG path under `PROP_SVG_ROOT`, recorded and not imported.

### Motion graphics

All of these are screen-space, in seconds, with `t` and `out`:

| `type` | Fields |
| --- | --- |
| `caption` | `kicker`, `text`, `y` lower-third wipe |
| `kinetic` | `text`, `x`, `y`, `size`, `highlight` masked word slam |
| `money` | `from`, `to`, `prefix`, `suffix`, `decimals`, `label`, `dur` tabular counter |
| `map` | `title`, `from`, `to`, `via` route draw and a plane along it |
| `evidence` | `title`, `kicker`, `lines[{text, redact}]`, `stamp` card flip |
| `phone` | `brand`, `messages[{from, text}]` |
| `laptop` | `brand`, `title`, `lines[]` typed on as a function of time |

### Demo

`demos/nk-dorm-fbi/scene_spec.json` is about 40 seconds. A rainy night street, a Northline sedan arriving at the tower, then a dorm full of laptops, then a field office and a Nightwire cutaway. `before_spec.json` is the same dorm with `density: "bare"` and `lighting: "flat"`. `gallery_spec.json` holds one second on every set.

```bash
node tools/render-spec.mjs demos/nk-dorm-fbi/gallery_spec.json --out renders/gallery --stills-only
node tools/render-spec.mjs demos/nk-dorm-fbi/before_spec.json --out renders/before --at 0.4 --stills-only
node tools/render-spec.mjs demos/nk-dorm-fbi/scene_spec.json --out renders/nk-dorm-fbi
```

Chrome is resolved by `tools/chrome.mjs` (`CHROME_PATH`, then Linux and Windows defaults).
