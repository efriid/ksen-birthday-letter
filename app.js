const VALID_STATES = new Set(['sealed', 'revealed', 'letter', 'celebration']);

export function createSequenceController({
  initialState = 'sealed',
  onChange = () => {},
  schedule = (release) => setTimeout(release, 850),
} = {}) {
  if (!VALID_STATES.has(initialState)) {
    throw new TypeError(`Unknown initial state: ${initialState}`);
  }

  let state = initialState;
  let locked = false;

  const moveTo = (nextState, { lock = true } = {}) => {
    if (locked || state === nextState || !VALID_STATES.has(nextState)) {
      return false;
    }

    state = nextState;
    locked = lock;
    onChange(state);

    if (lock) {
      schedule(() => {
        locked = false;
      });
    }

    return true;
  };

  onChange(state);

  return {
    getState: () => state,
    advance: () => {
      if (state === 'sealed') return moveTo('revealed');
      if (state === 'revealed') return moveTo('letter');
      return false;
    },
    showLetter: () => moveTo('letter'),
    showCelebration: () => {
      if (state !== 'letter') return false;
      return moveTo('celebration');
    },
    reopenLetter: () => {
      if (state !== 'celebration') return false;
      return moveTo('letter', { lock: false });
    },
  };
}

function bindExperience() {
  const scenes = new Map([
    ['sealed', document.querySelector('#scene-envelope')],
    ['revealed', document.querySelector('#scene-reveal')],
    ['letter', document.querySelector('#scene-letter')],
    ['celebration', document.querySelector('#scene-celebration')],
  ]);

  const render = (activeState) => {
    document.documentElement.dataset.scene = activeState;
    for (const [state, scene] of scenes) {
      if (!scene) continue;
      scene.hidden = state !== activeState;
      scene.classList.toggle('scene--active', state === activeState);
    }

    if (activeState === 'letter') {
      scenes.get('letter')?.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const controller = createSequenceController({ onChange: render });

  document.querySelector('[data-action="advance-sealed"]')?.addEventListener('click', () => controller.advance());
  document.querySelector('[data-action="advance-reveal"]')?.addEventListener('click', () => controller.advance());
  document.querySelector('[data-action="celebrate"]')?.addEventListener('click', () => controller.showCelebration());
  document.querySelector('[data-action="reopen-letter"]')?.addEventListener('click', () => controller.reopenLetter());
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindExperience, { once: true });
  } else {
    bindExperience();
  }
}
