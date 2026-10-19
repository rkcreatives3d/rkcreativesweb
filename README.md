# RK Creative Builds: online shop

This is the 3D-animated storefront for RK Creative Builds ("Bring Ideas to Life"). Customers browse, personalise and add products to a cart, then send the order to you on WhatsApp or by email. After that, they can pay right away with a UPI QR code, or wait until you confirm.

Built with Next.js 16, React Three Fiber, drei, Tailwind 4, Motion, Lenis and zustand.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static site → ./out
npm start          # preview the built site
```

## Before you launch

1. **`lib/site.ts`:** set your real domain (`url`), city, the **PIN code you ship from** (`originPin`), WhatsApp number, email, Instagram and **UPI ID**. The UPI box stays hidden on the live site until the UPI ID is set.
2. **`lib/delivery.ts`:** check the courier days per zone (same city, same state, nearby states, rest of India, remote areas) and the remote-area surcharge.
3. **`lib/products.ts`:** set your real products and prices, and add photos and 3D files (see below). Edit `finishes` to list only the filaments you actually stock, with `color` matched to the real spool.
4. **`lib/content.ts`:** write your story, and fill the trust slots: a 15-second printer video, real reviews, workshop, packing and customer photos, your latest Instagram posts, and before/after pairs of custom jobs. Every empty slot keeps its section hidden.
5. **`lib/policies.ts`:** read through the shipping, returns, privacy and terms policies and adjust them to how you actually work. They're a sensible starting point, not legal advice.
6. **Optional:** add your analytics ID in `site.analytics` (Plausible domain or GA4 ID).

## Where things live

| What | Where |
| --- | --- |
| Shop details, contact, UPI, shipping rules, engraving price, analytics | `lib/site.ts` |
| Delivery dates and surcharges by PIN code | `lib/delivery.ts` |
| Products: name, price, sizes, finishes, tags, photos, size photo, FAQ, personalisation | `lib/products.ts` |
| "Shop by occasion" tiles on the home page | `lib/occasions.ts` |
| Personalise lettering styles and icons | `lib/personalise.ts` (3D shapes in `components/three/nameplate.ts`) |
| About story, video, reviews, photo galleries, Instagram posts, before/after jobs, custom-price estimator rates | `lib/content.ts` |
| Policies (shipping, returns, privacy, terms) | `lib/policies.ts` |
| Guides | `lib/guides.ts` |
| Brand colours: page / 3D | `app/globals.css` (`@theme`) / `lib/theme.ts` |
| Filament colours customers can pick | `finishes` in `lib/products.ts` |
| Logo files | `public/brand/`, `app/icon.png`, `app/apple-icon.png`, `app/opengraph-image.jpg` (original in `assets/`) |

The WhatsApp number must be in international format with digits only. For example, `919876543210` is 91 followed by a 10-digit Indian number.

### Showing your products in real 3D

Every product can be shown as its real 3D model, which customers can rotate and drag, and see in every colour, on the shop cards, the product page and the home page tiles. Products with a model also get a **"View in your room"** button: on a phone it places the model, at its real size and in the chosen colour, on the customer's table or floor using AR (an iPhone, or an Android phone with Google Play Services for AR). On a computer it shows a QR code that opens the same view on a phone. Use the files you print from:

1. Put the file in the `models/` folder, named after the product's slug: `models/vortex-vase.stl`, `models/name-keychain.3mf`. You can use `.stl`, `.3mf` (Bambu Studio, Orca and PrusaSlicer projects work), `.obj`, `.glb` or `.gltf`.
2. Run `npm run models`. This also happens automatically on `npm run build`.

The converter turns the print-bed orientation upright, keeps sharp edges crisp, and shrinks the file for the web. For example, a 7.6 MB 3MF becomes about 800 KB. The original files in `models/` are never published. For AR, the model is scaled so its longest side matches the size the customer picked (the cm figure in each size's `dims`).

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

- **`tags`:** `"bestseller"`, `"gift"`, `"festive"`, `"birthday"`, `"desk"` or `"car"`. These power the "Shop by occasion" tiles and the Shop page filters.
- **`personalisation: "optional"`:** customers can add a name or message for `site.engravingPrice`.
- **`personalisation: "included"`:** the product *is* the name (keychain, nameplate), so the text is required.
- **`scalePhoto`:** a photo of the item in someone's hand or on a desk, shown in the "How big is it?" size guide. The size guide itself is drawn automatically from the cm figure in each size's `dims`.
- **`faq`:** extra questions for this product, shown above the standard ones on the product page.

## Features

- **Cover page:** your logo as a floating 3D plaque, with printed objects orbiting it.
- **Opening animation** (`components/intro/`): a 3D printer prints your logo layer by layer, then lands exactly on the cover. It only plays on the home page, once per visit, and takes about 3 seconds. It can be skipped and never plays in Lite mode or for people who prefer reduced motion. To change its length, edit `IN`, `PRINT` and `OUT` in `PrinterScene.tsx`.
- **Personalise** (`/personalise/`, and the second section of the home page): type a name and see it as a live 3D keychain or desk nameplate. Pick a lettering style (Bold, Script, Bubbly), an icon (heart, star, crown, paw, bolt) and a colour, and switch the preview to "On keys" or "On a desk" to judge the size. The choices go into the cart and the order message.
- **Product page:** one main "Add to cart" button, with "buy now" and "Ask on WhatsApp" as quieter options; a PIN-code check that shows the delivery dates and shipping for the customer's area; a "How big is it?" size guide compared with everyday objects; and a short FAQ.
- **Checkout and order page:** the PIN code shows delivery dates as the customer types (and is pre-filled if they checked it on a product page). After sending the order, customers land on `/order/`: next steps, a button to reopen WhatsApp, the UPI QR code, and a summary they can print or save as PDF.
- **Selling tools:**
  - an "Ask on WhatsApp" link on every product, plus a floating WhatsApp button
  - a UPI QR code and a "pay in UPI app" button after ordering
  - shop search, sorting and occasion filters
  - an add-to-cart animation
- **Custom orders** (`/custom/`):
  - a "you send a photo → we model it → you approve → we print" timeline
  - drag-to-compare before/after examples (from `beforeAfter` in `lib/content.ts`)
  - an instant price estimate based on size, material, detail and quantity (rates in `lib/content.ts`)
  - file attachments: on phones, photos go straight into the WhatsApp share sheet
- **Trust:** an About page, policy pages, and slots for a printer video ("Meet the maker"), reviews, packing photos, customer photos and an Instagram grid. Each appears as soon as you add content.
- **Analytics events** (`lib/track.ts`): `add_to_cart`, `buy_now`, `begin_checkout`, `order_sent`, `whatsapp_click`, `custom_request`, `ar_view` and `pin_check`, sent to Plausible or GA4 when they're set up. No names, phone numbers or addresses are ever sent. In Plausible, add the event names under Site settings → Goals to see them.
- **Accessibility:** a "Skip to content" link, visible keyboard focus, a focus-trapped cart drawer, readable text behind every animated heading, and reduced motion respected throughout (no intro, no smooth-scroll easing).
- **Search and sharing:**
  - every page except checkout can be linked and shared
  - each product gets its own share image (`/og/<slug>.png`, built at export)
  - Google gets product and shop details
  - `sitemap.xml` and `robots.txt` are generated automatically
- **Lite mode:** the site uses photos and flat artwork instead of live 3D on phones with 2 GB of memory or less (or 4 GB with 4 cores or fewer), on data saver or 2G connections, and on devices without a usable GPU. If 3D still runs below about 24 frames a second, the site first lowers the resolution, then switches to Lite mode itself and says so, with a "Use 3D" button. Visitors can switch it on or off in the footer, and their choice is remembered.

## Link rules

Every page can be opened directly from a link except **checkout**, which needs a cart. Landing on `/checkout/` from outside the site sends visitors to the home page. This is handled in `lib/routeGuard.ts`.

## Deploy (free)

The site is fully static, so you don't need a server. Push the repo to GitHub and import it on Vercel, Netlify or Cloudflare Pages. Use `npm run build` as the build command and `out` as the output folder (Vercel detects both automatically). Point your domain at it, set `site.url` to match, then add the site in Google Search Console and submit `https://your-domain/sitemap.xml`.

