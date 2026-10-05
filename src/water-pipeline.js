window.WaterWarpPipeline = class WaterWarpPipeline extends Phaser.Renderer.WebGL.Pipelines.SinglePipeline {
    constructor(game) {
        super({
            game,
            fragShader: `
                #ifdef GL_FRAGMENT_PRECISION_HIGH
                precision highp float;
                #else
                precision mediump float;
                #endif

                uniform sampler2D uMainSampler;
                uniform float uTime;
                uniform vec2 uScroll;
                uniform float uViewHeight;
                uniform vec4 uFish[${FISH_MAX_VISIBLE}];
                uniform vec4 uFishShape[${FISH_MAX_VISIBLE}];
                uniform float uFishCount;
                varying vec2 outTexCoord;
                varying vec4 outTint;

                float hash(vec2 p) {
                    p = mod(p, 289.0);
                    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
                }

                float noise(vec2 x) {
                    vec2 i = floor(x);
                    vec2 f = fract(x);
                    f = f * f * (3.0 - 2.0 * f);
                    return mix(
                        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
                        f.y
                    );
                }

                float fbm(vec2 x) {
                    vec2 r = mat2(0.8, -0.6, 0.6, 0.8) * x;
                    return noise(r) * 0.65 + noise(mat2(0.8, 0.6, -0.6, 0.8) * x * 2.03 + vec2(7.3, 2.9)) * 0.35;
                }

                vec3 tone(float index) {
                    if (index < 0.5) return vec3(0.353, 0.494, 0.714);
                    if (index < 1.5) return vec3(0.376, 0.522, 0.741);
                    if (index < 2.5) return vec3(0.392, 0.541, 0.765);
                    if (index < 3.5) return vec3(0.408, 0.565, 0.792);
                    if (index < 4.5) return vec3(0.420, 0.592, 0.800);
                    if (index < 5.5) return vec3(0.435, 0.624, 0.812);
                    if (index < 6.5) return vec3(0.451, 0.655, 0.820);
                    if (index < 7.5) return vec3(0.471, 0.686, 0.827);
                    return vec3(0.820, 0.929, 0.945);
                }

                float code(float channel) {
                    return floor(channel * 255.0 + 0.5);
                }

                float caustic(vec2 p) {
                    return mod(code(texture2D(uMainSampler, (mod(p, 32.0) + 0.5) / 256.0).g), 3.0) * 0.5;
                }

                void main() {
                    vec4 mask = texture2D(uMainSampler, outTexCoord);

                    if (mask.r < 0.25) {
                        discard;
                    }

                    vec2 p = floor(vec2(gl_FragCoord.x, uViewHeight - gl_FragCoord.y)) + uScroll;
                    float t = uTime;
                    float checker = mod(p.x + p.y, 2.0) - 0.5;
                    float bayerX = mod(p.x, 2.0);
                    float bayerY = mod(p.y, 2.0);
                    float bayer = (bayerX < 0.5 ? (bayerY < 0.5 ? 0.0 : 3.0) : (bayerY < 0.5 ? 2.0 : 1.0)) / 3.0 - 0.5;

                    vec2 swell = p * 0.011 + vec2(t * 0.045, -t * 0.03);
                    vec2 warp = vec2(noise(swell), noise(swell + vec2(31.7, 11.3))) - 0.5;
                    float strength = 4.0 + 12.0 * noise(p * 0.007 + vec2(-t * 0.025, t * 0.02));
                    vec2 rippleField = p * 0.06 + vec2(t * 0.4, t * 0.27);
                    vec2 ripple = vec2(noise(rippleField), noise(rippleField + vec2(5.2, 1.3))) - 0.5;
                    vec2 offset = warp * strength + ripple * 3.0;

                    float shore = floor(code(mask.g) / 3.0);
                    float wobble = (fbm(p * 0.045 + warp * 0.6 + vec2(t * 0.05, -t * 0.04)) - 0.5) * 4.0;
                    float lap = sin(t * 1.3 + (p.x + p.y) * 0.045) * max(0.0, 1.0 - shore / 8.0) * 1.2;
                    float reach = shore + wobble + bayer * 2.2 - lap;
                    float depth = fbm(p * 0.012 + warp * 1.2 + vec2(t * 0.03, t * 0.01)) + bayer * 0.05 -
                        max(0.0, shore - 15.0) * 0.012;
                    float light = fbm(p * 0.021 - warp * 0.9 + vec2(-t * 0.06, t * 0.04)) + checker * 0.016;

                    float index = 3.0;

                    if (reach < 1.5) {
                        index = 7.0;
                    } else if (reach < 4.5) {
                        index = 6.0;
                    } else if (reach < 9.0) {
                        index = 5.0;
                    } else if (reach < 15.0) {
                        index = 4.0;
                    } else if (depth < 0.34) {
                        index = 1.0;
                    } else if (depth < 0.44) {
                        index = 2.0;
                    }

                    vec2 dashCell = vec2(floor((p.x - t * 4.0) / 7.0), p.y);
                    if (reach > 12.0 && light > 0.45 && mod(p.x - t * 4.0, 7.0) < 4.0 && hash(dashCell + floor(t * 0.4 + hash(dashCell) * 7.0)) > 0.96) index = min(index + 2.0, 6.0);
                    float first = caustic(floor(p + offset + vec2(t * 4.0, t * 1.6) + 0.5));
                    float second = caustic(floor(p * 0.75 - offset * 0.8 + vec2(-t * 2.6, t * 3.1) + 0.5) + vec2(13.0, 7.0));
                    float gate = light + max(0.0, 12.0 - shore) / 12.0 * 0.08 - max(0.0, shore - 10.0) * 0.012;

                    if (first > 0.9 && second > 0.9 && gate > 0.75) {
                        index = 8.0;
                    } else if (first > 0.9 && second > 0.9 && gate > 0.6) {
                        index = 7.0;
                    } else if (first > 0.9 && gate > 0.56) {
                        index = min(index + (gate > 0.63 ? 3.0 : 2.0), 7.0);
                    } else if (first > 0.4 && gate > 0.64) {
                        index = min(index + 1.0, 7.0);
                    }

                    float edgeCode = code(mask.b);

                    float shaded = mask.r < 0.75 ? 1.0 : 0.0;
                    float fishShaded = 0.0;

                    for (int fish = 0; fish < ${FISH_MAX_VISIBLE}; fish++) {
                        if (float(fish) >= uFishCount) break;

                        vec4 body = uFish[fish];
                        vec4 shape = uFishShape[fish];
                        vec2 local = p + 0.5 - body.xy;
                        float bound = shape.x * 0.5 + shape.y + abs(shape.w);

                        if (dot(local, local) > bound * bound) continue;

                        float along = dot(local, body.zw);
                        float halfLength = shape.x * 0.5;
                        float spine = clamp((halfLength - along) / shape.x, 0.0, 1.0);
                        float wave = shape.w * spine * spine * sin(spine * 5.6 - shape.z);
                        float across = dot(local, vec2(-body.w, body.z)) - wave;
                        float head = halfLength - shape.y;
                        float headOffset = along - head;

                        if (
                            headOffset * headOffset + across * across < shape.y * shape.y ||
                            along < head && along > -halfLength && abs(across) < shape.y * (along + halfLength) / (head + halfLength)
                        ) {
                            fishShaded = 1.0;
                            break;
                        }
                    }

                    if (fishShaded > 0.5) {
                        index = max(index - 2.0, 0.0);
                    } else if (shaded > 0.5) {
                        index = max(index - (edgeCode > 3.5 && edgeCode < 4.5 ? 0.0 : 1.0 + (edgeCode > 1.5 && edgeCode < 2.5 || edgeCode > 2.5 && edgeCode < 3.5 && checker > 0.0 ? 1.0 : 0.0)), 0.0);
                    }

                    if (edgeCode > 250.0) {
                        float frame = floor(t * 12.0);
                        float edge = noise(vec2(p.x - frame, p.y + frame * 0.25) / 24.0 + vec2(41.0, 17.0));

                        if (edge >= 0.58 || edge >= 0.39 && edge < 0.42) {
                            index = 8.0;
                        } else if (edge >= 0.46) {
                            index = 7.0;
                        }
                    }

                    gl_FragColor = vec4(tone(index), 1.0);
                }
            `
        });
    }
}
