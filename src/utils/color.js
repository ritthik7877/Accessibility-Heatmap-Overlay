export function parseColor(color) {
  if (!color) return null;
  const match = color.match(/rgba?\(([^)]+)\)/i);
  if (!match) return null;

  const values = match[1].replace(/\//g, ' ').split(/[\s,]+/).filter(Boolean);
  if (values.length < 3) return null;

  const channel = (value) => {
    const parsed = Number.parseFloat(value);
    return value.endsWith('%') ? (parsed / 100) * 255 : parsed;
  };
  const alphaValue = values[3] ?? '1';
  const alpha = alphaValue.endsWith('%')
    ? Number.parseFloat(alphaValue) / 100
    : Number.parseFloat(alphaValue);
  const parsedColor = {
    r: channel(values[0]),
    g: channel(values[1]),
    b: channel(values[2]),
    a: Number.isFinite(alpha) ? alpha : 1,
  };

  if (![parsedColor.r, parsedColor.g, parsedColor.b, parsedColor.a].every(Number.isFinite)) {
    return null;
  }

  return parsedColor;
}

function composite(foreground, background) {
  const alpha = foreground.a + background.a * (1 - foreground.a);
  if (alpha === 0) return { r: 0, g: 0, b: 0, a: 0 };

  return {
    r: (foreground.r * foreground.a + background.r * background.a * (1 - foreground.a)) / alpha,
    g: (foreground.g * foreground.a + background.g * background.a * (1 - foreground.a)) / alpha,
    b: (foreground.b * foreground.a + background.b * background.a * (1 - foreground.a)) / alpha,
    a: alpha,
  };
}

export function getEffectiveBackground(element) {
  const layers = [];
  let current = element;

  while (current && current instanceof Element) {
    const color = parseColor(getComputedStyle(current).backgroundColor);
    if (color && color.a > 0) layers.push(color);
    current = current.parentElement;
  }

  let background = { r: 255, g: 255, b: 255, a: 1 };
  for (let index = layers.length - 1; index >= 0; index -= 1) {
    background = composite(layers[index], background);
  }
  return background;
}

function relativeLuminance(color) {
  const linearize = (value) => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * linearize(color.r)
    + 0.7152 * linearize(color.g)
    + 0.0722 * linearize(color.b);
}

export function contrastRatio(first, second) {
  const luminances = [relativeLuminance(first), relativeLuminance(second)].sort((a, b) => b - a);
  return (luminances[0] + 0.05) / (luminances[1] + 0.05);
}
