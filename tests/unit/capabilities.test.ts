import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { detectCapabilities } from '@art/utils/capabilities';

describe('detectCapabilities', () => {
  let originalCreateElement: typeof document.createElement;
  let originalMatchMedia: typeof window.matchMedia;
  let originalNavigator: PropertyDescriptor | undefined;

  beforeEach(() => {
    originalCreateElement = document.createElement;
    originalMatchMedia = window.matchMedia;
    originalNavigator = Object.getOwnPropertyDescriptor(window, 'navigator');
  });

  afterEach(() => {
    document.createElement = originalCreateElement;
    window.matchMedia = originalMatchMedia;
    if (originalNavigator) {
      Object.defineProperty(window, 'navigator', originalNavigator);
    }
    vi.restoreAllMocks();
  });

  function mockWebGL(webgl2: boolean, webgl1: boolean) {
    vi.spyOn(document, 'createElement').mockReturnValue({
      getContext: vi.fn((id: string) => {
        if (id === 'webgl2') return webgl2 ? {} : null;
        if (id === 'webgl') return webgl1 ? {} : null;
        return null;
      }),
    } as unknown as HTMLCanvasElement);
  }

  function mockMatchMedia(reducedMotion: boolean) {
    window.matchMedia = vi.fn(() => ({
      matches: reducedMotion,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }

  function mockConnection(opts?: { saveData?: boolean; effectiveType?: string }) {
    Object.defineProperty(window, 'navigator', {
      value: {
        ...window.navigator,
        connection: opts ?? undefined,
      },
      configurable: true,
    });
  }

  it('returns tier=high with WebGL2 and no limiting flags', () => {
    mockWebGL(true, true);
    mockMatchMedia(false);
    mockConnection();

    const result = detectCapabilities();
    expect(result.tier).toBe('high');
    expect(result.webgl2).toBe(true);
    expect(result.webgl1).toBe(true);
  });

  it('returns tier=mid when only WebGL1 available', () => {
    mockWebGL(false, true);
    mockMatchMedia(false);
    mockConnection();

    const result = detectCapabilities();
    expect(result.tier).toBe('mid');
    expect(result.webgl2).toBe(false);
    expect(result.webgl1).toBe(true);
  });

  it('returns tier=low when no WebGL available', () => {
    mockWebGL(false, false);
    mockMatchMedia(false);
    mockConnection();

    const result = detectCapabilities();
    expect(result.tier).toBe('low');
    expect(result.webgl2).toBe(false);
    expect(result.webgl1).toBe(false);
  });

  it('returns tier=low when saveData is true despite WebGL2', () => {
    mockWebGL(true, true);
    mockMatchMedia(false);
    mockConnection({ saveData: true });

    const result = detectCapabilities();
    expect(result.tier).toBe('low');
    expect(result.saveData).toBe(true);
  });

  it('returns tier=low when effectiveType is 2g', () => {
    mockWebGL(true, true);
    mockMatchMedia(false);
    mockConnection({ effectiveType: '2g' });

    const result = detectCapabilities();
    expect(result.tier).toBe('low');
  });

  it('returns tier=low when effectiveType is slow-2g', () => {
    mockWebGL(true, true);
    mockMatchMedia(false);
    mockConnection({ effectiveType: 'slow-2g' });

    const result = detectCapabilities();
    expect(result.tier).toBe('low');
  });

  it('reflects reducedMotion=true without downgrading tier', () => {
    mockWebGL(true, true);
    mockMatchMedia(true);
    mockConnection();

    const result = detectCapabilities();
    expect(result.tier).toBe('high');
    expect(result.reducedMotion).toBe(true);
  });
});
