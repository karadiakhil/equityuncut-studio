/* Fallback when render-spec does not inject window.__SPEC_OVERRIDE. */
window.SCENE_SPEC = {
  version: 1,
  id: 'upgrade-fallback',
  duration: 1,
  fps: 30,
  size: [1920, 1080],
  seed: 1,
  shots: [{t: 0, dur: 1, set: 'office', lighting: 'flat', time: 'day', weather: 'clear', camera: {x: 960, y: 700, zoom: 1}}],
  characters: []
};
