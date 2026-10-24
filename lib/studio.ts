import { useEffect, useState } from "react";

/**
 * True only while scripts/render-products.mjs photographs the products: the
 * shop cards then show the live 3D model (on a transparent stage) instead of
 * the studio pictures it is making. Visitors never see this mode.
 */
export function useStudioRender() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    try {
      setOn(localStorage.getItem("rk-studio") === "1");
    } catch {}
  }, []);
  return on;
}
