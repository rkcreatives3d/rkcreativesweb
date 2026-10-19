# RK Creative Builds 3D: online shop

This is the 3D-animated storefront for RK Creative Builds 3D ("Bring Ideas to Life"). Customers browse, personalise and add products to a cart, then send the order to you on WhatsApp or by email. After that, they can pay right away with a UPI QR code, or wait until you confirm.

Built with Next.js 16, React Three Fiber, drei, Tailwind 4, Motion, Lenis and zustand.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static site → ./out
npm start          # preview the built site
```

## Before you launch

1. **`lib/site.ts`:** set your real domain (`url`), city, WhatsApp number, email, Instagram and **UPI ID**. The UPI box stays hidden on the live site until the UPI ID is set.
2. **`lib/products.ts`:** set your real products and prices, and add photos (see below).
3. **`lib/content.ts`:** write your story, and add real reviews and photos (workshop, packing, customer photos, past custom jobs). Every empty list keeps its section hidden.
4. **`lib/policies.ts`:** read through the shipping, returns, privacy and terms policies and adjust them to how you actually work. They're a sensible starting point, not legal advice.
5. **Optional:** add your analytics ID in `site.analytics` (Plausible domain or GA4 ID).

## Where things live

| What | Where |
| --- | --- |
| Shop details, contact, UPI, shipping rules, engraving price, analytics | `lib/site.ts` |
| Products: name, price, sizes, finishes, tags, photos, personalisation | `lib/products.ts` |
| About story, reviews, photo galleries, custom-price estimator rates | `lib/content.ts` |
| Policies (shipping, returns, privacy, terms) | `lib/policies.ts` |
| Guides | `lib/guides.ts` |
| Brand colours: page / 3D | `app/globals.css` (`@theme`) / `lib/theme.ts` |
| Logo files | `public/brand/`, `app/icon.png`, `app/apple-icon.png`, `app/opengraph-image.jpg` (original in `assets/`) |

The WhatsApp number must be in international format with digits only. For example, `919876543210` is 91 followed by a 10-digit Indian number.

### Showing your products in real 3D

Every product can be shown as its real 3D model, which customers can rotate and drag, and see in every colour, on the shop cards, the product page and the home carousel. Use the files you print from:

1. Put the file in the `models/` folder, named after the product's slug: `models/vortex-vase.stl`, `models/name-keychain.3mf`. You can use `.stl`, `.3mf` (Bambu Studio, Orca and PrusaSlicer projects work), `.obj`, `.glb` or `.gltf`.
2. Run `npm run models`. This also happens automatically on `npm run build`.

The converter turns the print-bed orientation upright, keeps sharp edges crisp, and shrinks the file for the web. For example, a 7.6 MB 3MF becomes about 800 KB. The original files in `models/` are never published.

**No file for a product?** A single photo can't become a full 360° model on its own. Instead, use an image-to-3D tool, such as MakerWorld's **"Image to 3D"** in MakerLab (the same tool that made your Hanuman file), then drop the resulting `.3mf` into `models/`.

What each product shows:
- **Real model file:** 3D everywhere, with colours switching live.
- **Photos only:** the photos, with a 3D tilt-and-glare effect and colour previews.
- **Neither:** the placeholder 3D shape.

On the product page, items that have both a model and photos get a "3D view / Photos" switch.

### Adding product photos

Put photos in `public/products/` and list them on the product:

```ts
images: ["/products/vortex-vase-1.jpg", "/products/vortex-vase-2.jpg"],
```

The first photo becomes the cover, and the second one shows when someone hovers over the card. Once a product has photos, they replace its 3D placeholder everywhere: on the card, on the product page (as a gallery), in its share image, and in Google results. Square photos work best (at least 1200 × 1200).

### Showing every colour

Customers can tap or hover over the colour swatches on shop cards and product pages to see the item in each colour. There are two ways this works, and you can mix them:

1. **Real photos per colour (best).** If you've printed the item in several colours, add a photo of each:

   ```ts
   images: ["/products/vase-black.jpg"],
   photoFinish: "onyx", // the colour shown in `images`
   colorPhotos: {
     gold: ["/products/vase-gold.jpg"],
     amber: ["/products/vase-amber-1.jpg", "/products/vase-amber-2.jpg"],
   },
   ```

2. **Automatic colour preview.** For any colour without its own photo, the site recolours your `images` photo in the visitor's browser. It repaints only the print, keeping its shading and detail, and labels it "Colour preview" so customers know it's a simulation. Set `photoFinish` to the colour the photo actually shows; that colour always displays the untouched original.

   For the preview to work, the background needs to be easy to separate from the print. Either:
   - shoot on a **plain, even background** (a white or black sheet or card, with no props or patterns), or
   - use a **cut-out PNG** with a transparent background. The "lift subject" or "remove background" feature on most phones does this in one tap.

   If a photo's background is too busy to separate safely, the site just shows the original photo.

### Product options

- **`tags`:** `"bestseller"`, `"gift"` or `"festive"`. These power the quick filters on the Shop page.
- **`personalisation: "optional"`:** customers can add a name or message for `site.engravingPrice`.
- **`personalisation: "included"`:** the product *is* the name (keychain, nameplate), so the text is required.

## Features

- **Opening animation** (`components/intro/`): a 3D printer prints the logo. It only plays on the home page, once per visit, and takes about 3 seconds. It can be skipped and never plays in Lite mode. To change its length, edit `IN`, `PRINT` and `OUT` in `PrinterScene.tsx`.
- **Personalise** (`/personalise/`): type a name and see it as a live 3D keychain or desk nameplate in your font, then order it. The home page has a shortcut that goes to `/personalise/?name=…`.
- **Selling tools:**
  - an "Ask on WhatsApp" button on every product, plus a floating WhatsApp button
  - a UPI QR code and a "pay in UPI app" button after ordering
  - "delivered by …" estimates
  - shop search, sorting and quick filters
  - an add-to-cart animation
- **Custom orders** (`/custom/`):
  - an instant price estimate based on size, material, detail and quantity (rates in `lib/content.ts`)
  - file attachments: on phones, photos go straight into the WhatsApp share sheet
- **Trust:** an About page, policy pages, and review and photo sections that appear as soon as you add content.
- **Search and sharing:**
  - every page except checkout can be linked and shared
  - each product gets its own share image (`/og/<slug>.png`, built at export)
  - Google gets product and shop details
  - `sitemap.xml` and `robots.txt` are generated automatically
- **Lite mode:** on low-memory phones and data-saver connections, the site uses photos and flat artwork instead of live 3D. Visitors can switch it on or off in the footer.

## Link rules

Every page can be opened directly from a link except **checkout**, which needs a cart. Landing on `/checkout/` from outside the site sends visitors to the home page. This is handled in `lib/routeGuard.ts`.

## Deploy (free)

The site is fully static, so you don't need a server. Push the repo to GitHub and import it on Vercel, Netlify or Cloudflare Pages. Use `npm run build` as the build command and `out` as the output folder (Vercel detects both automatically). Point your domain at it, set `site.url` to match, then add the site in Google Search Console and submit `https://your-domain/sitemap.xml`.

## How the 3D works

The page has one transparent WebGL canvas fixed over it (`components/Providers.tsx`). Each 3D spot on the page is a drei `<View>` that draws into that canvas, positioned over its own `<div>`. This lets every 3D scene share a single GPU context. In Lite mode the canvas is never created.

The opening animation uses its own temporary canvas. Gold and metal finishes reflect a small light-box environment baked in memory (`components/three/Studio.tsx`). The logo is drawn by a small shader (`components/three/LogoPlaque.tsx`). The 3D name text uses the Saira font, converted to `lib/fonts/saira-extrabold.typeface.json`.
