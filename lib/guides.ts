// Short buying / care guides. They help customers choose, and help Google
// send people looking for these answers to the shop.

export type Guide = {
  slug: string;
  title: string;
  description: string;
  minutes: number;
  sections: { heading: string; body: string[]; list?: string[] }[];
};

export const guides: Guide[] = [
  {
    slug: "pla-vs-petg",
    title: "PLA vs PETG vs Silk PLA: which should you pick?",
    description: "The three plastics we print with most, and which one suits your piece.",
    minutes: 3,
    sections: [
      {
        heading: "PLA: the everyday choice",
        body: [
          "PLA is made from plant starch, prints with crisp detail and comes in the widest range of colours. It's ideal for decor, figurines, desk items and gifts that live indoors.",
          "Its weak spot is heat: PLA starts to soften at around 55–60 °C, so don't leave it on a dashboard in summer or next to a hot stove.",
        ],
      },
      {
        heading: "Silk PLA: the shiny one",
        body: [
          "Silk PLA is PLA with a glossy, metallic-looking sheen. Gold, copper and rainbow silks make vases, trophies and statues look premium without any painting. It behaves like regular PLA, so the same heat advice applies.",
        ],
      },
      {
        heading: "PETG: tougher and more heat-resistant",
        body: [
          "PETG is the same family of plastic as water bottles. It's tougher, a little flexible rather than brittle, and handles heat up to about 70–80 °C. Pick it for planters, outdoor pieces, phone stands, clips and anything that gets handled a lot.",
        ],
      },
      {
        heading: "Quick guide",
        body: [],
        list: [
          "Decor, figures, gifts → PLA",
          "Metallic look without painting → Silk PLA",
          "Outdoors, planters, functional parts → PETG",
          "Not sure? Tell us what it's for and we'll recommend one.",
        ],
      },
    ],
  },
  {
    slug: "caring-for-3d-prints",
    title: "How to care for your 3D prints",
    description: "Simple ways to keep your prints looking new for years.",
    minutes: 2,
    sections: [
      {
        heading: "Keep it cool",
        body: [
          "Most prints are PLA, which softens in high heat. Keep them out of hot cars, away from stoves and out of hours of direct afternoon sun.",
        ],
      },
      {
        heading: "Cleaning",
        body: [
          "Dust with a soft, dry brush (a makeup brush works well). For marks, wipe with a cloth dampened with mild soapy water, then dry. Don't use the dishwasher, hot water or strong solvents like acetone.",
        ],
      },
      {
        heading: "Vases and planters",
        body: [
          "Our vases are great with dried or artificial flowers. For fresh flowers or soil, ask us for a PETG print with a sealed finish, or use a small glass or plastic insert.",
        ],
      },
      {
        heading: "If something breaks",
        body: [
          "Small breaks can usually be fixed with a drop of super glue (cyanoacrylate). Hold the pieces together for 30 seconds. For anything bigger, message us. We can often reprint just the broken part.",
        ],
      },
    ],
  },
];

export const getGuide = (slug: string) => guides.find((g) => g.slug === slug);
