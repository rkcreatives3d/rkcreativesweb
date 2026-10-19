import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="grid min-h-[100svh] place-items-center px-5 text-center">
      <div>
        <p className="tabular-nums text-xs uppercase tracking-[0.12em] text-pop">Error 404 · print failed</p>
        <h1 className="holo-text mt-4 font-display text-[28vw] font-extrabold leading-none sm:text-[16rem]">404</h1>
        <p className="mt-2 text-muted">This page came out as spaghetti. Let&apos;s get you back on the bed.</p>
        <div className="mt-8">
          <ButtonLink href="/" primary>
            Back home →
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
