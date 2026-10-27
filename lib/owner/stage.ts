// Drawing helpers for the owner page's pictures. Studio pictures and cleaned-up
// photos are see-through, with the soft floor shadow of the product cards
// (globals.css .stage-shadow) drawn in; the site puts them on its studio
// backdrop in CSS (.stage, or .stage-dark for pale colours).

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
