import { describe, it, expect, vi } from 'vitest';
import { compileShader, createProgram } from '@art/components/ShaderCanvas';
import { createMockGL, GL_COMPILE_STATUS, GL_LINK_STATUS } from '../helpers/webgl-mock';

describe('compileShader', () => {
  it('returns shader on success', () => {
    const gl = createMockGL();
    const shaderObj = { id: 'shader' };
    gl.createShader.mockReturnValue(shaderObj);
    gl.getShaderParameter.mockReturnValue(true);

    const result = compileShader(gl as unknown as WebGL2RenderingContext, gl.VERTEX_SHADER, 'source');

    expect(result).toBe(shaderObj);
    expect(gl.shaderSource).toHaveBeenCalledWith(shaderObj, 'source');
    expect(gl.compileShader).toHaveBeenCalledWith(shaderObj);
  });

  it('returns null when createShader returns null', () => {
    const gl = createMockGL({ createShader: vi.fn(() => null) });

    const result = compileShader(gl as unknown as WebGL2RenderingContext, gl.VERTEX_SHADER, 'source');

    expect(result).toBeNull();
  });

  it('returns null and deletes shader on compile failure', () => {
    const gl = createMockGL();
    const shaderObj = { id: 'bad-shader' };
    gl.createShader.mockReturnValue(shaderObj);
    gl.getShaderParameter.mockImplementation((_s: unknown, param: number) => {
      if (param === GL_COMPILE_STATUS) return false;
      return true;
    });

    const result = compileShader(gl as unknown as WebGL2RenderingContext, gl.VERTEX_SHADER, 'bad source');

    expect(result).toBeNull();
    expect(gl.deleteShader).toHaveBeenCalledWith(shaderObj);
  });
});

describe('createProgram', () => {
  it('returns program when both shaders compile and link succeeds', () => {
    const gl = createMockGL();
    const programObj = { id: 'program' };
    gl.createProgram.mockReturnValue(programObj);
    gl.getShaderParameter.mockReturnValue(true);
    gl.getProgramParameter.mockReturnValue(true);

    const result = createProgram(gl as unknown as WebGL2RenderingContext, 'vert', 'frag');

    expect(result).toBe(programObj);
    expect(gl.attachShader).toHaveBeenCalledTimes(2);
    expect(gl.linkProgram).toHaveBeenCalledWith(programObj);
  });

  it('returns null when vertex shader fails to compile', () => {
    const gl = createMockGL();
    gl.createShader.mockReturnValue(null);

    const result = createProgram(gl as unknown as WebGL2RenderingContext, 'bad-vert', 'frag');

    expect(result).toBeNull();
    expect(gl.createProgram).not.toHaveBeenCalled();
  });

  it('returns null and deletes program on link failure', () => {
    const gl = createMockGL();
    const programObj = { id: 'bad-program' };
    gl.createProgram.mockReturnValue(programObj);
    gl.getShaderParameter.mockReturnValue(true);
    gl.getProgramParameter.mockImplementation((_p: unknown, param: number) => {
      if (param === GL_LINK_STATUS) return false;
      return true;
    });

    const result = createProgram(gl as unknown as WebGL2RenderingContext, 'vert', 'frag');

    expect(result).toBeNull();
    expect(gl.deleteProgram).toHaveBeenCalledWith(programObj);
  });
});
