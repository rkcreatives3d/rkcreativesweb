// Page-wide pointer position in normalised device coords (-1..1), read by 3D
// scenes every frame. Tracked on window so it works no matter which DOM
// element sits over a view.
export const pointer = { x: 0, y: 0 };

if (typeof window !== "undefined") {
  window.addEventListener(
    "pointermove",
    (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    },
    { passive: true },
  );
}
