import { db } from "./db";
import { category } from "./schema";

const CATEGORIES = [
  { name: "Moda", slug: "moda" },
  { name: "Design", slug: "design" },
  { name: "Arte", slug: "arte" },
  { name: "Fotografia", slug: "fotografia" },
  { name: "Architettura", slug: "architettura" },
  { name: "Letteratura", slug: "letteratura" },
  { name: "Altro", slug: "altro" },
];

async function seed() {
  await db
    .insert(category)
    .values(CATEGORIES)
    .onConflictDoNothing({ target: category.slug });
  console.log("Categories seeded.");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
