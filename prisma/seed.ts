import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

// Deterministic placeholder image via picsum.photos/seed/<seed> - stable per seed string, no API key needed.
function img(seed: string, w = 900, h = 1500) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

type SeedProduct = {
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  videoUrl?: string;
  posterUrl?: string;
  mediaType?: "image" | "video";
  mediaFit?: "cover" | "hybrid" | "contain" | "auto";
  shopName: string;
  tags: string[];
  viralScore: number;
};

// Free, publicly reusable sample videos (Blender Foundation films, hosted by Google).
const SAMPLE_VIDEOS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
];

const products: SeedProduct[] = [
  // --- Tech ---
  {
    name: "UltraSlim Wireless Earbuds Pro",
    description: "Aktive Geraeuschunterdrueckung, 36h Akkulaufzeit, satter Bass.",
    price: 59.99,
    category: "Tech",
    imageUrl: img("tech-earbuds"),
    shopName: "SoundHub",
    tags: ["audio", "wireless", "earbuds"],
    viralScore: 82,
  },
  {
    name: "Mini Drohne 4K FoldCam",
    description: "Faltbare Taschendrohne mit 4K-Kamera und Follow-Me-Modus.",
    price: 129.0,
    category: "Tech",
    imageUrl: img("tech-drone"),
    shopName: "SkyGearStore",
    tags: ["drohne", "kamera", "gadget"],
    viralScore: 91,
  },
  {
    name: "Magnetisches 3-in-1 Ladepad",
    description: "Laedt Handy, Uhr und Kopfhoerer gleichzeitig - ein Kabel reicht.",
    price: 34.5,
    category: "Tech",
    imageUrl: img("tech-charger"),
    shopName: "ChargeLab",
    tags: ["charging", "magsafe", "desk"],
    viralScore: 76,
  },
  {
    name: "Smartwatch FitX Pro 2",
    description: "Pulsmessung, GPS, 10 Tage Akku und 100+ Sportmodi.",
    price: 89.99,
    category: "Tech",
    imageUrl: img("tech-smartwatch"),
    shopName: "FitGear",
    tags: ["wearable", "fitness", "smartwatch"],
    viralScore: 88,
    mediaType: "video",
    videoUrl: SAMPLE_VIDEOS[0],
    posterUrl: img("tech-smartwatch-poster"),
    mediaFit: "cover",
  },
  // --- Fashion ---
  {
    name: "Oversized Hoodie 'Cloud'",
    description: "Butterweicher Fleece-Hoodie in entspannter Passform.",
    price: 44.0,
    category: "Fashion",
    imageUrl: img("fashion-hoodie"),
    shopName: "Urbnwear",
    tags: ["hoodie", "streetwear", "unisex"],
    viralScore: 73,
  },
  {
    name: "Retro Sonnenbrille 'Riviera'",
    description: "UV400-Schutz, polarisiert, im 70er-Style.",
    price: 24.9,
    category: "Fashion",
    imageUrl: img("fashion-sunglasses"),
    shopName: "ShadeCo",
    tags: ["accessoires", "sommer", "retro"],
    viralScore: 69,
  },
  {
    name: "Cargo Pants 'Trail'",
    description: "Wasserabweisende Cargo-Hose mit 8 Taschen.",
    price: 52.0,
    category: "Fashion",
    imageUrl: img("fashion-cargo"),
    shopName: "Urbnwear",
    tags: ["hose", "streetwear", "outdoor"],
    viralScore: 64,
  },
  {
    name: "Chunky Sneaker 'Pulse'",
    description: "Auffaelliger Plateau-Sneaker mit Memory-Foam-Sohle.",
    price: 79.0,
    category: "Fashion",
    imageUrl: img("fashion-sneaker"),
    shopName: "StepUp",
    tags: ["schuhe", "sneaker", "streetwear"],
    viralScore: 85,
  },
  // --- Beauty ---
  {
    name: "LED Gesichtsmaske Glow",
    description: "Rotlicht- und Infrarot-Therapie fuer reinere Haut in 10 Min/Tag.",
    price: 69.0,
    category: "Beauty",
    imageUrl: img("beauty-ledmask"),
    shopName: "GlowLab",
    tags: ["skincare", "beauty-tech", "selfcare"],
    viralScore: 90,
    mediaType: "video",
    videoUrl: SAMPLE_VIDEOS[1],
    posterUrl: img("beauty-ledmask-poster"),
    mediaFit: "cover",
  },
  {
    name: "Vitamin C Serum 20%",
    description: "Hochdosiertes Anti-Aging-Serum fuer ebenmaessigen Teint.",
    price: 19.99,
    category: "Beauty",
    imageUrl: img("beauty-serum"),
    shopName: "PureSkin",
    tags: ["serum", "skincare", "antiaging"],
    viralScore: 71,
  },
  {
    name: "Eisroller Gesicht & Augen",
    description: "Kuehlt sofort, reduziert Schwellungen, perfekt am Morgen.",
    price: 14.5,
    category: "Beauty",
    imageUrl: img("beauty-iceroller"),
    shopName: "ChillBeauty",
    tags: ["selfcare", "tool", "skincare"],
    viralScore: 66,
  },
  {
    name: "Mini Haarglaetter Travel",
    description: "Kompakter Glaetter fuer unterwegs, in 30 Sek. heiss.",
    price: 27.0,
    category: "Beauty",
    imageUrl: img("beauty-straightener"),
    shopName: "HairTech",
    tags: ["haare", "travel", "tool"],
    viralScore: 58,
  },
  // --- Gaming ---
  {
    name: "RGB Mechanical Keyboard 75%",
    description: "Hot-Swap-Switches, PBT-Keycaps, anpassbare RGB-Beleuchtung.",
    price: 74.99,
    category: "Gaming",
    imageUrl: img("gaming-keyboard"),
    shopName: "PixelGear",
    tags: ["keyboard", "rgb", "setup"],
    viralScore: 87,
  },
  {
    name: "Ergonomischer Gaming-Stuhl Flex",
    description: "Verstellbare Lordosenstuetze, 160 Grad Liegefunktion.",
    price: 219.0,
    category: "Gaming",
    imageUrl: img("gaming-chair"),
    shopName: "SeatLab",
    tags: ["stuhl", "setup", "ergonomie"],
    viralScore: 60,
  },
  {
    name: "Controller GripGrip Pro",
    description: "Universeller Wireless-Controller mit Turbo-Tasten.",
    price: 39.9,
    category: "Gaming",
    imageUrl: img("gaming-controller"),
    shopName: "PixelGear",
    tags: ["controller", "wireless", "gaming"],
    viralScore: 78,
  },
  {
    name: "Streaming Ringlicht Set",
    description: "10-Zoll-Ringlicht mit Handyhalterung fuer Streams & Clips.",
    price: 32.0,
    category: "Gaming",
    imageUrl: img("gaming-ringlight"),
    shopName: "StreamKit",
    tags: ["streaming", "licht", "content"],
    viralScore: 70,
  },
  // --- Home ---
  {
    name: "Aroma-Diffuser Sternenhimmel",
    description: "Projiziert Sternenmuster an die Decke und verteilt Aetherische Oele.",
    price: 36.0,
    category: "Home",
    imageUrl: img("home-diffuser"),
    shopName: "CozyNest",
    tags: ["wohnen", "ambiente", "deko"],
    viralScore: 84,
    mediaType: "video",
    videoUrl: SAMPLE_VIDEOS[2],
    posterUrl: img("home-diffuser-poster"),
    mediaFit: "hybrid",
  },
  {
    name: "LED Wolken-Lampe",
    description: "Sanft pulsierende Wolkenform mit Blitz-Effekt fuer das Schlafzimmer.",
    price: 28.5,
    category: "Home",
    imageUrl: img("home-cloudlamp"),
    shopName: "CozyNest",
    tags: ["licht", "deko", "schlafzimmer"],
    viralScore: 80,
  },
  {
    name: "Selbstreinigende Wasserflasche UV",
    description: "UV-C-Sterilisation in 3 Minuten, haelt 24h kalt.",
    price: 42.0,
    category: "Home",
    imageUrl: img("home-uvbottle"),
    shopName: "PureLiving",
    tags: ["bottle", "hygiene", "alltag"],
    viralScore: 67,
  },
  {
    name: "Mini Luftbefeuchter Pilzform",
    description: "Geraeuschlos, mit Nachtlicht-Funktion, USB-betrieben.",
    price: 21.0,
    category: "Home",
    imageUrl: img("home-humidifier"),
    shopName: "CozyNest",
    tags: ["humidifier", "deko", "schreibtisch"],
    viralScore: 62,
  },
  // --- Gadgets ---
  {
    name: "Taschenlampen-Feuerzeug Plasma",
    description: "Windfest, wiederaufladbar, mit integrierter LED-Taschenlampe.",
    price: 17.99,
    category: "Gadgets",
    imageUrl: img("gadget-plasma"),
    shopName: "EverydayEDC",
    tags: ["edc", "outdoor", "gadget"],
    viralScore: 75,
  },
  {
    name: "Kabelloser Mini-Projektor Pocket",
    description: "Projiziert bis 120 Zoll, integrierter Akku, Android-basiert.",
    price: 149.0,
    category: "Gadgets",
    imageUrl: img("gadget-projector"),
    shopName: "BeamItUp",
    tags: ["projektor", "entertainment", "tech"],
    viralScore: 93,
  },
  {
    name: "Smarter Gepaeck-Tracker",
    description: "Bluetooth-Tracker mit App-Anbindung, findet jeden Koffer.",
    price: 22.5,
    category: "Gadgets",
    imageUrl: img("gadget-tracker"),
    shopName: "TravelSmart",
    tags: ["travel", "tracking", "gadget"],
    viralScore: 59,
  },
  {
    name: "Magnet-Handyhalterung Auto 360",
    description: "Starker Magnetgriff, dreht sich frei in jede Richtung.",
    price: 16.0,
    category: "Gadgets",
    imageUrl: img("gadget-carmount"),
    shopName: "DriveEasy",
    tags: ["auto", "handy", "halterung"],
    viralScore: 55,
  },
  // --- Sport ---
  {
    name: "Faltbare Yogamatte TravelFit",
    description: "Rutschfest, 4mm dick, passt in jeden Rucksack.",
    price: 29.99,
    category: "Sport",
    imageUrl: img("sport-yogamat"),
    shopName: "MoveWell",
    tags: ["yoga", "fitness", "travel"],
    viralScore: 65,
  },
  {
    name: "Widerstandsbaender Set (5x)",
    description: "Komplettes Set fuer Kraft- und Mobility-Training zuhause.",
    price: 18.9,
    category: "Sport",
    imageUrl: img("sport-bands"),
    shopName: "MoveWell",
    tags: ["training", "homegym", "fitness"],
    viralScore: 61,
  },
  {
    name: "Massagepistole Mini",
    description: "4 Aufsaetze, 6 Geschwindigkeiten, fuer die Reisetasche.",
    price: 49.0,
    category: "Sport",
    imageUrl: img("sport-massagegun"),
    shopName: "RecoverPro",
    tags: ["recovery", "massage", "fitness"],
    viralScore: 79,
  },
  {
    name: "Sport-Armband Phone Holder",
    description: "Verstellbares Armband fuer Handys bis 6.9 Zoll, schweissfest.",
    price: 13.5,
    category: "Sport",
    imageUrl: img("sport-armband"),
    shopName: "RunGear",
    tags: ["running", "zubehoer", "outdoor"],
    viralScore: 52,
  },
  // --- Viral / Luxus ---
  {
    name: "Schwebende Bonsai-Pflanze Magnetic",
    description: "Schwebt magnetisch und rotiert lautlos - echter Hingucker.",
    price: 64.0,
    category: "Viral",
    imageUrl: img("viral-bonsai"),
    shopName: "FloatDeco",
    tags: ["deko", "viral", "geschenk"],
    viralScore: 97,
    mediaType: "video",
    videoUrl: SAMPLE_VIDEOS[3],
    posterUrl: img("viral-bonsai-poster"),
    mediaFit: "hybrid",
  },
  {
    name: "Galaxy-Projektor Deluxe",
    description: "Verwandelt jeden Raum in einen Sternenhimmel mit Nebel-Effekt.",
    price: 54.0,
    category: "Viral",
    imageUrl: img("viral-galaxy"),
    shopName: "FloatDeco",
    tags: ["licht", "ambiente", "viral"],
    viralScore: 95,
    mediaType: "video",
    videoUrl: SAMPLE_VIDEOS[4],
    posterUrl: img("viral-galaxy-poster"),
    mediaFit: "cover",
  },
  {
    name: "Mini Designer Crossbody Bag",
    description: "Veganes Leder, minimalistisches Design, Luxus-Anmutung.",
    price: 89.0,
    category: "Luxus",
    imageUrl: img("luxury-bag"),
    shopName: "MaisonLeger",
    tags: ["tasche", "luxus", "fashion"],
    viralScore: 86,
  },
  {
    name: "Edelstahl Whiskey-Steine Set",
    description: "Wiederverwendbare Kuehlsteine in edler Geschenkbox.",
    price: 31.0,
    category: "Luxus",
    imageUrl: img("luxury-whiskeystones"),
    shopName: "MaisonLeger",
    tags: ["geschenk", "bar", "luxus"],
    viralScore: 63,
  },
  {
    name: "Parfum Atomizer Travel Gold",
    description: "Nachfuellbarer Mini-Zerstaeuber im edlen Goldlook.",
    price: 15.9,
    category: "Luxus",
    imageUrl: img("luxury-perfume"),
    shopName: "ScentBoutique",
    tags: ["parfum", "travel", "luxus"],
    viralScore: 57,
  },
  {
    name: "Marble-Look Powerbank 20000mAh",
    description: "Schnellladend, edles Marmor-Finish, 2x USB-C.",
    price: 38.0,
    category: "Luxus",
    imageUrl: img("luxury-powerbank"),
    shopName: "ChargeLab",
    tags: ["powerbank", "design", "tech"],
    viralScore: 72,
  },
];

