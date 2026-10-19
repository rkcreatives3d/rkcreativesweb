import { Marquee } from "../ui";

/** One calm ticker band between the cover and the shop: gold on dark, so it never outshouts the buttons. */
export function MarqueeStrip() {
  return (
    <div className="relative z-20 border-y border-line bg-surface py-3 text-pop">
      <Marquee
        className="font-display text-lg font-extrabold display-case tracking-wide sm:text-xl"
        items={["Custom prints", "Personalised gifts", "Printed to order", "Hand finished", "Delivered across India"]}
      />
    </div>
  );
}
