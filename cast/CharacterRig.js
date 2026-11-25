/* CharacterRig: parametric studio character builder.
 *
 * Builds a forward-kinematics <g> joint tree with explicit pixel pivots at every joint:
 *   char-root > pelvis > { leg-L/R-upper > leg-lower > foot,  torso > { arm-L/R-upper > arm-lower > hand > prop-mount,
 *   neck > head-pivot > { hair-back, ears, face-base, face-clip-group > face-features, head-line, hair-main, hair-front,
 *   hair-sheen, glasses } } }
 * Character-local space: x right, y down, ground at y = 0, feet centred on x = 0.
 *
 * Motion model: char.p is a proxy of numbers that GSAP tweens (joint angles in degrees, positions in px).
 * char.tracks hold discrete state keyed by time (viseme, mouth mood, hand poses, dollar eyes, sweat).
 * char.apply(t) (registered with Studio.onApply) writes everything to the DOM. Blinks and saccades are seeded
 * schedules, breathing is a function of t, and auto-ground keeps the lowest sole on the floor (pelvis bob emerges
 * from knee bend during walks). Every frame is a pure function of t.
 */
(function (S) {
  'use strict';
  const PARAMS = {
    x: 0, y: 0, scale: 1, facing: 1, lean: 0, squash: 0, fold: 0, alpha: 1, ground: 1, breathe: 1,
    pelvisY: 0, torso: 0, neck: 0, head: 0, turn: 0, jaw: 0,
    hairLag: 0, hairBounce: 0,
    armLU: 0, armLL: 0, handL: 0, armRU: 0, armRL: 0, handR: 0,
    legLU: 0, legLL: 0, footL: 0, legRU: 0, legRL: 0, footR: 0,
    browL: 0, browR: 0, browInner: 0, browTiltL: 0, browTiltR: 0,
    lidL: 0.12, lidR: 0.12, lidBL: 0, lidBR: 0, pupil: 1, lookX: 0, lookY: 0,
    glint: -1, blush: 0.35, glassesY: 0
  };
  S.CHAR_PARAMS = Object.keys(PARAMS);

  function crescent(parent, defs, d, base, shade, dx, dy, tier) {
    const id = S.uid('cs');
    S.path(S.svg('clipPath', {id}, defs), d);
    S.path(parent, d, shade);
    const c = S.g(parent, {'clip-path': `url(#${id})`});
    S.path(c, d, base, null, {transform: `translate(${-dx} ${-dy})`});
    if (tier !== false) S.path(parent, d, 'none', tier || 'outer');
    return c;
  }
  S.crescent = crescent;

  // Scale ink strokes so a paper outline is inkPx screen pixels at the character's scale, before camera zoom.
  // Bases are stored once; later calls (scale tweens, stature) recompute from those bases.
  S.retuneInk = function (svg, factor, screenScale) {
    const inks = {'#141114': 1, '#18181b': 1};
    svg.querySelectorAll('[stroke]').forEach((e) => {
      const s = (e.getAttribute('stroke') || '').toLowerCase();
      if (e.hasAttribute('data-screen-px')) {
        const px = parseFloat(e.getAttribute('data-screen-px'));
        const sc = screenScale || 1;
        e.setAttribute('stroke-width', (px / sc).toFixed(3));
        return;
      }
      if (!inks[s]) return;
      if (!e.hasAttribute('data-ink-base')) e.setAttribute('data-ink-base', e.getAttribute('stroke-width') || '1');
      const base = parseFloat(e.getAttribute('data-ink-base'));
      e.setAttribute('stroke-width', (base * factor).toFixed(3));
    });
  };

  S.Character = {
    create(cfg, opts) {
      opts = opts || {};
      const id = opts.id || cfg.name.toLowerCase();
      const J = cfg.joints;
      const wrap = S.div({class: 'ss-char', 'data-layout-ignore': '', id: id + '-wrap', style: {position: 'absolute', left: '0px', top: '0px', width: '0px', height: '0px', transformOrigin: '0 0', zIndex: opts.z || 1}}, opts.parent);
      const V = cfg.view || [-220, -760, 440, 800];
      const svg = S.svg('svg', {viewBox: V.join(' '), width: V[2], height: V[3], overflow: 'visible', 'data-shading': cfg.shading || '', 'data-paper': cfg.paper ? '1' : '',
        style: `position:absolute;left:${V[0]}px;top:${V[1]}px;overflow:visible`}, wrap);
      const defs = S.svg('defs', null, svg);
      const ctx = {cfg, defs, J, geom: cfg.geom || null, crescent: (p, d, b, s, dx, dy, t) => crescent(p, defs, d, b, s, dx == null ? 6 : dx, dy == null ? 3 : dy, t)};
      const n = {}; // named nodes
      const G = (parent, name, extra) => (n[name] = S.g(parent, Object.assign({id: `${id}-${name}`}, extra || {})));

      const root = G(svg, 'char-root');
      n.shadow = S.svg('ellipse', {cx: 0, cy: 2, rx: cfg.shadowRx || 74, ry: 10, fill: S.INK, opacity: 0.2}, root);
      const pelvis = G(root, 'pelvis');
      // legs: L behind R
      ['L', 'R'].forEach((s) => {
        const up = G(pelvis, `leg-${s}-upper`); cfg.draw.legUpper(up, s, ctx);
        const lo = G(up, `leg-${s}-lower`); cfg.draw.legLower(lo, s, ctx);
        const ft = G(lo, `foot-${s}`); const fi = S.g(ft, {transform: `translate(${J['ankle' + s][0]} ${J['ankle' + s][1]})`}); cfg.draw.foot(fi, s, ctx);
      });
      const torso = G(pelvis, 'torso');
      const paper = !!cfg.paper;
      const drawHand = cfg.drawHand || S.drawHand;
      const handPoses = cfg.handPoses || S.HAND_POSES;
      const arm = (s) => {
        const up = G(torso, `arm-${s}-upper`); cfg.draw.armUpper(up, s, ctx);
        const lo = G(up, `arm-${s}-lower`); cfg.draw.armLower(lo, s, ctx);
        const hd = G(lo, `hand-${s}`);
        const hi = S.g(hd, {transform: `translate(${J['wrist' + s][0]} ${J['wrist' + s][1]}) scale(${cfg.handScale || 1})`});
        n['poses' + s] = {};
        // paper hands: held props mount BEHIND the fingers (the grip wraps the prop); legacy hands keep it on top
        const m = cfg.handMount || S.handMount('grip-prop');
        if (paper) n['mount' + s] = S.g(hi, {id: `${id}-prop-mount-${s}`, transform: `translate(${s === 'L' ? -m[0] : m[0]} ${m[1]})`});
        handPoses.forEach((pose) => {
          const pg = drawHand(hi, pose, {skin: cfg.skin, shade: cfg.skinShade, mirror: s === 'L', defs, k: 1 / (cfg.handScale || 1), ink: cfg.ink});
          pg.setAttribute('display', 'none'); n['poses' + s][pose] = pg;
        });
        if (!paper) n['mount' + s] = S.g(hi, {id: `${id}-prop-mount-${s}`, transform: `translate(${s === 'L' ? -m[0] : m[0]} ${m[1]})`});
      };
      // chair backs and anything a seated figure leans against: behind the whole body
      n.behind = S.g(root, {id: `${id}-behind`});
      root.insertBefore(n.behind, pelvis);
      if (!paper) arm('L');
      cfg.draw.torso(torso, ctx);
      const neck = G(torso, 'neck'); cfg.draw.neck(neck, ctx);
      const head = G(neck, 'head-pivot');
      // head internals
      n.hairBack = G(head, 'hair-back'); S.path(n.hairBack, cfg.hair.back, cfg.hair.color, 'outer');
      if (cfg.hair.backShade) S.path(n.hairBack, cfg.hair.backShade, cfg.hair.shade);
      const ears = G(head, 'ears');
      n.ear = {};
      ['L', 'R'].forEach((s) => {
        const e = n.ear[s] = S.g(ears, {id: `${id}-ear-${s}`});
        if (!cfg.ear) return;   // paper heads have no ears
        const eg = S.g(e, {transform: s === 'L' ? 'scale(-1 1)' : null});
        ctx.crescent(eg, cfg.ear.d, cfg.skin, cfg.skinShade, 4, 2);
        S.line(eg, cfg.ear.helix, 'micro'); S.line(eg, cfg.ear.inner, 'micro', null, {opacity: 0.7});
      });
      const base = G(head, 'face-base');
      const headClip = S.uid('head');
      S.path(S.svg('clipPath', {id: headClip}, defs), cfg.head.d);
      if (paper) S.path(base, cfg.head.d, cfg.skin);   // flat skin; head.extras adds the sheen
      else ctx.crescent(base, cfg.head.d, cfg.skin, cfg.skinShade, cfg.head.shadeDX || 9, cfg.head.shadeDY || 5, false);
      const baseClip = S.g(base, {'clip-path': `url(#${headClip})`});
      if (cfg.head.extras) cfg.head.extras(baseClip, ctx);
      // forehead cast shadow under the bangs. Hard paper shading uses one crescent instead of this wash.
      if (!(paper && (cfg.shading || 'hard') === 'hard')) S.path(baseClip, cfg.hair.front, cfg.skinShade, null, {transform: 'translate(3 8)', opacity: paper ? 0.3 : 0.85});
      const fclip = G(head, 'face-clip-group', {'clip-path': `url(#${headClip})`});
      const feat = G(fclip, 'face-features');
      const F = cfg.face;
      // cheeks
      n.cheeks = S.g(feat, {opacity: 0.35});
      if (!cfg.noBlush) [-1, 1].forEach((k) => S.svg('ellipse', {cx: k * F.cheekDX, cy: F.cheekY, rx: 10, ry: 5.5, fill: S.PALETTE.blush}, n.cheeks));
      // eyes
      n.eye = {};
      if (paper) S.paperEyes(n, feat, defs, cfg, id);
      else ['L', 'R'].forEach((s) => {
        const k = s === 'L' ? -1 : 1, cx = k * F.eyeDX, cy = F.eyeY, rx = F.eyeRX, ry = F.eyeRY;
        const eg = S.g(feat, {id: `${id}-eye-${s}`});
        const cid = S.uid('eye');
        const scl = `M${cx - rx} ${cy} C${cx - rx} ${cy - ry * 1.35} ${cx + rx} ${cy - ry * 1.35} ${cx + rx} ${cy} C${cx + rx} ${cy + ry * 1.3} ${cx - rx} ${cy + ry * 1.3} ${cx - rx} ${cy} Z`;
        S.path(S.svg('clipPath', {id: cid}, defs), scl);
        S.path(eg, scl, '#FFFFFF');
        const inner = S.g(eg, {'clip-path': `url(#${cid})`});
        const iris = S.g(inner);
        S.svg('circle', {cx, cy: cy + 0.5, r: F.irisR, fill: F.irisColor}, iris);
        S.svg('circle', {cx, cy: cy + 0.5, r: F.pupilR, fill: '#0B0B0C'}, iris);
        S.svg('circle', {cx: cx - F.irisR * 0.35, cy: cy - F.irisR * 0.35, r: Math.max(1.4, F.irisR * 0.28), fill: '#FFFFFF'}, iris);
        const dollar = S.svg('text', {x: cx, y: cy + F.irisR * 0.95, 'text-anchor': 'middle', 'font-family': 'Archivo Black, sans-serif', 'font-size': F.irisR * 2.9, fill: S.PALETTE.emeraldDeep, display: 'none'}, inner);
        dollar.textContent = '$';
        // upper lid (slides down), lower lid (slides up), each a skin shape with a lash edge
        const lid = S.g(inner); const top = cy - ry * 1.4;
        S.path(lid, `M${cx - rx - 3} ${top - ry * 3} L${cx + rx + 3} ${top - ry * 3} L${cx + rx + 3} ${top} C${cx + rx * 0.4} ${top + 3} ${cx - rx * 0.4} ${top + 3} ${cx - rx - 3} ${top} Z`, cfg.lid || cfg.skin);
        S.line(lid, `M${cx - rx - 3} ${top} C${cx - rx * 0.4} ${top + 3} ${cx + rx * 0.4} ${top + 3} ${cx + rx + 3} ${top}`, 'mid', null, {'stroke-width': 3});
        const lidB = S.g(inner); const bot = cy + ry * 1.35;
        S.path(lidB, `M${cx - rx - 3} ${bot} C${cx - rx * 0.4} ${bot - 2} ${cx + rx * 0.4} ${bot - 2} ${cx + rx + 3} ${bot} L${cx + rx + 3} ${bot + ry * 3} L${cx - rx - 3} ${bot + ry * 3} Z`, cfg.skin);
        S.line(lidB, `M${cx - rx - 3} ${bot} C${cx - rx * 0.4} ${bot - 2} ${cx + rx * 0.4} ${bot - 2} ${cx + rx + 3} ${bot}`, 'micro');
        S.path(eg, scl, 'none', 'micro');
        // eyelid crease
        S.line(eg, `M${cx - rx * 0.8} ${cy - ry * 1.32} C${cx - rx * 0.2} ${cy - ry * 1.62} ${cx + rx * 0.5} ${cy - ry * 1.6} ${cx + rx * 0.95} ${cy - ry * 1.22}`, 'micro', null, {opacity: 0.75});
        n.eye[s] = {g: eg, iris, dollar, lid, lidB, cx, cy, rx, ry};
      });
      // brows
      n.brow = {};
      if (paper) ['L', 'R'].forEach((s) => {   // thin calm arcs: the brows carry the acting
        const k = s === 'L' ? -1 : 1; const bg = S.g(feat, {id: `${id}-brow-${s}`});
        const ix = k * F.browDX, ox = k * (F.browDX + F.browLen), y = F.browY;
        S.path(bg, `M${ix} ${y + 1} Q${(ix + ox) / 2} ${y - F.browArch - 2} ${ox} ${y + 1.5}`, 'none', null, {stroke: F.browColor || S.INK, 'stroke-width': F.browW, 'stroke-linecap': 'round', fill: 'none'});
        n.brow[s] = {g: bg, cx: (ix + ox) / 2, cy: y};
      });
      else ['L', 'R'].forEach((s) => {
        const k = s === 'L' ? -1 : 1; const bg = S.g(feat, {id: `${id}-brow-${s}`});
        const ix = k * F.browDX, ox = k * (F.browDX + F.browLen), y = F.browY, w = F.browW;
        const d = `M${ix} ${y + w * 0.5} C${ix + k * F.browLen * 0.35} ${y - w * 0.9 - F.browArch} ${ox - k * F.browLen * 0.25} ${y - w * 0.7 - F.browArch} ${ox} ${y + 1} ` +
          `C${ox - k * F.browLen * 0.3} ${y - w * 0.1 - F.browArch} ${ix + k * F.browLen * 0.35} ${y + w * 0.1 - F.browArch * 0.6} ${ix} ${y + w * 0.5 + w} Z`;
        S.path(bg, d, F.browColor, 'micro');
        n.brow[s] = {g: bg, cx: (ix + ox) / 2, cy: y};
      });
      // nose
      n.nose = S.g(feat);
      if (F.noseShadow) S.path(n.nose, F.noseShadow, cfg.skinShade, null, {opacity: 0.9});
      if (F.nose) S.line(n.nose, F.nose, 'mid');
      if (F.noseMicro) S.line(n.nose, F.noseMicro, 'micro', null, {opacity: 0.7});
      // mouth
      n.mouth = S.g(feat, {id: `${id}-mouth-rig`});
      const mInner = S.g(n.mouth, {transform: `translate(0 ${F.mouthY}) scale(${F.mouthScale})`});
      n.mouths = (paper && S.buildPaperMouths) ? S.buildPaperMouths(mInner, defs, cfg) : S.buildMouths(mInner, defs, cfg.skinShade);
      if (F.extras) F.extras(feat, ctx);
      // sweat drop (panicked)
      n.sweat = S.g(feat, {display: 'none'});
      S.path(n.sweat, `M${F.eyeDX + 30} ${F.browY - 6} C${F.eyeDX + 24} ${F.browY + 6} ${F.eyeDX + 26} ${F.browY + 14} ${F.eyeDX + 31} ${F.browY + 14} C${F.eyeDX + 36} ${F.browY + 14} ${F.eyeDX + 37} ${F.browY + 6} ${F.eyeDX + 30} ${F.browY - 6} Z`, '#BAE6FD', 'micro');
      // head outline on top of features
      n.headLine = G(head, 'head-line'); S.path(n.headLine, cfg.head.d, 'none', paper ? (cfg.ink || 4.2) : 'outer');
      if (cfg.head.lines) cfg.head.lines.forEach((d) => S.line(n.headLine, d, 'micro', null, {opacity: 0.8}));
      n.hairMain = G(head, 'hair-main');
      if (paper) S.path(n.hairMain, cfg.hair.main, cfg.hair.color, cfg.ink || 4.2, {'stroke-linejoin': 'round'});
      else ctx.crescent(n.hairMain, cfg.hair.main, cfg.hair.color, cfg.hair.shade, 6, 4);
      (cfg.hair.strands || []).forEach((d) => S.line(n.hairMain, d, 'micro', cfg.hair.strandColor || null, {opacity: 0.85}));
      n.hairFront = G(head, 'hair-front');
      // bangs: tips get a structure line, the edge that meets hair-main only a faint micro line (no 'headband' contour)
      if (paper) S.path(n.hairFront, cfg.hair.front, cfg.hair.color, cfg.ink || 4.2, {'stroke-linejoin': 'round'});
      else ctx.crescent(n.hairFront, cfg.hair.front, cfg.hair.color, cfg.hair.shade, 4, 3, cfg.hair.frontTips ? false : 'outer');
      if (cfg.hair.frontTips) { S.line(n.hairFront, cfg.hair.frontTips, null, S.INK, {'stroke-width': 2.8}); S.line(n.hairFront, cfg.hair.frontTop, 'micro', null, {opacity: 0.45}); }
      (cfg.hair.frontStrands || []).forEach((d) => S.line(n.hairFront, d, 'micro', cfg.hair.strandColor || null, {opacity: 0.85}));
      if (cfg.hair.curl) { S.line(n.hairFront, cfg.hair.curl, null, S.INK, {'stroke-width': 7.5}); S.line(n.hairFront, cfg.hair.curl, null, cfg.hair.color, {'stroke-width': 3.2}); }
      n.hairSheen = G(head, 'hair-sheen');
      (cfg.hair.sheen || []).forEach((d, i) => S.line(n.hairSheen, d, null, cfg.hair.sheenColor, {'stroke-width': i ? 3 : 4.5, opacity: 0.9}));
      // glasses
      if (cfg.glasses) {
        const gl = n.glasses = G(head, 'glasses');
        const gi = S.g(gl, {transform: `rotate(${cfg.glasses.crooked || 0} 0 ${F.eyeY})`});
        n.glint = [];
        ['L', 'R'].forEach((s) => {
          const k = s === 'L' ? -1 : 1, cx = k * F.eyeDX, cy = F.eyeY, G2 = cfg.glasses;
          const lens = G2.shape === 'rect'
            ? `M${cx - G2.rx} ${cy - G2.ry + 3} Q${cx - G2.rx} ${cy - G2.ry} ${cx - G2.rx + 3} ${cy - G2.ry} L${cx + G2.rx - 3} ${cy - G2.ry} Q${cx + G2.rx} ${cy - G2.ry} ${cx + G2.rx} ${cy - G2.ry + 3} L${cx + G2.rx} ${cy + G2.ry - 4} Q${cx + G2.rx} ${cy + G2.ry} ${cx + G2.rx - 4} ${cy + G2.ry} L${cx - G2.rx + 4} ${cy + G2.ry} Q${cx - G2.rx} ${cy + G2.ry} ${cx - G2.rx} ${cy + G2.ry - 4} Z`
            : `M${cx - G2.rx} ${cy} A${G2.rx} ${G2.ry} 0 1 1 ${cx + G2.rx} ${cy} A${G2.rx} ${G2.ry} 0 1 1 ${cx - G2.rx} ${cy} Z`;
          const lid2 = S.uid('lens');
          S.path(S.svg('clipPath', {id: lid2}, defs), lens);
          S.path(gi, lens, G2.tint || 'rgba(186,230,253,0.16)');
          const gc = S.g(gi, {'clip-path': `url(#${lid2})`});
          const glint = S.g(gc);
          S.path(glint, `M${cx - 30} ${cy + 22} L${cx - 12} ${cy - 26} L${cx - 4} ${cy - 26} L${cx - 22} ${cy + 22} Z`, '#FFFFFF', null, {opacity: 0.85});
          S.path(glint, `M${cx - 16} ${cy + 22} L${cx + 2} ${cy - 26} L${cx + 5} ${cy - 26} L${cx - 13} ${cy + 22} Z`, '#FFFFFF', null, {opacity: 0.7});
          n.glint.push({g: glint, cx});
          // static resting glint
          S.path(gc, `M${cx - G2.rx * 0.55} ${cy - G2.ry * 0.25} L${cx - G2.rx * 0.2} ${cy - G2.ry * 0.7}`, 'none', null, {stroke: '#FFFFFF', 'stroke-width': 2.6, 'stroke-linecap': 'round', opacity: 0.9});
          S.path(gi, lens, 'none', null, {stroke: G2.color || '#1F2937', 'stroke-width': G2.weight || S.LINE.mid});
          S.line(gi, `M${cx + k * G2.rx} ${cy - 2} L${k * (cfg.face.templeX || 64)} ${cy - 5}`, null, G2.color || '#1F2937', {'stroke-width': S.LINE.micro + 0.4});
        });
        S.line(gi, cfg.glasses.bridge, null, cfg.glasses.color || '#1F2937', {'stroke-width': cfg.glasses.weight || S.LINE.mid});
      }
      if (cfg.draw.overHead) cfg.draw.overHead(head, ctx);
      // swappable accessories / disguises (cap, mustache, fake glasses...), toggled by tracks.acc (array of names)
      n.acc = {};
      for (const name in (cfg.accessories || {})) { const ag = S.g(head, {id: `${id}-acc-${name}`, display: 'none'}); cfg.accessories[name](ag, ctx); n.acc[name] = ag; }
      if (paper) {
        // what the hands rest ON (desk top, keyboard) sits between the body and the arms; apply() counter-transforms
        // this group so it stays planted in the ground frame while the torso breathes and leans
        n.under = S.g(torso, {id: `${id}-under`});
        n.noodle = {};
        ['L', 'R'].forEach((s) => {
          n.noodle[s] = S.svg('path', {d: 'M0 0', fill: 'none', stroke: cfg.limbInk || S.INK, 'stroke-width': cfg.armW || 8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', id: `${id}-noodle-${s}`}, torso);
        });
        arm('L');
      }
      arm('R');
      ['L', 'R'].forEach((s) => { if (cfg.draw['mount' + s]) cfg.draw['mount' + s](n['mount' + s], ctx); });
      if (cfg.heldProps) { n.heldProps = {}; for (const k in cfg.heldProps) { const hg = S.g(n.mountR, {display: 'none'}); cfg.heldProps[k](hg, ctx); n.heldProps[k] = hg; } }
      // in front of the whole figure (desk fronts that hide seated legs), character-local ground frame
      n.front = S.g(svg, {id: `${id}-front`});
      if (cfg.draw.overArm) cfg.draw.overArm(torso, ctx);
      if (ctx.lightFlips) n.lightFlips = ctx.lightFlips;

      // ---- state ----
      const p = Object.assign({}, PARAMS, cfg.rest || {}, opts.frozen ? {breathe: 0} : {}, opts.p || {});
      const tracks = {viseme: new S.Track(null), mood: new S.Track('REST'), handL: new S.Track(cfg.restHand || 'relaxed'),
        handR: new S.Track(cfg.restHandR || cfg.restHand || 'relaxed'), dollar: new S.Track(false), sweat: new S.Track(false),
        acc: new S.Track(cfg.restAcc || []), held: new S.Track(null), lightSide: new S.Track(cfg.lightSide == null ? -1 : cfg.lightSide),
        view: new S.Track(cfg.view || 'F'), arms: new S.Track(cfg.armMode === 'hug' ? 'hug' : 'noodle')};
      if (cfg.restHandL) tracks.handL = new S.Track(cfg.restHandL);
      if (cfg.restMood) tracks.mood = new S.Track(cfg.restMood);
      const rnd = S.rng(S.hash(id + ':blink'));
      const blinkEvery = cfg.paper ? 3 : 2.5, blinkSpan = cfg.paper ? 2 : 1.5;
      const blinks = []; if (!opts.frozen) for (let t = 0.4 + rnd() * 1.2; t < 900; t += blinkEvery + rnd() * blinkSpan) blinks.push(t);   // frozen = a still photo (camera-off tile)
      const sacc = [[0, 0, 0]]; if (!opts.frozen) for (let t = 0.3; t < 900; t += 0.7 + rnd() * 1.5) sacc.push([t, (rnd() - 0.5) * 0.5, (rnd() - 0.5) * 0.35]);
      const ch = {id, cfg, wrap, svg, n, p, tracks, blinks, extraBlinks: [], J, ctx};

      function blinkAt(t) {
        const all = ch.extraBlinks.length ? blinks.concat(ch.extraBlinks) : blinks;
        let c = 0;
        for (const b of all) {
          const dt = t - b; if (dt < 0 || dt > 0.25) continue;
          const v = dt < 0.05 ? dt / 0.05 : dt < 0.1 ? 1 : 1 - (dt - 0.1) / 0.12;
          c = Math.max(c, S.clamp(v, 0, 1));
        }
        return c;
      }
      function saccAt(t) {
        let lo = 0, hi = sacc.length - 1; if (t < sacc[0][0]) return [0, 0];
        while (lo < hi) { const m = (lo + hi + 1) >> 1; if (sacc[m][0] <= t) lo = m; else hi = m - 1; }
        const cur = sacc[lo], prev = lo ? sacc[lo - 1] : [0, 0, 0];
        const k = S.smooth((t - cur[0]) / 0.06);
        return [S.lerp(prev[1], cur[1], k), S.lerp(prev[2], cur[2], k)];
      }
      const rot = (a, pt) => `rotate(${a.toFixed(3)} ${pt[0]} ${pt[1]})`;
      const R = (deg) => deg * Math.PI / 180;
      // world position of a local point under the leg chain (for auto-ground)
      function legChain(s, pt) {
        const hip = J['hip' + s], knee = J['knee' + s], ank = J['ankle' + s];
        const a1 = R(p['leg' + s + 'U']), a2 = R(p['leg' + s + 'L']), a3 = R(p['foot' + s]);
        const rp = (q, c, a) => [c[0] + (q[0] - c[0]) * Math.cos(a) - (q[1] - c[1]) * Math.sin(a), c[1] + (q[0] - c[0]) * Math.sin(a) + (q[1] - c[1]) * Math.cos(a)];
        let q = [ank[0] + pt[0], ank[1] + pt[1]];
        q = rp(q, ank, a3); q = rp(q, knee, a2); q = rp(q, hip, a1);
        return q;
      }
      const sole = cfg.sole || [[-14, 30], [34, 30]];
      ch.apply = function (t) {
        const facing = p.facing, sq = p.squash;
        const sx = (1 + sq * 0.6), sy = (1 - sq);
        const st = cfg.statureScale || 1;
        wrap.style.transform = `translate(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px) perspective(1200px) rotateX(${p.fold.toFixed(2)}deg) scale(${p.scale.toFixed(4)})`;
        wrap.style.opacity = p.alpha;
        n['char-root'].setAttribute('transform', `rotate(${p.lean.toFixed(3)} 0 0) scale(${(facing * sx * st).toFixed(4)} ${(sy * st).toFixed(4)})`);
        n.shadow.setAttribute('rx', (cfg.shadowRx || 74) * (1 - Math.min(0.4, Math.max(0, -p.pelvisY) / 200)));
        // auto-ground: lowest sole point touches y = 0
        let low = -1e9;
        ['L', 'R'].forEach((s) => sole.forEach((pt) => { low = Math.max(low, legChain(s, pt)[1]); }));
        const g0 = p.ground * (0 - low);
        n.pelvis.setAttribute('transform', `translate(0 ${(p.pelvisY + g0).toFixed(2)})`);
        ['L', 'R'].forEach((s) => {
          n[`leg-${s}-upper`].setAttribute('transform', rot(p['leg' + s + 'U'], J['hip' + s]));
          n[`leg-${s}-lower`].setAttribute('transform', rot(p['leg' + s + 'L'], J['knee' + s]));
          n[`foot-${s}`].setAttribute('transform', rot(p['foot' + s], J['ankle' + s]));
        });
        const br = Math.sin(t * Math.PI * 2 / 3.4) * p.breathe;
        const breathAmp = cfg.paper ? (cfg.breathAmp == null ? 0.02 : cfg.breathAmp) : 0.006;
        const torsoA = p.torso + br * 0.35, torsoS = 1 + br * breathAmp;
        n.torso.setAttribute('transform', `${rot(torsoA, J.pelvis)} translate(0 ${J.pelvis[1]}) scale(1 ${torsoS.toFixed(4)}) translate(0 ${-J.pelvis[1]})`);
        if (n.under) {   // undo root (lean, facing, squash), pelvis and torso so the desk top stays planted
          const pv = J.pelvis, m = new DOMMatrix()
            .rotateSelf(0, 0, p.lean).scaleSelf(facing * sx, sy)
            .translateSelf(0, p.pelvisY + g0)
            .translateSelf(pv[0], pv[1]).rotateSelf(0, 0, torsoA).translateSelf(-pv[0], -pv[1])
            .translateSelf(0, pv[1]).scaleSelf(1, torsoS).translateSelf(0, -pv[1]).invertSelf();
          n.under.setAttribute('transform', `matrix(${m.a.toFixed(5)} ${m.b.toFixed(5)} ${m.c.toFixed(5)} ${m.d.toFixed(5)} ${m.e.toFixed(3)} ${m.f.toFixed(3)})`);
          const mb = new DOMMatrix().rotateSelf(0, 0, p.lean).scaleSelf(facing * sx, sy).invertSelf();
          n.behind.setAttribute('transform', `matrix(${mb.a.toFixed(5)} ${mb.b.toFixed(5)} ${mb.c.toFixed(5)} ${mb.d.toFixed(5)} ${mb.e.toFixed(3)} ${mb.f.toFixed(3)})`);
        }
        ['L', 'R'].forEach((s) => {
          const k = s === 'L' ? 1 : -1;
          n[`arm-${s}-upper`].setAttribute('transform', rot(p['arm' + s + 'U'] + k * br * 0.8, J['shoulder' + s]));
          n[`arm-${s}-lower`].setAttribute('transform', rot(p['arm' + s + 'L'], J['elbow' + s]));
          n[`hand-${s}`].setAttribute('transform', rot(p['hand' + s], J['wrist' + s]));
          const pose = tracks['hand' + s].at(t);
          for (const k2 in n['poses' + s]) n['poses' + s][k2].setAttribute('display', k2 === pose ? 'inline' : 'none');
          if (n.noodle) {   // noodle, or a short curve hugging the torso when the arms track says hug
            const sh = J['shoulder' + s], el = J['elbow' + s], wr = J['wrist' + s];
            const hug = tracks.arms && tracks.arms.at(t) === 'hug';
            n[`arm-${s}-upper`].setAttribute('display', hug ? 'none' : 'inline');
            if (hug) {
              const side = s === 'L' ? -1 : 1;
              const x = side * 78, y0 = sh[1] + 6, y1 = sh[1] + 150;
              n.noodle[s].setAttribute('d', `M${sh[0].toFixed(1)} ${y0.toFixed(1)} Q${(x).toFixed(1)} ${(y0 + 40).toFixed(1)} ${(x * 0.92).toFixed(1)} ${y1.toFixed(1)}`);
              if (n.noodle[s].parentNode) n.noodle[s].parentNode.insertBefore(n.noodle[s], n.noodle[s].parentNode.firstChild);
            } else {
              const a1 = R(p['arm' + s + 'U'] + k * br * 0.8), a2 = R(p['arm' + s + 'L']);
              const rp = (q, c, a) => [c[0] + (q[0] - c[0]) * Math.cos(a) - (q[1] - c[1]) * Math.sin(a), c[1] + (q[0] - c[0]) * Math.sin(a) + (q[1] - c[1]) * Math.cos(a)];
              const E = rp(el, sh, a1), W = rp(rp(wr, el, a2), sh, a1);
              const cx = 2 * E[0] - (sh[0] + W[0]) / 2, cy = 2 * E[1] - (sh[1] + W[1]) / 2;
              n.noodle[s].setAttribute('d', `M${sh[0].toFixed(1)} ${(sh[1] + 4).toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${W[0].toFixed(1)} ${W[1].toFixed(1)}`);
            }
          }
        });
        if (n.heldProps) { const held = tracks.held.at(t); for (const k2 in n.heldProps) n.heldProps[k2].setAttribute('display', k2 === held ? 'inline' : 'none'); }
        n.neck.setAttribute('transform', rot(p.neck, J.neck));
        // viseme / mood mouth + jaw
        const vis = tracks.viseme.at(t); const mood = tracks.mood.at(t);
        let mouth = (vis && vis !== 'REST') ? vis : (mood || 'REST');
        if (paper && mouth === 'REST') mouth = 'X';
        if (n.lightFlips) {
          const side = tracks.lightSide.at(t);
          const tf = side > 0 ? 'scale(-1 1)' : '';
          n.lightFlips.forEach((g) => g.setAttribute('transform', tf));
        }
        if (paper && cfg.inkPx) {
          const factor = cfg.inkPx / ((cfg.ink || 4.2) * (p.scale || 1) * st);
          S.retuneInk(svg, factor, (p.scale || 1) * st);
        }
        for (const k2 in n.mouths) n.mouths[k2].setAttribute('display', k2 === mouth ? 'inline' : 'none');
        const open = (S.VISEME_OPEN[mouth] || 0) * 0.7 + p.jaw;
        const crown = cfg.head.crown;
        n['head-pivot'].setAttribute('transform', `${rot(p.head + br * 0.25, J.headPivot)} translate(0 ${crown[1]}) scale(1 ${(1 + open * 0.018).toFixed(4)}) translate(0 ${-crown[1]})`);
        // 2.5D head turn
        const tn = S.clamp(p.turn, -1, 1), at = Math.abs(tn);
        n['face-features'].setAttribute('transform', `translate(${(tn * 16).toFixed(2)} ${(open * 1.2).toFixed(2)})`);
        n.nose.setAttribute('transform', `translate(${(tn * 7).toFixed(2)} 0)`);
        n.mouth.setAttribute('transform', `translate(${(tn * 2.5).toFixed(2)} ${(open * 1.6).toFixed(2)})`);
        ['L', 'R'].forEach((s) => {
          const e = n.eye[s]; const far = (s === 'R' && tn > 0) || (s === 'L' && tn < 0);
          const sxe = far ? 1 - at * 0.28 : 1 + at * 0.04;
          e.g.setAttribute('transform', `translate(${e.cx} ${e.cy}) scale(${sxe.toFixed(3)} 1) translate(${-e.cx} ${-e.cy})`);
          const ear = n.ear[s]; const k = s === 'L' ? 1 : -1; const nearSide = !far;
          ear.setAttribute('transform', `translate(${(k * at * (nearSide ? 20 : 34) - tn * 4).toFixed(2)} 0)`);
        });
        n.hairBack.setAttribute('transform', `translate(${(-tn * 10).toFixed(2)} ${(p.hairBounce * 0.6).toFixed(2)}) ${rot(-p.hairLag * 0.6, crown)}`);
        n.hairMain.setAttribute('transform', `translate(${(tn * 3).toFixed(2)} ${(p.hairBounce * 0.3).toFixed(2)})`);
        n.hairFront.setAttribute('transform', `translate(${(tn * 8).toFixed(2)} ${p.hairBounce.toFixed(2)}) ${rot(p.hairLag, crown)}`);
        n.hairSheen.setAttribute('transform', `translate(${(tn * 5).toFixed(2)} ${(p.hairBounce * 0.4).toFixed(2)})`);
        if (n.glasses) n.glasses.setAttribute('transform', `translate(${(tn * 16).toFixed(2)} ${p.glassesY.toFixed(2)})`);
        if (n.glint) n.glint.forEach((g) => g.g.setAttribute('transform', `translate(${(p.glint * 40).toFixed(2)} 0)`));
        // brows
        ['L', 'R'].forEach((s) => {
          const b = n.brow[s]; const inner = (s === 'L' ? 1 : -1) * p.browInner; const tilt = s === 'L' ? p.browTiltL : p.browTiltR;
          b.g.setAttribute('transform', `translate(0 ${(s === 'L' ? p.browL : p.browR).toFixed(2)}) ${rot(inner + tilt, [b.cx, b.cy])}`);
        });
        // lids: expression lid, blink, saccade look
        const bl = blinkAt(t); const sc = saccAt(t);
        const dollar = tracks.dollar.at(t);
        ['L', 'R'].forEach((s) => {
          const e = n.eye[s]; const lid = Math.max(s === 'L' ? p.lidL : p.lidR, bl); const lidB = s === 'L' ? p.lidBL : p.lidBR;
          e.lid.setAttribute('transform', `translate(0 ${(lid * e.ry * 2.6).toFixed(2)})`);
          e.lidB.setAttribute('transform', `translate(0 ${(-lidB * e.ry * 2.4).toFixed(2)})`);
          const lk = paper ? 0.55 : 1;
          const lx = S.clamp(p.lookX + sc[0], -1.2, 1.2) * e.rx * 0.42 * lk, ly = S.clamp(p.lookY + sc[1], -1, 1) * e.ry * 0.35 * lk;
          const ps = paper ? S.clamp(2 - p.pupil, 0.82, 1.32) : p.pupil;   // paper: a shock widens the oval
          e.iris.setAttribute('transform', `translate(${(lx + e.cx).toFixed(2)} ${(ly + e.cy).toFixed(2)}) scale(${ps.toFixed(3)}) translate(${-e.cx} ${-e.cy})`);
          e.iris.setAttribute('display', dollar ? 'none' : 'inline');
          e.dollar.setAttribute('display', dollar ? 'inline' : 'none');
        });
        n.sweat.setAttribute('display', tracks.sweat.at(t) ? 'inline' : 'none');
        const acc = tracks.acc.at(t) || [];
        for (const k2 in n.acc) n.acc[k2].setAttribute('display', acc.includes(k2) ? 'inline' : 'none');
        if (n.glasses) n.glasses.setAttribute('display', acc.some((a) => (cfg.accHidesGlasses || []).includes(a)) ? 'none' : 'inline');
        if (n.acc.cap) n.acc.cap.setAttribute('transform', `translate(${(p.turn * 6).toFixed(2)} ${(p.hairBounce * 0.4).toFixed(2)})`);
        ['mustache', 'nerd-glasses'].forEach((k2) => { if (n.acc[k2]) n.acc[k2].setAttribute('transform', `translate(${(p.turn * (k2 === 'mustache' ? 9 : 16)).toFixed(2)} ${(open * (k2 === 'mustache' ? 0.6 : 0)).toFixed(2)})`); });
        n.cheeks.setAttribute('opacity', p.blush.toFixed(3));
        if (paper && tracks.view) {
          const view = tracks.view.at(t) || 'F';
          const back = view === 'B', prof = view === 'P', three = view === 'Q';
          if (n['face-features']) n['face-features'].setAttribute('display', back ? 'none' : 'inline');
          if (n.glasses) n.glasses.setAttribute('display', back ? 'none' : 'inline');
          if (n.hairFront) n.hairFront.setAttribute('display', back ? 'none' : 'inline');
          if (n.eye && n.eye.L) n.eye.L.g.setAttribute('display', prof ? 'none' : 'inline');
          if (n.brow && n.brow.L) n.brow.L.g.setAttribute('display', prof ? 'none' : 'inline');
          if (n['leg-L-upper']) n['leg-L-upper'].setAttribute('display', prof ? 'none' : 'inline');
          const vx = prof ? 0.58 : three ? 0.84 : back ? 0.82 : 1;
          const prev = n.torso.getAttribute('transform') || '';
          if (vx !== 1 && prev.indexOf('scale(') >= 0) n.torso.setAttribute('transform', prev.replace(/scale\(1 /, 'scale(' + vx.toFixed(3) + ' '));
          if (three && n['face-features'] && !back) {
            const cur = n['face-features'].getAttribute('transform') || '';
            n['face-features'].setAttribute('transform', cur + ' translate(26 0)');
          }
          svg.setAttribute('data-view', view);
        }
      };
      S.onApply(ch.apply, opts.order || 10);
      ch.apply(0);
      return ch;
    }
  };
})(window.Studio = window.Studio || {});
