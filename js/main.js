// Entry point. Every element in index.html with data-scene="NAME" gets
// js/scenes/NAME.js loaded for it, and that file's init(section) is called.
// To add a scene: add a <section data-scene="NAME"> and a matching file.

if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('js');

  const sections = [...document.querySelectorAll('[data-scene]')];

  await Promise.all(
    sections.map(async (section) => {
      // One broken scene shouldn't take the rest of the page down.
      try {
        const scene = await import(`./scenes/${section.dataset.scene}.js`);
        await scene.init(section);
      } catch (error) {
        console.error(`Scene "${section.dataset.scene}" failed to start`, error);
      }
    })
  );

  // The demos change the page's height as they load and as people use
  // them, so re-measure where each caption sits whenever that happens.
  let lastHeight = 0;
  let timer;
  new ResizeObserver(() => {
    const height = document.body.offsetHeight;
    if (height === lastHeight) return;
    lastHeight = height;
    clearTimeout(timer);
    timer = setTimeout(() => ScrollTrigger.refresh(), 200);
  }).observe(document.body);
} else {
  console.error('GSAP did not load, so the scenes cannot animate. Check your connection to the CDN.');
}
