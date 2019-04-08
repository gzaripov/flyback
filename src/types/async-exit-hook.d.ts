declare module 'async-exit-hook' {
  const onExitHook: (hook: () => void) => void;

  export = onExitHook;
}
