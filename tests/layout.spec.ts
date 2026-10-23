import { expect, test } from "@playwright/test";
import { pages, prepare } from "./helpers";

// Every page, at phone to desktop widths: nothing pokes out sideways, the nav
// fits, and every tap target is at least 24 × 24 px (WCAG 2.2), apart from
// links inside sentences.
for (const width of [320, 360, 390, 640, 768, 1440]) {
  test(`layout holds at ${width}px`, async ({ browser }) => {
    const page = await browser.newPage({ viewport: { width, height: 800 }, isMobile: width < 768, hasTouch: width < 768 });
    await prepare(page, { lite: true });
    for (const p of pages) {
      await page.goto(p);
      await page.waitForTimeout(300);
      const r = await page.evaluate(() => {
        const W = document.documentElement.clientWidth;
        const nav = document.querySelector("header nav");
        const inline = (e: Element) =>
          e.tagName === "A" &&
          getComputedStyle(e).display === "inline" &&
          /[a-z]/i.test((e.parentElement?.textContent || "").replace(e.textContent || "", "").trim());
        const small = [...document.querySelectorAll("a,button,input,select,summary")]
          .filter((e) => {
            const b = e.getBoundingClientRect();
            return b.width > 0 && b.height > 0 && (b.width < 24 || b.height < 24) && !inline(e);
          })
          .map((e) => (e.getAttribute("aria-label") || e.textContent || e.tagName).trim().slice(0, 40));
        return { overflow: document.documentElement.scrollWidth - W, nav: nav ? nav.scrollWidth - nav.clientWidth : 0, small };
      });
      expect(r.overflow, `${p} scrolls sideways`).toBeLessThanOrEqual(0);
      expect(r.nav, `${p} nav overflows`).toBeLessThanOrEqual(0);
      if (width < 768) expect(r.small, `${p} small tap targets`).toEqual([]);
    }
    await page.close();
  });
}
