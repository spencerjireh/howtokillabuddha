#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;

out vec4 fragColor;

// Simplex-style noise hash
vec3 hash3(vec3 p) {
  p = vec3(
    dot(p, vec3(127.1, 311.7, 74.7)),
    dot(p, vec3(269.5, 183.3, 246.1)),
    dot(p, vec3(113.5, 271.9, 124.6))
  );
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(
      mix(dot(hash3(i + vec3(0,0,0)), f - vec3(0,0,0)),
          dot(hash3(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
      mix(dot(hash3(i + vec3(0,1,0)), f - vec3(0,1,0)),
          dot(hash3(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
    mix(
      mix(dot(hash3(i + vec3(0,0,1)), f - vec3(0,0,1)),
          dot(hash3(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
      mix(dot(hash3(i + vec3(0,1,1)), f - vec3(0,1,1)),
          dot(hash3(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y),
    u.z
  );
}

float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

  float t = u_time * 0.15;

  // Layered noise field
  float n1 = fbm(vec3(p * 3.0, t));
  float n2 = fbm(vec3(p * 5.0 + n1 * 0.5, t * 1.3));
  float n3 = fbm(vec3(p * 8.0 + n2 * 0.3, t * 0.7));

  // Monochrome palette with subtle warm/cool shifts
  float base = 0.5 + 0.5 * n2;
  float detail = 0.05 * n3;

  vec3 color = vec3(
    base * 0.12 + detail,
    base * 0.11 + detail * 0.8,
    base * 0.14 + detail * 1.2
  );

  // Vignette
  float vignette = 1.0 - smoothstep(0.3, 0.9, length(p));
  color *= vignette;

  // Grain
  float grain = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.03;
  color += grain;

  fragColor = vec4(color, 1.0);
}
