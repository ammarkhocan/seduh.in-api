import { PrismaClient } from "../src/generated/prisma";
import { dataProducts } from "./data/products";

const db = new PrismaClient();

async function main() {
  for (const dataProduct of dataProducts) {
    const upsertedProduct = await db.product.upsert({
      where: { slug: dataProduct.slug || "" },
      update: dataProduct,
      create: dataProduct,
    });
    console.log(`☕ ${upsertedProduct.name}`);
  }

  console.log("Seeding complete! Seduh.in product data has been successfully added.");
}

main();
