"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { track } from "@/lib/track";

// "View in your room": the product's real 3D model placed at true size on the
// customer's floor or table, using their phone's AR (ARCore on Android, Quick
// Look on iPhone). Powered by Google's <model-viewer>, self-hosted in
// public/vendor and only downloaded when someone opens this.

const MV_SRC = "/vendor/model-viewer-4.3.1.min.js";

type ModelViewer = HTMLElement & {
  canActivateAR: boolean;
  model?: {
    materials: {
      pbrMetallicRoughness: {
        setBaseColorFactor(c: string): void;
        setMetallicFactor(n: number): void;
        setRoughnessFactor(n: number): void;
      };
    }[];
  };
};
type Tint = { color: string; metalness: number; roughness: number };

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        alt?: string;
        ar?: boolean;
        "ar-modes"?: string;
        "ar-scale"?: string;
        "ar-placement"?: string;
        scale?: string;
        "camera-controls"?: boolean;
        "auto-rotate"?: boolean;
        "shadow-intensity"?: string;
        exposure?: string;
      };
    }
  }
}

let loading: Promise<void> | null = null;
function loadModelViewer() {
  loading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.type = "module";
    s.src = MV_SRC;
    s.onload = () => resolve();
    s.onerror = () => {
      loading = null;
      reject(new Error("model-viewer failed to load"));
    };
    document.head.appendChild(s);
  }).then(async () => {
    await customElements.whenDefined("model-viewer");
    const MV = customElements.get("model-viewer") as unknown as { meshoptDecoderLocation: string };
    MV.meshoptDecoderLocation = "/vendor/meshopt-ready.js";
  });
  return loading;
}

/** Longest side of the model in its own units. Measured up front so model-viewer gets its scale before it loads. */
async function measure(url: string) {
  const [{ GLTFLoader }, { MeshoptDecoder }, THREE] = await Promise.all([
    import("three/examples/jsm/loaders/GLTFLoader.js"),
    import("three/examples/jsm/libs/meshopt_decoder.module.js"),
    import("three"),
  ]);
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(url);
  const size = new THREE.Box3().setFromObject(gltf.scene).getSize(new THREE.Vector3());
  return Math.max(size.x, size.y, size.z) || 1;
}

