import { useRef, useEffect, useState, type CSSProperties } from 'react';

interface ShaderCanvasProps {
  fragmentSource: string;
  className?: string;
  style?: CSSProperties;
  fallbackGradient?: string;
}

const VERTEX_SOURCE = `#version 300 es
in vec4 a_position;
void main() {
  gl_Position = a_position;
}`;

const VERTEX_SOURCE_V1 = `
attribute vec4 a_position;
void main() {
  gl_Position = a_position;
}`;

function compileShader(gl: WebGLRenderingContext | WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext | WebGL2RenderingContext, vertexSource: string, fragmentSource: string): WebGLProgram | null {
  const vert = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vert || !frag) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

export default function ShaderCanvas({
  fragmentSource,
  className,
  style,
  fallbackGradient = 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
}: ShaderCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Try WebGL2 first, fall back to WebGL1
    let gl: WebGLRenderingContext | WebGL2RenderingContext | null = canvas.getContext('webgl2');
    let isWebGL2 = !!gl;
    if (!gl) {
      gl = canvas.getContext('webgl');
      isWebGL2 = false;
    }
    if (!gl) {
      setError(true);
      return;
    }

    const vertSource = isWebGL2 ? VERTEX_SOURCE : VERTEX_SOURCE_V1;
    const fragSource = isWebGL2
      ? fragmentSource
      : fragmentSource.replace('#version 300 es', '');

    const program = createProgram(gl, vertSource, fragSource);
    if (!program) {
      setError(true);
      return;
    }

    // Fullscreen quad
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1,
    ]), gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, 'u_resolution');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');

    let mouseX = 0;
    let mouseY = 0;
    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = rect.height - (e.clientY - rect.top);
    };
    canvas.addEventListener('mousemove', handleMouse);

    let animationId = 0;
    let isVisible = true;
    let startTime = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      gl!.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    // Visibility lifecycle
    const observer = new IntersectionObserver(
      ([entry]) => { isVisible = entry.isIntersecting; },
      { threshold: 0 }
    );
    observer.observe(canvas);

    const handleVisibility = () => {
      if (document.hidden) isVisible = false;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Context loss
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(animationId);
      setError(true);
    };
    canvas.addEventListener('webglcontextlost', handleContextLost);

    const render = (now: number) => {
      if (!isVisible) {
        animationId = requestAnimationFrame(render);
        return;
      }

      const time = (now - startTime) / 1000;
      gl!.useProgram(program);

      if (uResolution) gl!.uniform2f(uResolution, canvas.width, canvas.height);
      if (uTime) gl!.uniform1f(uTime, time);
      if (uMouse) gl!.uniform2f(uMouse, mouseX, mouseY);

      gl!.drawArrays(gl!.TRIANGLES, 0, 6);
      animationId = requestAnimationFrame(render);
    };

    if (reducedMotion) {
      // Render a single frame
      const time = 0;
      gl!.useProgram(program);
      if (uResolution) gl!.uniform2f(uResolution, canvas.width, canvas.height);
      if (uTime) gl!.uniform1f(uTime, time);
      if (uMouse) gl!.uniform2f(uMouse, 0, 0);
      gl!.drawArrays(gl!.TRIANGLES, 0, 6);
    } else {
      animationId = requestAnimationFrame(render);
    }

    return () => {
      cancelAnimationFrame(animationId);
      canvas.removeEventListener('mousemove', handleMouse);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      document.removeEventListener('visibilitychange', handleVisibility);
      observer.disconnect();
      resizeObserver.disconnect();
    };
  }, [fragmentSource]);

  if (error) {
    return (
      <div
        className={className}
        style={{ ...style, background: fallbackGradient }}
        aria-hidden="true"
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%', display: 'block', ...style }}
      aria-hidden="true"
    />
  );
}