## Colours

Each colour has one job, so the page stays easy to read (see the top of `app/globals.css`):

- **Amber** (`accent`): things you can click: buttons, links, the cart count.
- **Gold** (`pop`): brand decoration: badges, labels, highlighted words. The brushed-gold gradient is kept for a few big moments only.
- **Cream and greys:** text. **Red** (`danger`) for errors, **green** (`ok`) for confirmations. **Light gold** shows keyboard focus.
- **Surfaces:** a warm near-black page with slightly lighter cards (`surface`, `raised`, `line`). The cover and the intro stay on pure black, like the logo.

Products are shown on a neutral grey stage with white studio light, so a white print looks white and a black print reads as black. The warm amber light is used only for the cover and the intro.

## How the 3D works

The page has one transparent WebGL canvas fixed over it (`components/Providers.tsx`). Each 3D spot on the page is a drei `<View>` that draws into that canvas, positioned over its own `<div>`. This lets every 3D scene share a single GPU context. In Lite mode the canvas is never created.

The canvas only draws while something moves (`components/three/live.ts`): the cover while it's on screen, a shop card while it's hovered (or for one demo turn as it scrolls into view on touch screens), a colour change while it eases in, and the page while it scrolls. Every product comes to rest at the same turntable angle. When nothing moves, the GPU idles.

The opening animation uses its own temporary canvas. Gold and metal finishes reflect a small light-box environment baked in memory (`components/three/Studio.tsx`). The logo is drawn by a small shader (`components/three/LogoPlaque.tsx`). The Bold lettering uses the Saira font, converted to `lib/fonts/saira-extrabold.typeface.json`. The Script and Bubbly lettering use Pacifico and Titan One, which only download when someone picks them.

## Third-party files

- `public/vendor/model-viewer-4.3.1.min.js`: Google's [model-viewer](https://modelviewer.dev) for "View in your room" (Apache-2.0, see `model-viewer-LICENSE.txt`). It only loads when someone opens the AR view.
- `lib/fonts/pacifico.typeface.json` and `titan-one.typeface.json`: converted from the Pacifico and Titan One fonts (SIL Open Font License, see `lib/fonts/OFL-*.txt`).
