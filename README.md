# RK Creative Builds: online shop

This is the 3D-animated storefront for RK Creative Builds ("Bring Ideas to Life"). Customers browse, personalise and add products to a cart, then send the order to you on WhatsApp or by email. After that, they can pay right away with a UPI QR code, or wait until you confirm.

Built with Next.js 16, React Three Fiber, drei, Tailwind 4, Motion and zustand.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static site → ./out (also prints what's left before launch)
npm start          # preview the built site at http://localhost:3000
npm test           # browser tests against the build (run `npx playwright install chromium` once)
npm run check      # typecheck + build + tests, the same as GitHub runs
```

## Before you launch

1. **`lib/site.ts`:** set your real domain (`url`), city, the **PIN code you ship from** (`originPin`), WhatsApp number, email, Instagram and **UPI ID**. Until the WhatsApp number, email and UPI ID are real, every build prints a reminder and the site tells search engines not to index it, so sample details never reach Google. In the same file:
   - `payments.cardPayUrl`: a Razorpay Payment Page link to also take cards, netbanking and wallets. Leave it empty to offer UPI only.
   - `payments.cod`: switch cash on delivery on, with its fee and order limit. It's never offered for personalised items, which can't be resold if refused.
   - `business`: legal name, GSTIN, address and hours. Empty fields stay hidden.
   - `tracking`: your courier's tracking link, for the Track page.
   - `reviewUrl`: where customers leave a review (e.g. your Google Business review link).
2. **`lib/delivery.ts`:** check the courier days per zone (same city, same state, nearby states, rest of India, remote areas) and the remote-area surcharge.
3. **`lib/products.ts`:** set your real products and prices, and add photos and 3D files (see below). Edit `finishes` to list only the filaments you actually stock, with `color` matched to the real spool.
4. **`lib/content.ts`:** write your story, and fill the trust slots: a 15-second printer video, real reviews, workshop, packing and customer photos, your latest Instagram posts, and before/after pairs of custom jobs. Every empty slot keeps its section hidden.
5. **`lib/policies.ts`:** read through the shipping, returns, privacy and terms policies and adjust them to how you actually work. They're a sensible starting point, not legal advice.
6. **Optional:** add your analytics ID in `site.analytics` (Plausible domain or GA4 ID).

## Owner page: manage products without code

Tap the **logo on the home page 5 times** within 5 seconds (the small one in the top bar, or the big one in the "Bring ideas to life" section near the bottom) to open the shop manager (`/owner/`). It isn't linked anywhere and search engines are told to skip it.

**Signing in.** The secret tap only finds the page; the **password** is what protects it. The website runs in the visitor's browser and its code is public, so it can't check a password or keep a GitHub key itself. A tiny **owner sign-in server** (`scripts/owner-api.mjs`, no dependencies) does both: it checks the password, holds the GitHub key in secret, and passes on only the few GitHub calls the owner page needs. Wrong passwords are limited: 5 per device every 15 minutes (and each try is slowed down), 30 per hour in total. Sign-ins last 12 hours, or 30 days with "Keep me signed in".

The password is built in (stored as a hash), so signing in needs no setup; to use a different one, set `OWNER_PASSWORD` on the host. Signing in lets you edit; **publishing also needs `GITHUB_TOKEN`** on the host (the page says so until it's there).

Set it up once:

1. **Make the GitHub key** the server uses: signed in to GitHub as `rkcreatives3d`, create a **fine-grained personal access token** with repository access to `rkcreativesweb` only and **Contents → Read and write**. (The owner page's sign-in has a link under "Sign in with a GitHub key instead".)
2. **Give the server its two secrets**, on the host:
   - **Vercel** (where this site runs): Project → **Settings → Environment Variables**, add `OWNER_PASSWORD` (the password) and `GITHUB_TOKEN` (the key), for Production. Then **Deployments → ⋯ → Redeploy**. On Vercel the server runs inside the site itself as a function at `/api/owner` (`scripts/setup-host.mjs` adds it on Vercel builds; every page stays static).
   - *Render Web Service* (start command `npm start`): **Environment** → the same two variables.
   - *A static-only host* (Render Static Site, Netlify, Pages): run `node scripts/owner-api.mjs` as a separate small Node service with the two variables, and set `NEXT_PUBLIC_OWNER_API` on the site to its address + `/api/owner`.
3. **Pick a strong password.** Anyone can try passwords, and the limit only slows guessing down. Don't use anything shown publicly, like your GitHub or Instagram name: whoever gets in can change the UPI ID and WhatsApp number your customers pay and order on.

To change the password, change `OWNER_PASSWORD` and redeploy: that also signs out every device. If the server isn't set up, the sign-in page says so and offers signing in with a GitHub key directly (on your own devices only: anyone with the key can change the shop). Big 3D files are sent in pieces of up to 3 MB (Vercel functions take at most 4.5 MB per request) and joined back together by the build. On Vercel the wrong-password count lives in the running function, so it resets when Vercel starts a fresh one; the slowdown on every wrong try still applies.

**What you can do:**
- **Products:** add, edit, duplicate, hide/show, delete, reorder (the shop shows them in this order), and change prices straight from the list.
- **Each product:** name, short line, description, category (or a new one), badge, starting price, sizes with their own measurement and extra price, colours and the main colour, material, print time, personalisation, the occasions it shows under, and its own customer questions.
- **3D model:** upload the STL, 3MF (Bambu Studio, Orca, PrusaSlicer), OBJ or GLB you print from and see it in 3D straight away, in every colour. Customers get it in 3D, 360° and AR.
- **Photos:** upload, reorder (the first is the cover), remove. Big phone photos are resized automatically. **Clean up the background** (on by default) cuts the product out of the photo and puts it on the shop's soft grey studio stage with a soft shadow, sized and placed like every other product, so a photo taken on a table at home looks like the studio pictures. Bits of wall seen through gaps (between arms, under handles) are removed and the old background's colour is taken out of the edges, so no light fringe shows. ✨ on a photo does the same for one that's already there. It runs in your browser (a small AI model, `public/vendor/u2netp.onnx`, about 4.5 MB, downloaded the first time); if it can't find the product clearly, the photo is kept as taken. Best results: the product near the middle, on a plain surface, with nothing else touching it.
- **Colours:** add a filament colour (name, colour, matte / silk / glossy), edit or remove one.
- **Shop settings:** WhatsApp number, order email, Instagram, city and PIN code, website address, UPI ID and name, card payment link, cash on delivery (fee, order limit), shipping fee and free-shipping amount, days to print and pack, name/message price, courier and tracking page, business details, review link, categories.

**Domains (collections).** Every product sits in one domain: Decor, Giftables, Aesthetic, Devotion, Keychains, Desk & office (add, rename or remove them under Shop settings → Domains; empty ones are hidden from customers). The shop manager lists products by domain, and ↑/↓ moves a product within its domain. Customers see the same groups: as Collections on the home page, as headings and filter buttons in the shop, and in each product's breadcrumb. A domain can be linked directly: `/shop/?c=Decor`.

**Reviews.** Customers write reviews, with a photo of what they bought, on `/reviews/` (linked from the menu, the footer and every product page). Nothing appears until you approve it: new reviews wait under **Reviews** in the shop manager, with their photo; **Approve** or **Reject**, then Publish. Approved reviews show on the Reviews page, on the product's page and on the home page, and give the product its star rating in Google. You can take any review down again. Behind the scenes, waiting reviews are kept on a separate branch (`reviews-inbox`), so the live site isn't rebuilt for each one; sending is limited to 3 reviews an hour per person, photos are checked and shrunk to under 1.6 MB, and a hidden field catches simple bots. Receiving reviews needs `GITHUB_TOKEN` on the host; until then the form offers WhatsApp instead. Waiting reviews sit in the repository, so if you'd rather nobody could read them before you approve them, make the GitHub repository private (Vercel keeps working).

**Publishing.** Nothing changes on the website until you press **Publish changes**. You see a list of what changed first. The page then makes the studio pictures for any new or changed product on your device (keep it open), and saves everything as one commit to GitHub. The host (Vercel) rebuilds the site from it automatically, and the page tells you when it's live, usually 3–5 minutes later. New products start **hidden**: switch "Visible to customers" on when they're ready.

Under the hood, products, colours and settings live in `content/products.json`, `content/finishes.json` and `content/shop.json` (you can still edit them by hand), 3D files go to `models/`, photos to `public/products/<product>/`, studio pictures to `public/renders/<product>/`. If two people publish at once, the second is warned before anything is overwritten. GitHub's automatic code tests skip these "Owner:" commits.

**The host needs:** to rebuild on every push to `main` (Vercel's and Render's default).

## Where things live

| What | Where |
| --- | --- |
| Shop details, contact, UPI, shipping rules, engraving price, analytics | `lib/site.ts` |
| Delivery dates and surcharges by PIN code | `lib/delivery.ts` |
| Products: name, price, sizes, finishes, tags, photos, size photo, FAQ, personalisation | `lib/products.ts` |
| Occasions in the shop filter (Birthday gifts, Under ₹499 …) | `lib/occasions.ts` |
| Home page: featured products and their words | `app/page.tsx` |
| Design tokens: colours, type scale, buttons, product stage | `app/globals.css` |
| Personalise lettering styles and icons | `lib/personalise.ts` (3D shapes in `components/three/nameplate.ts`) |
| About story, video, reviews, photo galleries, Instagram posts, before/after jobs, custom-price estimator rates | `lib/content.ts` |
| Policies (shipping, returns, privacy, terms) | `lib/policies.ts` |
| Guides | `lib/guides.ts` |
| 3D lighting and colours | `lib/theme.ts` |
| Filament colours customers can pick | `finishes` in `lib/products.ts` |
| Logo files | `public/brand/`, `app/icon.png`, `app/apple-icon.png`, `app/opengraph-image.jpg` (original in `assets/`) |

The WhatsApp number must be in international format with digits only. For example, `919876543210` is 91 followed by a 10-digit Indian number.

### Showing your products in real 3D

Every product can be shown as its real 3D model, which customers can rotate and drag, and see in every colour, on its product page. The shop cards and the home page show its studio pictures (below), made from the same model, so the shop stays fast and calm. Products with a model also get a **"View in your room"** button: on a phone it places the model, at its real size and in the chosen colour, on the customer's table or floor using AR (an iPhone, or an Android phone with Google Play Services for AR). On a computer it shows a QR code that opens the same view on a phone. Use the files you print from:

1. Put the file in the `models/` folder, named after the product's slug: `models/vortex-vase.stl`, `models/name-keychain.3mf`. You can use `.stl`, `.3mf` (Bambu Studio, Orca and PrusaSlicer projects work), `.obj`, `.glb` or `.gltf`.
2. Run `npm run models`. This also happens automatically on `npm run build`.

The converter turns the print-bed orientation upright, keeps sharp edges crisp, and shrinks the file for the web. For example, a 7.6 MB 3MF becomes about 800 KB. The original files in `models/` are never published. For AR, the model is scaled so its longest side matches the size the customer picked (the cm figure in each size's `dims`).

**No file for a product?** A single photo can't become a full 360° model on its own. Instead, use an image-to-3D tool, such as MakerWorld's **"Image to 3D"** in MakerLab (the same tool that made your Hanuman file), then drop the resulting `.3mf` into `models/`.

What each product shows:
- **Real model file:** live 3D on its page, with colours switching live; studio pictures everywhere else.
- **Photos only:** the photos (tap for full screen), with colour previews.
- **Neither:** the placeholder 3D shape.

On the product page, items that have both a model and photos get a "3D view / Photos" switch.

### Product pictures (renders)

Every product also has a studio picture of its 3D model in each of its colours, in `public/renders/`: the shop cards, the home page, Collections, search results, the cart and checkout, the About page, Lite-mode product pages, share images and Google results all show them. They're transparent (the product and its soft floor shadow), so the page decides what's behind them: the grey studio stage on cards, white or black on the home page. The main colour also gets a 1200 px version (`-xl`) for the big home-page pictures. Real photos always take their place once a product has them.

The owner page makes them automatically when you publish. To remake all of them yourself (after changing the lighting, say), run this with the site running:

```bash
npm run dev          # in one terminal
npm run renders      # in another; takes about 2 minutes
```

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

- **Home page** (`app/page.tsx`): one headline ("Small objects. Extraordinary ideas."), one sentence, one button and a quiet link, over a big picture of the Vortex Vase; then a few products told like small campaigns (the Infinity Knot on black, the Geodesic Orb Lamp, Lord Vishnu and the Gear Spinner), four collections, a name preview, custom prints, and the brand story with your logo. Reviews, customer photos and Instagram posts appear below once there are real ones. Which products are featured, and their words, are set in `app/page.tsx` (a featured product that's deleted simply drops out). The headline fades in with plain CSS, so it never waits for JavaScript on a slow phone.
- **Opening animation** (`components/intro/Intro.tsx`, styles under "opening animation" in `app/globals.css`): a print bed draws in, your logo prints itself on it layer by layer while a glowing nozzle sweeps each layer, the layer lines fuse, a sheen passes over it, and the page lifts away like a curtain onto the home page. About 3 seconds, on the home page only, once per visit; tap, Esc or "Skip" to skip it. It's plain CSS in the page's HTML (no 3D, no waiting for JavaScript), so it plays smoothly on budget phones too. Not shown to people who prefer reduced motion. Timings are the `--print-at`, `--print` and delay values there; the printed picture is the cut-out logo, `public/brand/logo-cut-*.webp`.
- **Personalise** (`/personalise/`; the home page has a quick version with a flat preview that hands the name and keychain/nameplate choice over): type a name and see it as a live 3D keychain or desk nameplate. Pick a lettering style (Bold, Script, Bubbly), an icon (heart, star, crown, paw, bolt) and a colour, and switch the preview to "On keys" or "On a desk" to judge the size. The choices go into the cart and the order message.
- **Shop** (`/shop/`): collections as tabs, search, an occasion filter and sorting, all linkable: `/shop/?c=Decor`, `/shop/?for=birthday`, `/shop/?q=lamp`. Cards are quiet: picture, name, price and colours (hover or tap a colour to see the piece in it), and the whole card opens the product. Two per row on phones.
- **Search:** the magnifier in the top bar searches the whole catalogue as you type (name, collection, material, tags) and lists matching products with pictures and prices. ↓/↑ move through them, Enter opens the first, Esc closes; with nothing typed it offers quick links.
- **Collections** (`/collections/`): every collection that has products, each with a picture and a count.
- **Saved and recently viewed:** the heart keeps products in a "Saved" list (`/saved/`, in the phone menu and the footer), and the last 8 products someone looked at show as "Recently viewed" on the shop, product and Saved pages. Both live in the visitor's browser only, no account needed.
- **Navigation:** a slim bar with Shop, Collections, Personalised, Custom Prints and About, search, and the bag (with the number of items in it). On phones and tablets the five links, plus Saved, Track an order, Reviews, Guides, Contact and WhatsApp, open in a full-screen menu.
- **Product page:** on phones, a bar fixed at the bottom shows the price, a WhatsApp button and "Add to cart" while the main button is off screen; a "Share" button opens the phone's share sheet (or WhatsApp on a computer); one main "Add to cart" button, with "buy now" and "Ask on WhatsApp" as quieter options; a PIN-code check that shows the delivery dates and shipping for the customer's area; a "How big is it?" size guide compared with everyday objects; and a short FAQ.
- **Checkout and order page:** on phones, a tap-to-open order summary with the total sits above the form; the PIN code shows delivery dates as the customer types (and is pre-filled if they checked it on a product page). After sending the order, customers land on `/order/`: next steps, a button to reopen WhatsApp, the UPI QR code, and a summary they can print or save as PDF.
- **Payment:** UPI is always offered, with a QR code and a "pay in UPI app" button after ordering. Cards via Razorpay and cash on delivery appear at checkout as soon as you switch them on in `lib/site.ts`, and the chosen method goes into the order message.
- **Help pages:** `/contact/` (WhatsApp, email, hours, reply time, business details) and `/track/` (courier tracking, or ask about an order that hasn't shipped yet).
- **Trust badges** next to the buy buttons and at checkout: safe payment, free reprint if damaged, dispatch time, a real person on WhatsApp. Each one matches a promise in the policies.
- **Selling tools:**
  - an "Ask on WhatsApp" link on every product (there's no floating button: WhatsApp is in the menu, the footer, product pages and Contact)
  - search in the top bar, plus shop search, sorting and occasion filters
- **Custom orders** (`/custom/`):
  - a "you send a photo → we model it → you approve → we print" timeline
  - drag-to-compare before/after examples (from `beforeAfter` in `lib/content.ts`)
  - an instant price estimate based on size, material, detail and quantity (rates in `lib/content.ts`)
  - file attachments: on phones, photos go straight into the WhatsApp share sheet
- **Trust:** an About page, policy pages, and slots for a printer video ("Meet the maker"), reviews, packing photos, customer photos and an Instagram grid. Each appears as soon as you add content.
- **Analytics events** (`lib/track.ts`): `add_to_cart`, `buy_now`, `begin_checkout`, `order_sent`, `whatsapp_click`, `custom_request`, `ar_view` and `pin_check`, sent to Plausible or GA4 when they're set up. No names, phone numbers or addresses are ever sent. In Plausible, add the event names under Site settings → Goals to see them.
- **Accessibility:** a "Skip to content" link, visible keyboard focus, a focus-trapped cart drawer, readable text behind every animated heading, and reduced motion respected throughout (no intro).
- **Search and sharing:**
  - every page except checkout can be linked and shared, and has its own canonical URL
  - each product gets its own share image (`/og/<slug>.png`, built at export)
  - Google gets product, price, breadcrumb, FAQ and shop details (structured data)
  - `sitemap.xml` and `robots.txt` are generated automatically
- **Speed:** the 3D engine (about 400 KB) only downloads on pages that show live 3D (product pages, Personalise), after the page is on screen; the home page, shop, collections and the rest never load it. Pictures are sized for the screen and below-the-fold ones load lazily.
- **Works everywhere:** tested from 320 px phones to wide desktops. Nothing scrolls sideways, every button is at least 24 × 24 px, and the layout respects notches and home bars. If a 3D file fails to download, that spot simply stays flat, and the opening animation always ends within 7 seconds.
- **3D on phones:** any phone with more than 2 GB of memory (a typical 4 GB Android phone included) gets the full 3D site: products print in and turn a full 360° on their page (swipe sideways to spin, swipe up or down to scroll). Phones draw at a slightly lower resolution than computers to stay smooth. While the 3D engine downloads, every product shows its studio picture in the same pose, so nothing sits empty, and the live model takes over in place.
- **Lite mode (budget phones):** phones with 2 GB of memory or less, data saver or 2G connections, and devices without a usable graphics chip see the studio picture on product pages instead of the live model, and the 3D engine is never downloaded. Each product page still has a **"View in 3D · 360°"** button that loads the 360° view for that product. Lite mode also drops the effects that cost most on a weak phone (background blur, endlessly repainting animations). On a simulated 1 GB phone with a 6× slower processor on slow 4G, pages show their content in under a second and use about 10 MB of memory. If 3D runs below about 24 frames a second on a phone that got it, the site first lowers the resolution, then switches to Lite mode for the rest of that visit and says so (with a "Use 3D" button); the next visit tries 3D again. Visitors can switch Lite mode on or off in the footer, and their choice is remembered. On phones, content never waits for JavaScript to fade in, and scrolling is always the phone's own.
- **Browsers:** Chrome, Edge and Firefox 111+ and Safari 16.4+, which covers any Android 7 or newer phone with an up-to-date Chrome, Android Go phones included.

## Link rules

Every page can be opened directly from a link except **checkout**, which needs a cart. Landing on `/checkout/` from outside the site sends visitors to the home page. This is handled in `lib/routeGuard.ts`.

## Tests

`tests/` holds browser tests (Playwright) that run against the built site, on a desktop and a phone screen:

- the full order flow, from Personalise and a product page to checkout and the order page, checking the WhatsApp message line by line
- the intro, the checkout link guard, the Track page
- 3D: the home page, shop and collections never download the 3D engine; a product page draws its model and then stops drawing; Lite mode loads no 3D at all
- shopping: two products per row on phones (a card opens its product), the product buy bar, the checkout summary; the heart and Saved, the menu, search in the top bar, shop search from the address, sharing, and recently viewed
- a budget phone (1 GB, slow processor): Lite mode switches on by itself, the opening animation plays and ends by itself, the 3D engine is never downloaded, products show as studio pictures in the chosen colour, and "View in 3D" loads the 360° view
- a 4 GB phone: gets the 3D site, with the studio picture standing in until the live 360° model takes over
- no page logs an error
- layout at 320, 360, 390, 640, 768 and 1440 px: no sideways scrolling, the nav fits, tap targets are big enough
- an automated accessibility audit (axe, WCAG 2.2 AA) and search basics (one h1, title, description, canonical) on every page

GitHub runs the typecheck, the build and all tests on every push (`.github/workflows/ci.yml`).

## Deploy (free)

The site is fully static, so you don't need a server. Push the repo to GitHub and import it on Vercel, Netlify or Cloudflare Pages. Use `npm run build` as the build command and `out` as the output folder (Vercel detects both automatically). Point your domain at it, set `site.url` to match, then add the site in Google Search Console and submit `https://your-domain/sitemap.xml`.

Security headers and long caching for static files come with the repo: `vercel.json` for Vercel and `public/_headers` for Netlify and Cloudflare Pages.

## Design

Quiet and precise, so the products carry the page: white and soft grey surfaces, near-black text, one family of type, one restrained accent, and generous space. Everything is set up in `app/globals.css`:

- **Colours:** white page (`page`) and a soft grey (`page-2`, #f5f5f7) for secondary sections, product stages and panels; near-black text (`fg`, #1d1d1f) and a neutral grey (`muted`) for secondary text; hairline borders (`line`). The brand's amber is the one accent and is used sparingly: text links, small labels such as "New", keyboard focus (`accent`, a deep amber that's readable on white). The logo's own molten amber (`accent-fill`) is kept for small marks. **Red** (`danger`) for errors, **green** (`ok`) for confirmations.
- **Dark sections:** `.theme-dark` switches a section to a black "spotlight" palette (light text, lighter amber links, light buttons). It's used deliberately: one product story on the home page, the brand story with the logo, and the opening animation.
- **Type:** Inter (one variable file), with the system font as the fallback. Headlines are semibold and tight (`headline-xl`, `headline-lg`, `headline-md`, fluid sizes), body text is 17 px, small labels are sentence case (`eyebrow`), and secondary lines use `lead`.
- **Buttons and links:** one solid near-black button per screen (`btn-primary`, light in dark sections), quiet outline buttons (`btn`), and text links with a chevron (`link-more`) for the second action. Corners are softly rounded (12 px buttons, 22 px picture tiles), not pills; shadows only where something floats (the cart drawer, the toast).
- **Product pictures:** every product sits on the same soft grey studio sweep (`.stage`), with a soft floor shadow. Studio pictures are transparent and cleaned-up photos have the same sweep baked in (`lib/owner/stage.ts` draws it), so everything matches. The 3D adds soft rim lights from behind (warm amber on one side, white on the other).
- **The logo:** the emblem (printer, RK and spool) sits in the top bar; the full logo, cut out of its black square (`public/brand/logo-cut-*.webp`, made by `python3 scripts/cutout-logo.py`, keeping its own colours), stars in the black brand-story section and the opening animation, where it looks as it was designed. The nav icon, browser-tab icon and home-screen icon come from `python3 scripts/make-icons.py`.

Every text colour passes WCAG AA contrast on the page, the grey sections and the panels, in light and dark sections (the accessibility tests check every page).

## Product animations

- **Print-in:** on its product page, the model prints itself in, layer by layer from the bed up, with a hot amber line where the nozzle would be, while the turntable swings round to its resting angle.
- **Filament swap:** picking another colour runs the new colour up the model from the bottom, as if the filament had been changed mid-print.
- **Lite mode:** the flat stand-in art prints in with CSS.
- **Reduced motion:** visitors who ask for less motion see every model already printed, and colour changes simply fade.
- **Kept quiet on purpose:** sections fade up once as they come into view; product pictures ease up a touch on hover; nothing follows the cursor; the model on a product page rests until you turn it ("Turn slowly" switches on a slow spin); adding to the cart opens the cart; no floating buttons; scrolling is the browser's own.

All of this is two shader hooks on the product material (`components/three/Studio.tsx`). The canvas only draws while something is moving.

## How the 3D works

The page has one transparent WebGL canvas fixed over it (`components/three/CanvasRoot.tsx`). Each 3D spot on the page is a drei `<View>` that draws into that canvas, positioned over its own `<div>`. This lets every 3D scene share a single GPU context. It's only created on pages that have a 3D spot (product pages, Personalise), and never in Lite mode.

Page code never imports three.js directly: everything 3D goes through `components/three/lazy.tsx`, so it downloads after the page is on screen and the browser is idle. Whether a device gets 3D at all (memory, cores, data saver, a real graphics chip) is decided by a tiny script before the first paint (`lib/lite.ts`).

The canvas only draws while something moves (`components/three/live.ts`): a model printing in, a drag, a colour change while it eases in, and the page while it scrolls. Every product comes to rest at the same turntable angle. When nothing moves, the GPU idles.

Gold and metal finishes reflect a small light-box environment baked in memory (`components/three/Studio.tsx`). The Bold lettering uses the Saira font, converted to `lib/fonts/saira-extrabold.typeface.json`. The Script and Bubbly lettering use Pacifico and Titan One, which only download when someone picks them.

## Third-party files

- `public/vendor/model-viewer-4.3.1.min.js`: Google's [model-viewer](https://modelviewer.dev) for "View in your room" (Apache-2.0, see `model-viewer-LICENSE.txt`). It only loads when someone opens the AR view.
- `lib/fonts/pacifico.typeface.json` and `titan-one.typeface.json`: converted from the Pacifico and Titan One fonts (SIL Open Font License, see `lib/fonts/OFL-*.txt`).
- `lib/fonts/Inter-SemiBold.ttf`: the Inter font (SIL Open Font License, see `lib/fonts/OFL-Inter.txt`), for the product share cards. The site itself loads Inter through `next/font`.
- `public/vendor/u2netp.onnx`: the small [U²-Net](https://github.com/xuebinqin/U-2-Net) model that finds the product in a photo for "Clean up the background" (Apache-2.0, see `u2netp-LICENSE.txt`). Only the shop manager loads it.
- [ONNX Runtime Web](https://github.com/microsoft/onnxruntime) (`onnxruntime-web`, MIT) runs that model in the browser; its WebAssembly file is fetched from the jsDelivr CDN when the clean-up first runs.
