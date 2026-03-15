export interface DeviceTier {
  tier: 'low' | 'mid' | 'high';
  webgl2: boolean;
  webgl1: boolean;
  reducedMotion: boolean;
  saveData: boolean;
}

export function detectCapabilities(): DeviceTier {
  const canvas = document.createElement('canvas');
  const webgl2 = !!canvas.getContext('webgl2');
  const webgl1 = !!canvas.getContext('webgl');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const nav = navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } };
  const saveData = nav.connection?.saveData ?? false;
  const slowConnection = nav.connection?.effectiveType === '2g' || nav.connection?.effectiveType === 'slow-2g';

  let tier: DeviceTier['tier'] = 'high';
  if (!webgl1 || saveData || slowConnection) {
    tier = 'low';
  } else if (!webgl2) {
    tier = 'mid';
  }

  return { tier, webgl2, webgl1, reducedMotion, saveData };
}
