import Link from "next/link";
import { site, whatsappUrl } from "@/lib/site";
import { Reveal } from "../ui";

/** For anything that isn't in the shop: one line of how it works and one way to start. */
export function CustomCta() {
  return (
    <section className="px-3 pb-3 sm:px-4 sm:pb-4" aria-labelledby="custom-title">
      <Reveal className="mx-auto max-w-[90rem] rounded-[var(--radius-tile)] bg-page-2 px-6 py-20 text-center sm:py-28">
        <p className="eyebrow">Custom 3D printing</p>
        <h2 id="custom-title" className="headline-lg mx-auto mt-2 max-w-2xl">
          Have something else in mind?
        </h2>
        <p className="lead mx-auto mt-4 max-w-xl">
          Send a sketch, a photo or a 3D file. We reply with a price and a timeline, and nothing is printed until you say yes.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
          <Link href="/custom/" className="btn btn-primary">
            Start a custom request
          </Link>
          <a href={whatsappUrl(`Hi ${site.name}! I'd like a custom print.`)} target="_blank" rel="noreferrer" className="link-more">
            Chat on WhatsApp
          </a>
        </div>
      </Reveal>
    </section>
  );
}
