/**
 * @react-three/fiber 9.x still constructs THREE.Clock, which three r18x flags as
 * deprecated. It's a harmless third-party notice; drop only that single message so the
 * console stays clean. Imported FIRST by the scene so it runs before R3F mounts.
 */
if (typeof window !== 'undefined') {
  const w = window as unknown as { __clockWarnPatched?: boolean };
  if (!w.__clockWarnPatched) {
    w.__clockWarnPatched = true;
    const orig = console.warn.bind(console);
    console.warn = (...args: unknown[]) => {
      if (typeof args[0] === 'string' && args[0].includes('THREE.Clock')) return;
      orig(...args);
    };
  }
}
export {};
