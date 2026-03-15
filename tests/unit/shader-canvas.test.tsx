import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, cleanup } from '@testing-library/react';
import ShaderCanvas from '@art/components/ShaderCanvas';
import { createMockGL } from '../helpers/webgl-mock';

describe('ShaderCanvas', () => {
  let mockGL: ReturnType<typeof createMockGL>;
  let rAfSpy: ReturnType<typeof vi.fn>;
  let cAfSpy: ReturnType<typeof vi.fn>;
  let resizeObserverDisconnect: ReturnType<typeof vi.fn>;
  let intersectionObserverDisconnect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockGL = createMockGL();

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((id: string) => {
      if (id === 'webgl2') return mockGL as unknown as WebGL2RenderingContext;
      return null;
    });

    window.matchMedia = vi.fn(() => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    rAfSpy = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
    cAfSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    resizeObserverDisconnect = vi.fn();
    vi.stubGlobal('ResizeObserver', class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = resizeObserverDisconnect;
    });

    intersectionObserverDisconnect = vi.fn();
    vi.stubGlobal('IntersectionObserver', class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = intersectionObserverDisconnect;
      constructor(public callback: IntersectionObserverCallback, _opts?: IntersectionObserverInit) {}
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders a <canvas> when WebGL context is available', () => {
    const { container } = render(
      <ShaderCanvas fragmentSource="void main(){}" />
    );
    expect(container.querySelector('canvas')).toBeTruthy();
  });

  it('renders fallback <div> with gradient when no WebGL', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    const { container } = render(
      <ShaderCanvas fragmentSource="void main(){}" />
    );

    const fallback = container.querySelector('div');
    expect(fallback).toBeTruthy();
    expect(fallback?.style.background).toContain('linear-gradient');
  });

  it('applies custom fallbackGradient prop', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const gradient = 'linear-gradient(red, blue)';

    const { container } = render(
      <ShaderCanvas fragmentSource="void main(){}" fallbackGradient={gradient} />
    );

    const fallback = container.querySelector('div');
    expect(fallback?.style.background).toBe(gradient);
  });

  it('passes className and style to canvas', () => {
    const { container } = render(
      <ShaderCanvas
        fragmentSource="void main(){}"
        className="my-canvas"
        style={{ opacity: 0.5 }}
      />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas?.className).toBe('my-canvas');
    expect(canvas?.style.opacity).toBe('0.5');
  });

  it('sets aria-hidden="true" on canvas', () => {
    const { container } = render(
      <ShaderCanvas fragmentSource="void main(){}" />
    );
    expect(container.querySelector('canvas')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('sets aria-hidden="true" on fallback div', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    const { container } = render(
      <ShaderCanvas fragmentSource="void main(){}" />
    );
    expect(container.querySelector('div')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('does not start rAF loop when reduced motion is preferred', () => {
    window.matchMedia = vi.fn(() => ({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(<ShaderCanvas fragmentSource="void main(){}" />);

    expect(rAfSpy).not.toHaveBeenCalled();
    // Single synchronous frame should still draw
    expect(mockGL.drawArrays).toHaveBeenCalledTimes(1);
  });

  it('cleans up on unmount: cancels rAF, disconnects observers', () => {
    const { unmount } = render(
      <ShaderCanvas fragmentSource="void main(){}" />
    );

    unmount();

    expect(cAfSpy).toHaveBeenCalled();
    expect(resizeObserverDisconnect).toHaveBeenCalled();
    expect(intersectionObserverDisconnect).toHaveBeenCalled();
  });

  it('shows fallback after webglcontextlost event', async () => {
    const { container } = render(<ShaderCanvas fragmentSource="void main(){}" />);
    expect(container.querySelector('canvas')).toBeTruthy();

    await act(async () => {
      container.querySelector('canvas')!.dispatchEvent(new Event('webglcontextlost'));
    });

    expect(container.querySelector('canvas')).toBeFalsy();
    const fallback = container.querySelector('div');
    expect(fallback).toBeTruthy();
    expect(fallback?.style.background).toContain('linear-gradient');
    expect(cAfSpy).toHaveBeenCalled();
  });
});
