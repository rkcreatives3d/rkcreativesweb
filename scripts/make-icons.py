"""Small logo marks, cut from the cut-out logo (run scripts/cutout-logo.py first).

- public/brand/mark-80.webp, mark-160.webp: the emblem (printer, RK, spool) on
  a black disc, for the nav; mark-128.png for share cards
- app/icon.png: just the RK letters on a black disc, so it reads at favicon size
- app/apple-icon.png: the emblem on a black square (iOS rounds the corners)
- public/brand/emblem-{360,480,720}.webp: the emblem, transparent, for
  the opening animation

  python3 scripts/make-icons.py
"""
from PIL import Image, ImageDraw

SRC = "public/brand/logo-cut-1080.webp"
k = 1080 / 1254  # crop boxes below are in the original 1254 px logo
EMBLEM = tuple(round(v * k) for v in (250, 40, 1180, 830))
LETTERS = tuple(round(v * k) for v in (440, 150, 1100, 810))
BG = (14, 12, 10, 255)

cut = Image.open(SRC).convert("RGBA")


def mark(box, size, fill, circle=True):
    big = 640
    canvas = Image.new("RGBA", (big, big), BG)
    art = cut.crop(box)
    w = int(big * fill)
    art = art.resize((w, round(w * art.height / art.width)), Image.LANCZOS)
    canvas.alpha_composite(art, ((big - art.width) // 2, (big - art.height) // 2))
    if circle:
        m = Image.new("L", (big, big), 0)
        ImageDraw.Draw(m).ellipse((0, 0, big - 1, big - 1), fill=255)
        out = Image.new("RGBA", (big, big), (0, 0, 0, 0))
        out.paste(canvas, (0, 0), m)
        canvas = out
    return canvas.resize((size, size), Image.LANCZOS)


for s in (80, 160):
    mark(EMBLEM, s, 0.95).save(f"public/brand/mark-{s}.webp", "WEBP", quality=86, method=6)
mark(EMBLEM, 128, 0.95).save("public/brand/mark-128.png", optimize=True)  # share cards (PNG for the image renderer)
mark(LETTERS, 64, 0.92).save("app/icon.png", optimize=True)
# the emblem on its own, transparent: what the opening animation prints
emblem = cut.crop(EMBLEM)
for w in (360, 480, 720):
    emblem.resize((w, round(w * emblem.height / emblem.width)), Image.LANCZOS).save(
        f"public/brand/emblem-{w}.webp", "WEBP", quality=68, method=6, alpha_quality=70
    )
mark(EMBLEM, 180, 0.9, circle=False).convert("RGB").save("app/apple-icon.png", optimize=True)
print("wrote nav marks, app/icon.png, app/apple-icon.png")