/** Button + dialog. `sizeCm` is the longest side of the selected size; the model is scaled to it. */
export function ArView({ model, name, slug, sizeCm, tint }: { model: string; name: string; slug: string; sizeCm: number | null; tint: Tint }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [base, setBase] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  // arriving from the desktop QR code (?ar=1): open straight away
  useEffect(() => {
    if (new URLSearchParams(location.search).get("ar") === "1") show();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function show() {
    setOpen(true);
    dialog.current?.showModal();
    track("ar_view", { product: slug, step: "open" });
    Promise.all([measure(model), loadModelViewer()]).then(
      ([longest]) => setBase(longest),
      () => setFailed(true),
    );
  }

  return (
    <>
      <button
        onClick={show}
        className="inline-flex items-center gap-2 rounded-full border border-fg/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-fg transition-colors hover:border-fg/40"
      >
        <ArIcon /> View in your room
      </button>
      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
        aria-labelledby="ar-title"
        className="m-auto w-[min(920px,calc(100vw-2rem))] rounded-3xl border border-fg/10 bg-page p-0 text-fg backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      >
        {open && (
          <div className="grid md:grid-cols-[1.3fr_1fr]">
            <div className="relative aspect-square stage md:aspect-auto md:min-h-[480px]">
              {base !== null ? (
                <Viewer model={model} name={name} slug={slug} tint={tint} scale={sizeCm ? sizeCm / 100 / base : 1} />
              ) : (
                <p className="absolute inset-0 grid place-items-center text-sm text-muted">
                  {failed ? "Couldn't load the 3D viewer. Check your connection and try again." : "Loading 3D model…"}
                </p>
              )}
            </div>
            <div className="p-6 sm:p-8">
              <h2 id="ar-title" className="section-title text-3xl">
                See it in your room
              </h2>
              <p className="mt-3 text-sm text-muted">
                {sizeCm ? `Shown at its real size, ${sizeCm} cm. ` : ""}Point your phone at a floor or table and the {name.toLowerCase()} appears
                right there.
              </p>
              <PhoneHint slug={slug} />
              <form method="dialog" className="mt-6">
                <button className="btn w-full">Close</button>
              </form>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}

function Viewer({ model, name, slug, scale, tint }: { model: string; name: string; slug: string; scale: number; tint: Tint }) {
  const ref = useRef<ModelViewer>(null);
  const [canAR, setCanAR] = useState<boolean | null>(null);

  useEffect(() => {
    const mv = ref.current;
    if (!mv) return;
    const loaded = () => {
      setCanAR(mv.canActivateAR);
      // in the colour the customer picked
      for (const m of mv.model?.materials ?? []) {
        m.pbrMetallicRoughness.setBaseColorFactor(tint.color);
        m.pbrMetallicRoughness.setMetallicFactor(tint.metalness);
        m.pbrMetallicRoughness.setRoughnessFactor(tint.roughness);
      }
    };
    const status = (e: Event) => {
      const s = (e as CustomEvent<{ status: string }>).detail.status;
      if (s === "session-started" || s === "object-placed") track("ar_view", { product: slug, step: s });
    };
    if ((mv as unknown as { loaded: boolean }).loaded) loaded();
    mv.addEventListener("load", loaded);
    mv.addEventListener("ar-status", status);
    return () => {
      mv.removeEventListener("load", loaded);
      mv.removeEventListener("ar-status", status);
    };
  }, [slug, tint]);

  return (
    <model-viewer
      ref={ref}
      src={model}
      // true size: set before the model loads (changing it later trips a model-viewer bug)
      scale={`${scale} ${scale} ${scale}`}
      alt={`3D model of the ${name}`}
      ar
      ar-modes="webxr quick-look scene-viewer"
      ar-scale="fixed"
      ar-placement="floor"
      camera-controls
      auto-rotate
      shadow-intensity="1"
      exposure="1.1"
      style={{ width: "100%", height: "100%", position: "absolute", inset: 0, ["--poster-color" as string]: "transparent" }}
    >
      <button
        slot="ar-button"
        className="btn btn-primary absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap"
        style={{ display: canAR ? undefined : "none" }}
      >
        <ArIcon /> Place it in your room
      </button>
    </model-viewer>
  );
}

/** On a desktop: a QR code that opens this product on a phone, straight into AR. */
function PhoneHint({ slug }: { slug: string }) {
  const [qr, setQr] = useState<string | null>(null);
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    setDesktop(!coarse);
    if (coarse) return;
    const url = `${location.origin}/shop/${slug}/?ar=1`;
    QRCode.toDataURL(url, { margin: 1, width: 360, color: { dark: "#000000", light: "#ffffff" } }).then(setQr, () => setQr(null));
  }, [slug]);

  if (!desktop)
    return <p className="mt-4 text-sm text-muted">Needs an iPhone, or an Android phone with Google Play Services for AR.</p>;
  return (
    <div className="mt-6 flex items-center gap-4 rounded-xl border border-fg/10 p-4">
      <div className="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {qr ? <img src={qr} alt="QR code to open this product on your phone" className="h-full w-full" /> : null}
      </div>
      <p className="text-sm text-muted">
        <span className="font-semibold text-fg">On a computer?</span> Scan this with your phone&apos;s camera to place it in your room.
        Drag the model here to look around it.
      </p>
    </div>
  );
}

function ArIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
      <path d="M12 2.8 20 7.4v9.2L12 21.2l-8-4.6V7.4L12 2.8Z" />
      <path d="M4 7.4 12 12l8-4.6M12 12v9.2" />
    </svg>
  );
}
