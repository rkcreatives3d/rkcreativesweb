"""Cut the black square out of the RK logo so it sits on the dark page and its glow.

- background = near-black pixels (and warm glows) connected to the edge, plus
  enclosed pure-black pockets (inside the filament arc, letter counters)
- warm glows are un-multiplied from black, so they stay as translucent amber
- near-black neutral edge pixels keep their dark colour with partial alpha
  (no white fringe)
- the spool is protected (its hub is black on purpose)
- the small tagline and the gold script keep their own colours: they're
  un-multiplied from black, so on a dark page they look exactly as in the logo

Writes public/brand/logo-cut-{480,720,1080}.webp. Needs numpy, scipy, Pillow:
  python3 scripts/cutout-logo.py
"""
import os
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

src = sys.argv[1] if len(sys.argv) > 1 else "public/brand/logo.jpg"
dst = sys.argv[2] if len(sys.argv) > 2 else "public/brand"
im = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
H, W = im.shape[:2]
# pixel values (for colour and opacity)...
mx = im.max(2)
# ...and a lightly blurred copy for every background/artwork decision, so JPEG
# noise can't flip single pixels and leave ragged, speckled edges
ims = ndimage.gaussian_filter(im, (1.3, 1.3, 0))
mxd = ims.max(2)
sat = (mxd - ims.min(2)) / np.maximum(mxd, 1)
yy, xx = np.mgrid[0:H, 0:W]

spool = ((xx - 1075) / 128.0) ** 2 + ((yy - 632) / 178.0) ** 2 < 1
glow = (sat > 0.45) & (mxd < 165) & (ims[..., 0] >= ims[..., 2])
# bright artwork in the sharp image (thin gold outlines) always stops the fill
barrier = mx >= 150
bgish = ((mxd < 28) | glow) & ~spool & ~barrier
lab, _ = ndimage.label(bgish)
border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
region = np.isin(lab, border[border > 0])

# enclosed pockets of the same pure black as the background
dl, dn = ndimage.label((mxd < 28) & ~spool)
ids = np.arange(1, dn + 1)
area = ndimage.sum(np.ones_like(mx), dl, ids)
mean = ndimage.mean(mxd, dl, ids)
cy = np.array([c[0] for c in ndimage.center_of_mass(np.ones_like(mx), dl, ids)])
# only in the emblem: the name banner below it is black on purpose
pockets = ids[(area > 300) & (mean < 2.5) & (cy < 800)]
pocket = np.isin(dl, pockets)
# let each pocket take its glowing rim too
pocket_lab, _ = ndimage.label(bgish)
pocket_ids = np.unique(pocket_lab[pocket])
region |= np.isin(pocket_lab, pocket_ids[pocket_ids > 0])

# dark shading inside the emblem's outline (the letters' 3D sides) stays solid:
# close small gaps in the object mask, but never re-fill pure black
yy_top = yy < 830
disk = (np.hypot(*np.mgrid[-12:13, -12:13]) <= 12)
solid = ndimage.binary_closing(~region, structure=disk, iterations=1)
solid = ndimage.binary_fill_holes(solid) & ~np.isin(dl, pockets)
region &= ~(solid & yy_top & (mxd > 5) & ~((sat > 0.6) & ~ndimage.binary_erosion(solid, structure=disk[6:19, 6:19])))

a = np.ones((H, W), np.float32)
rgb = im.copy()
warm = region & (sat > 0.55) & (ims[..., 0] - ims[..., 2] > 30)
neutral = region & ~warm
# glows: un-multiply from black
a[warm] = mx[warm] / 255.0
rgb[warm] = np.clip(im[warm] / np.maximum(a[warm][:, None], 1e-3), 0, 255)
# dark neutral edges: stay dark and fade out, but only right next to the
# artwork (further out it's just JPEG noise, which would show as dark dots)
near = np.clip(ndimage.gaussian_filter((~region).astype(np.float32), 1.2) * 2.5, 0, 1)
a[neutral] = (np.clip((ndimage.median_filter(mx, 3) - 6) / 26.0, 0, 1) * near)[neutral]
a[region & (mxd < 8)] = 0

# tagline, its dashes and dots, and the script "Bring Ideas to Life": light on
# black, so un-multiply them from black (colour / brightness, opacity = brightness)
lettering = (yy > 975) & (yy < 1250)
la = np.clip((mx - 8) / 247.0, 0, 1)
a[lettering] = la[lettering]
rgb[lettering] = np.clip(im[lettering] / np.maximum(la[lettering][:, None], 1e-3), 0, 255)

# clean dark edges: drop ragged specks of near-black noise along cut edges
# (anything dark that a 7 px disc can't fit inside), then soften by a pixel
darkpx = (mxd < 45) & (sat < 0.5)
body = ndimage.binary_opening(a > 0.5, structure=np.hypot(*np.mgrid[-3:4, -3:4]) <= 3)
a[darkpx & ~body & (yy < 975)] = 0
edge = darkpx & (ndimage.maximum_filter(a, 3) - ndimage.minimum_filter(a, 3) > 0.3)
a[edge] = ndimage.gaussian_filter(a, 0.7)[edge]
a[a < 6 / 255] = 0
# glows (partly transparent) are smooth light: denoise their colour with an
# alpha-weighted blur, so they compress well and don't sparkle with JPEG noise
soft = (a > 0) & (a < 0.98)
pa = rgb * a[..., None]
blurred = np.stack([ndimage.gaussian_filter(pa[..., c], 2.2) for c in range(3)], -1)
weight = ndimage.gaussian_filter(a, 2.2)[..., None]
rgb[soft] = np.clip(blurred / np.maximum(weight, 1e-3), 0, 255)[soft]
rgb[a == 0] = 0

img = Image.fromarray(np.dstack([rgb, a * 255]).astype(np.uint8))
for w in (480, 720, 1080):
    r = np.asarray(img.resize((w, w), Image.LANCZOS)).copy()
    r[r[..., 3] < 6] = 0
    # the small sizes are the phone cover image (the LCP): squeeze them a little harder
    q = 80 if w == 1080 else 74
    Image.fromarray(r).save(os.path.join(dst, f"logo-cut-{w}.webp"), "WEBP", quality=q, method=6, alpha_quality=75)
print("wrote", [f"logo-cut-{w}.webp" for w in (480, 720, 1080)])
