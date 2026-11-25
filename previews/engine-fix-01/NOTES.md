# engine-fix-01: what changed and what is still weak

Branch `claude/engine-fix-01` in shared-studio (committed, not pushed, not merged).
Test scene: `demos/nk-dorm-fbi/scene_spec.json`, unchanged. Outputs in this folder:

- `demo.mp4`: the re-rendered 40 s demo.
- `stills/`: `after_t_*.jpg` and `before_after_t_*.jpg`, one per shot (16).
- `side_by_side_rig8.jpg`: the reference on the left, ours on the right.
- `before/`: the baseline render from `main`.

## (a) Vehicles
- **Car art faced backwards.** The long low hood was drawn at the tail. It is redrawn so it reads front to back: headlight, long hood, raked windshield, cabin, short trunk, tail light. Taxi and police build on it.
- **Jet:** the wings swept forward and the turbine sat on the nose. Both wings now sweep back, the engine hangs under the wing, and the tail fin is at the rear.
- **Ship:** the hull was upside down (wider at the keel). It now has a raked bow toward travel, containers on deck, and the bridge and funnel at the stern.
- **Wheels:** spin ignored facing and scale, so mirrored or scaled vehicles counter-rotated or slid. By the old formula the roll ratio was −0.72 for the taxi, −0.5 for the truck and 0.46 for the van. Now:
  - position is analytic (`fromX + span*ease(u)`);
  - wheel angle = signed distance in the art frame / (r·scale);
  - the measured roll ratio is 0.99–1.00 for every vehicle.
- **Accel and brake:** the nose pitches up and squashes slightly on acceleration and dips on braking. Brake lights come from deceleration and stay on 1.2 s after the stop. There is a little road buzz while rolling, and the ship bobs.
- **Facing** always follows travel. A spec `facing` only applies to parked vehicles.
- **Mirrored lettering** ("PD", "REDCAB", brand names) on vehicles driving left was a new find. It is fixed: text never mirrors.
- **Check:** `node tools/check_vehicles.mjs demos/nk-dorm-fbi/scene_spec.json` reports PASS for all 6 moving vehicles. It measures facing and roll in layer space, so camera moves and parallax don't affect it.

## (b) Hands and arms
`actions/acting.js` is rebuilt on the act7 approach:
- **Wrist targets:** every gesture is a set of wrist targets solved with 2-bone IK on the character's own joints. Elbows bow outward and never cross the chest.
- **Overlapping action:** the upper arm leads, the forearm starts about 2 frames later with an overshoot, and the hand about 2 frames after that with more drag. Angle tweens make the wrist travel on eased arcs.
- **Hands offset:** the two hands start 0.06–0.10 s apart.
- **Anticipation:** big moves dip the other way first. The body leans into the gesture with a counter head tilt, and hands-up adds a small squash.
- **Moving holds:** a slow drift of a few degrees keeps arms alive, never a dead freeze.
- **World-locked hand angles:** fingers point up for hands-up, phone and wave, and down onto the keys for typing. Mitten hands have a thumb and a slight curl. The phone gesture now shows a phone in the hand.
- **Typing:** a typist is seated at a workstation (`Studio.Workstation`).
  - The chair sits behind the body.
  - The desk top and keyboard sit between the body and the arms, counter-transformed so they stay planted.
  - The desk front covers the legs and runs past the frame bottom.
  - The desk height is solved from the arm reach, so the wrists rest on the keyboard.
  - Taps are irregular and alternating (hand rotation plus a small wrist lift), with occasional think pauses.
- **Gaze:** the eyes lead and the head follows 80 ms later.

## (c) Whole-demo review: fixes
- **Murky dorm:**
  - the haze veil (38% grey) is now a light ceiling atmosphere;
  - the dorm-night multiply went from 0.34 to 0.16;
  - a strong warm bulb key, teal screen spill at desk height, and a softer vignette;
  - the walls went from near-black to a readable mid slate, and the floor to lighter concrete.
