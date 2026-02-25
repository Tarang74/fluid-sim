export default function turboRGB(x: number) {
  const t = Math.min(1, Math.max(0, x));
  const t2 = t * t;
  const t3 = t2 * t;
  const t4 = t3 * t;
  const t5 = t4 * t;

  const r =
    0.13572138 +
    4.6153926 * t +
    -42.66032258 * t2 +
    132.13108234 * t3 +
    -152.94239396 * t4 +
    59.28637943 * t5;
  const g =
    0.09140261 +
    2.19418839 * t +
    4.84296658 * t2 +
    -14.18503333 * t3 +
    4.27729857 * t4 +
    2.82956604 * t5;
  const b =
    0.1066733 +
    12.64194608 * t +
    -60.58204836 * t2 +
    110.36276771 * t3 +
    -89.90310912 * t4 +
    27.34824973 * t5;

  return {
    r: Math.min(1, Math.max(0, r)),
    g: Math.min(1, Math.max(0, g)),
    b: Math.min(1, Math.max(0, b)),
  };
}
