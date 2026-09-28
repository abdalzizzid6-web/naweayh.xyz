export function getEnvVariable(key: string, defaultValue: string = ''): string {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  try {
    // Safe lookup without triggering esbuild's CJS import.meta warning
    const meta = typeof globalThis !== 'undefined' && (globalThis as any).importMeta;
    if (meta && meta.env) {
      if (meta.env[key]) return meta.env[key];
      if (meta.env[`VITE_${key}`]) return meta.env[`VITE_${key}`];
    }
  } catch {
    // Ignore in unsupported environments
  }
  return defaultValue;
}
