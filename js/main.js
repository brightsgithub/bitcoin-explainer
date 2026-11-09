// Entry point: starts each scene. To add a scene, create a file in
// js/scenes/ that exports an init function, then list it here.

import { initIntro } from './scenes/00-intro.js';
import { initProblem } from './scenes/01-problem.js';

const scenes = [initIntro, initProblem];

if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('js');

  for (const init of scenes) {
    // One broken scene shouldn't take the rest of the page down.
    try {
      init();
    } catch (error) {
      console.error(`Scene failed to start: ${init.name}`, error);
    }
  }
} else {
  console.error('GSAP did not load, so the scenes cannot animate. Check your connection to the CDN.');
}
