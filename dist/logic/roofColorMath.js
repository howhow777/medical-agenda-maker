export const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const smooth = (v) => { const t = clamp(v); return t * t * (3 - 2 * t); };
export const linear = (v) => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
const srgb = (v) => v <= .0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - .055;
/** Retains the approved study's OKLab transfer, including its warm-light guard. */
export function rgbToLab(rgb) {
    const [r, g, b] = rgb.map(linear);
    const l = Math.cbrt(.4122214708 * r + .5363325363 * g + .0514459929 * b);
    const m = Math.cbrt(.2119034982 * r + .6806995451 * g + .1073969566 * b);
    const s = Math.cbrt(.0883024619 * r + .2817188376 * g + .6299787005 * b);
    return [.2104542553 * l + .793617785 * m - .0040720468 * s,
        1.9779984951 * l - 2.428592205 * m + .4505937099 * s,
        .0259040371 * l + .7827717662 * m - .808675766 * s];
}
export function labToRGB([L, a, b]) {
    const l = (L + .3963377774 * a + .2158037573 * b) ** 3;
    const m = (L - .1055613458 * a - .0638541728 * b) ** 3;
    const s = (L - .0894841775 * a - 1.291485548 * b) ** 3;
    return [srgb(4.0767416621 * l - 3.3077115913 * m + .2309699292 * s),
        srgb(-1.2684380046 * l + 2.6097574011 * m - .3413193965 * s),
        srgb(-.0041960863 * l - .7034186147 * m + 1.707614701 * s)];
}
export const hexLab = (hex) => rgbToLab([1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255));
export function tonalWeights(L, anchors) {
    if (L < anchors[1][0]) {
        const t = smooth((L - anchors[0][0]) / (anchors[1][0] - anchors[0][0]));
        return [1 - t, t, 0];
    }
    const t = smooth((L - anchors[1][0]) / (anchors[2][0] - anchors[1][0]));
    return [0, 1 - t, t];
}
export function transferRoofChroma(a, b, baseA, baseB, targetA, targetB) {
    const denominator = baseA * baseA + baseB * baseB;
    const targetC = Math.hypot(targetA, targetB);
    if ((a === 0 && b === 0) || denominator < 1e-12 || targetC < 1e-6)
        return [0, 0];
    const scale = Math.min(2, targetC / Math.sqrt(denominator));
    const cos = (baseA * targetA + baseB * targetB) / (Math.sqrt(denominator) * targetC);
    const sin = (baseA * targetB - baseB * targetA) / (Math.sqrt(denominator) * targetC);
    let outA = scale * (a * cos - b * sin), outB = scale * (a * sin + b * cos);
    const targetHue = Math.atan2(targetB, targetA);
    if (targetHue > Math.PI / 3 && targetHue < Math.PI * 2 / 3) {
        if (baseA === targetA && baseB === targetB)
            return [a, b];
        const offset = Math.atan2(baseA * b - baseB * a, baseA * a + baseB * b);
        const hue = targetHue + clamp(offset, -Math.PI / 45, Math.PI / 45);
        const chroma = Math.hypot(outA, outB);
        outA = chroma * Math.cos(hue);
        outB = chroma * Math.sin(hue);
    }
    return [outA, outB];
}
/** Inferred white-matte coverage, not physical extraction of painted layers. */
export function buildRoofMaps(pixels, width, height, sourceColors) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0 || pixels.length !== width * height * 4) {
        throw new Error('主視覺像素尺寸不完整');
    }
    const anchors = sourceColors.map(hexLab);
    const values = new Float32Array(width * height * 7);
    for (let p = 0; p < pixels.length / 4; p++) {
        const rgb = [pixels[p * 4] / 255, pixels[p * 4 + 1] / 255, pixels[p * 4 + 2] / 255];
        const lab = rgbToLab(rgb);
        const weights = tonalWeights(lab[0], anchors);
        const y = Math.floor(p / width) / height;
        const alpha = 1 - smooth((y - .35) / .3) * (1 - clamp((1 - Math.min(...rgb)) * 5));
        values.set([...lab, ...weights, alpha], p * 7);
    }
    return { width, height, values };
}
export function recolorRoofPixels(maps, sourceColors, colors) {
    const anchors = sourceColors.map(hexLab);
    const target = colors.map(hexLab);
    const delta = target.map((t, i) => t.map((v, j) => v - anchors[i][j]));
    const pixels = new Uint8ClampedArray(maps.width * maps.height * 4);
    const values = maps.values;
    for (let p = 0; p < pixels.length / 4; p++) {
        const k = p * 7, L = values[k];
        const pigment = clamp((1 - L) / .28);
        const lab = [values[k], values[k + 1], values[k + 2]];
        lab[0] += pigment * (values[k + 3] * delta[0][0] + values[k + 4] * delta[1][0] + values[k + 5] * delta[2][0]);
        const baseA = values[k + 3] * anchors[0][1] + values[k + 4] * anchors[1][1] + values[k + 5] * anchors[2][1];
        const baseB = values[k + 3] * anchors[0][2] + values[k + 4] * anchors[1][2] + values[k + 5] * anchors[2][2];
        const targetA = values[k + 3] * target[0][1] + values[k + 4] * target[1][1] + values[k + 5] * target[2][1];
        const targetB = values[k + 3] * target[0][2] + values[k + 4] * target[1][2] + values[k + 5] * target[2][2];
        [lab[1], lab[2]] = transferRoofChroma(lab[1], lab[2], baseA, baseB, targetA, targetB);
        const rgb = labToRGB(lab).map(v => clamp(v));
        const alpha = Math.max(values[k + 6], 1 - Math.min(...rgb));
        for (let j = 0; j < 3; j++)
            pixels[p * 4 + j] = alpha > 0 ? clamp((rgb[j] - 1 + alpha) / alpha) * 255 : 0;
        pixels[p * 4 + 3] = alpha * 255;
    }
    return pixels;
}
//# sourceMappingURL=roofColorMath.js.map