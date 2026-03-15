import { vi } from 'vitest';

// WebGL constants
export const GL_VERTEX_SHADER = 0x8b31;
export const GL_FRAGMENT_SHADER = 0x8b30;
export const GL_COMPILE_STATUS = 0x8b81;
export const GL_LINK_STATUS = 0x8b82;
export const GL_ARRAY_BUFFER = 0x8892;
export const GL_STATIC_DRAW = 0x88e4;
export const GL_FLOAT = 0x1406;
export const GL_TRIANGLES = 0x0004;

export function createMockGL(overrides: Record<string, unknown> = {}) {
  return {
    VERTEX_SHADER: GL_VERTEX_SHADER,
    FRAGMENT_SHADER: GL_FRAGMENT_SHADER,
    COMPILE_STATUS: GL_COMPILE_STATUS,
    LINK_STATUS: GL_LINK_STATUS,
    ARRAY_BUFFER: GL_ARRAY_BUFFER,
    STATIC_DRAW: GL_STATIC_DRAW,
    FLOAT: GL_FLOAT,
    TRIANGLES: GL_TRIANGLES,

    createShader: vi.fn(() => ({})),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    getShaderInfoLog: vi.fn(() => ''),
    deleteShader: vi.fn(),

    createProgram: vi.fn(() => ({})),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    getProgramInfoLog: vi.fn(() => ''),
    deleteProgram: vi.fn(),

    createBuffer: vi.fn(() => ({})),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    getAttribLocation: vi.fn(() => 0),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    getUniformLocation: vi.fn(() => ({})),

    useProgram: vi.fn(),
    uniform1f: vi.fn(),
    uniform2f: vi.fn(),
    viewport: vi.fn(),
    drawArrays: vi.fn(),

    ...overrides,
  };
}
