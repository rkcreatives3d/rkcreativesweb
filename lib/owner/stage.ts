// The shop's product "stage", drawn on a canvas: the soft grey studio sweep and
// soft floor shadow of the product cards (globals.css .stage + .stage-shadow).
// Studio pictures of 3D models and cleaned-up photos are both drawn on it, so
// every product sits on the same background.

export function drawStage(g: CanvasRenderingContext2D, size: number) {
  g.save();
  g.translate(size * 0.5, size * 0.42);
  g.scale(0.7, 0.6);
  const bg = g.createRadialGradient(0, 0, 0, 0, 0, size);
  bg.addColorStop(0, "#fcfcfd");
  bg.addColorStop(0.58, "#f5f5f7");
  bg.addColorStop(1, "#ececef");
  g.fillStyle = bg;
  g.fillRect(-size * 2, -size * 2, size * 4, size * 4);
  g.restore();
}

/** A soft elliptical shadow centred at (x, y). */
export function drawShadow(g: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, strength = 0.2) {
  g.save();
  g.translate(x, y);
  g.scale(rx, ry);
  const sh = g.createRadialGradient(0, 0, 0, 0, 0, 1);
  sh.addColorStop(0, `rgba(0,0,0,${strength})`);
  sh.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = sh;
  g.beginPath();
  g.arc(0, 0, 1, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

export const canvasBytes = (c: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Uint8Array<ArrayBuffer>>((res) => c.toBlob(async (b) => res(new Uint8Array(await b!.arrayBuffer())), type, quality));
