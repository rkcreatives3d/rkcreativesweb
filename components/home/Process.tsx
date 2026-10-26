import { MoreLink, Reveal } from "../ui";

// line drawings for each step: a model, its layers, the nozzle, the finished piece
const icons = {
  model: (
    <>
      <path d="M12 3 3.5 7.5v9L12 21l8.5-4.5v-9L12 3Z" />
      <path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" />
    </>
  ),
  layers: (
    <>
      <path d="m3 8 9-4 9 4-9 4-9-4Z" />
      <path d="m3 12 9 4 9-4M3 16l9 4 9-4" />
    </>
  ),
  nozzle: (
    <>
      <path d="M8 3h8v5H8z" />
      <path d="M10 8h4l-1.2 3.5h-1.6L10 8Z" />
      <path d="M12 11.5V14M4 17h16M6.5 20.5h11" />
    </>
  ),
  finish: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.2 12.3 2.6 2.6 5-5.6" />
    </>
  ),
};

const steps: { icon: keyof typeof icons; title: string; body: string }[] = [
  { icon: "model", title: "Designed", body: "Every piece starts as a 3D model, sculpted or chosen with you, and checked for strength." },
  { icon: "layers", title: "Sliced", body: "Software cuts it into hundreds of thin layers and plans every move of the nozzle." },
  { icon: "nozzle", title: "Printed", body: "Built up layer by layer. Some pieces take a few hours, some a whole day." },
  { icon: "finish", title: "Finished by hand", body: "Supports removed, edges cleaned up, then checked, packed with care and sent to you." },
];

/** How a piece is made, in four steps: what's behind every product in the shop. */
export function Process() {
  return (
    <section className="mx-auto max-w-6xl border-t border-line px-5 py-14 sm:px-6 sm:py-28" aria-labelledby="process-title">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <p className="eyebrow">How it&apos;s made</p>
          <h2 id="process-title" className="headline-md mt-2">
            Made layer by layer.
          </h2>
        </div>
        <MoreLink href="/about/">Our story</MoreLink>
      </div>
      <ol className="mt-8 grid grid-cols-2 gap-x-5 gap-y-8 sm:mt-12 sm:gap-x-8 sm:gap-y-10 lg:grid-cols-4">
        {steps.map((s, i) => (
          <Reveal as="li" key={s.title} delay={i * 0.06}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-fg">
              {icons[s.icon]}
            </svg>
            <p className="mt-4 text-sm tabular-nums text-muted">0{i + 1}</p>
            <h3 className="mt-0.5 text-lg font-semibold tracking-tight">{s.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted sm:text-[1.0625rem]">{s.body}</p>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