- **Sparse sets:** the dorm is rebuilt per the style bible.
  - Wall: posters, a corkboard with notes and a red string, calendar, clock, a shelf of books, card box, package and radio, a framed picture, and coat hooks with jackets.
  - Back table: a row of 7 laptops with cables, cups and cans, plus a desktop and a printer.
  - Room: a bunk bed with a backpack.
  - Floor: boxes, a wastebasket, pizza, a bento box, a wilted flower, a power strip and cables.
  - Foreground: an empty chair back at the left edge.
  - The office gets file cabinets, a map, a calendar, a framed picture, a shelf, a phone, a printer, a mug, folders, a newspaper, a fire extinguisher and a plant. The newsroom gets a map, an antenna, a mic, a desktop, a plant, a cabinet and a foreground camera.
  - Everything comes from the local prop library: about 60 `fluent-emoji` SVGs. `render-spec` injects them from `PROP_SVG_ROOT` (default `../story_video/assets/props`), prefixes the ids, and adds a house ink edge. Nothing is copied into git.
- **Floating hands and standing typists:** the typists stood in front of the dorm table with their arms in the air. They are now seated at their own desks, with hands on the keys.
- **Set desk hid the characters:** the dorm table's front was on the occluder plane, in front of the cast. The table moved to the back wall.
- **Empty newsroom shot:** it now has a seated anchor extra (blinks, breathes) behind the desk, and a desk panel to the floor that hides the legs.
- **ffmpeg:** `render-spec` now passes `-nostdin`, per the workspace rule.

## (d) Build and parse
- `node build.mjs` works. The bundle adds `cast/paper8.js` and `library/props/libsvg.js`.
- `tools/parse_script.mjs` is unchanged and ran on a test fixture: 2 chapters, 3 lines, pronunciation lock applied.
- `gallery_spec` and `before_spec` render without errors.
- Stash `pre-pr1-merge` was re-applied in full, with no conflicts. All three hunks are still wanted:
  - the `glassesY` rig parameter;
  - `data-layout-ignore` on the rig wrap;
  - `collision_check` accepts a single `.html` file;
  - punch-in keeps L2 sharp.

  The stash entry itself is kept.

## (e) Characters at the rig8 / act7 level
`cast/paper8.js` ports the rig8 "paper" grammar onto shared-studio's CharacterRig, so walk, react, lip sync and keys all still drive it:

- a big round head (~40% of height) with no ears or nose;
- dark tall-oval eyes with a catch-light, flattened by skin lids (no heavy lid band);
- thin calm brows that carry the acting;
- a head sheen with a white rim line;
- a bean torso with a vertical sheen and a trouser band;
- thin ink legs and small shoes;
- noodle arms: one ink curve shoulder > elbow > wrist, redrawn per frame from the FK chain (rig8 `noodle8`);
- mitten hands.

Likeness lives in hair, glasses and outfit:
- Milo: tousled hair, wire glasses, red hoodie.
- TheSuit: grey swept hair, navy suit, gold tie.
- TheClipboard: side part, rectangular glasses, blue shirt, lanyard, clipboard.
- TheSchemer: slick hair, shades, trench coat.

The legacy sculpted rigs stay as `MiloV1` and the other `*V1` rigs. See `side_by_side_rig8.jpg`: the proportions, line, eyes, brows, arms and hands match the rig8 Jensen reference grammar.

## Still weak / next
- **No profile walk.** The style bible wants walks in profile, but the clipboard walk is still front view with a head turn. A profile view for paper8 is the next rig job.
- **Thin acting layer:** acting macros (shrug, recoil, explain beats on stressed words) are not yet exposed as spec keys. Only the 8 gestures are. Expressions are brows, lids and mouth, without act7's extra face takes.
- **Typing in front view** reads as arms reaching down to the keys. There is no forearm foreshortening, and the hands are small.
- **Dark interrogation shot:** 31.6–34.0 s is intentionally dark, but faces sit near the floor of readability.
- **Library props** are emoji-style art with an ink edge. They fit, but a set of house-drawn desks and chairs would match the line weight better. The props are also static (no sway or flicker).
- **Sound:** none was added. That was not in scope.
- **References used:** Crayon Capital frames from `story_video/videos/crayon9/compare_crayon_vs_crayon9.jpg` (crayon half) and the rig8 Jensen sheet. Both are in `side_by_side_rig8.jpg`, along with our dorm frame.
  - Matched: head size, small oval eyes, glasses, thin brows, bean bodies, thin legs, and seated-behind-table staging.
  - Theirs vs ours: their arms mostly hide along the body edges, while ours are always drawn as ink lines. They also use more checker and stripe textiles; ours are flat.
