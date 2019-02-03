
const renderLoop = (fun: (deltaTime: number) => void) => {
  let animationFrame: number;
  let t0 = performance.now();
  const loop = () => {
    const t1 = performance.now();
    const deltaMs = t1 - t0;
    fun(deltaMs / 1000);
    t0 = t1;
    animationFrame = requestAnimationFrame(loop);
  };
  animationFrame = requestAnimationFrame(loop);

  return () => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  };
};

type CancelRun = () => void;

export const run = <State>(
  createInitialeState: () => State,
  draw: (state: State, context: CanvasRenderingContext2D, deltaTime: number) => State,
  onKey: (state: State, eventName: 'keyup' | 'keydown', keyCode: string) => State,
  canvas: HTMLCanvasElement
): CancelRun => {
  let state: State = createInitialeState();
  const context = canvas.getContext('2d');
  if (context === null) { throw Error(); }

  const onKeyDown = (e: KeyboardEvent) => {
    state = onKey(state, 'keydown', e.code);
  };
  const onKeyUp = (e: KeyboardEvent) => {
    state = onKey(state, 'keyup', e.code);
  };
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  const cancelRenderLoop = renderLoop((deltaTime) => {
    state = draw(state, context, deltaTime);
  });

  return () => {
    cancelRenderLoop();
    canvas.removeEventListener('keyup', onKeyUp);
    canvas.removeEventListener('keydown', onKeyDown);
  };
};