async function main() {
  console.log(`Seeding ${products.length} products...`);

  // Only seed products on first deployment - subsequent deploys keep existing
  // data (wishlists, events, user accounts) intact.
  const existingCount = await prisma.product.count();
  if (existingCount === 0) {
    await prisma.product.createMany({
      data: products.map((p) => ({
        name: p.name,
        description: p.description,
        price: p.price,
        category: p.category,
        imageUrl: p.imageUrl,
        videoUrl: p.videoUrl,
        posterUrl: p.posterUrl,
        mediaType: p.mediaType ?? "image",
        mediaFit: p.mediaFit ?? (Math.random() > 0.5 ? "hybrid" : "cover"),
        affiliateUrl: `https://example.com/product/${encodeURIComponent(p.name.toLowerCase().replace(/\s+/g, "-"))}`,
        shopName: p.shopName,
        tags: p.tags.join(","),
        viralScore: p.viralScore,
        isActive: true,
      })),
    });
  }

  const adminEmail = "admin@viralo.shop";
  const adminPassword = process.env.ADMIN_SEED_PASSWORD ?? "ChangeMe123!";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN", passwordHash, username: "admin" },
    create: {
      email: adminEmail,
      name: "Admin",
      username: "admin",
      role: "ADMIN",
      passwordHash,
    },
  });

  console.log(`Admin account ready: ${adminEmail} / (see ADMIN_SEED_PASSWORD)`);
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
