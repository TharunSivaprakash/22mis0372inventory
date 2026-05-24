import { prisma } from "./src/lib/prisma";

async function main() {
  console.log("Running layout/SSR page query mock test...");
  try {
    const products = await prisma.product.findMany({
      include: {
        inventories: {
          include: { warehouse: true },
        },
      },
      orderBy: { id: "asc" },
    });
    console.log("Query succeeded! Found products:", products.length);
    console.log("First product warehouses:", products[0]?.inventories.length);
  } catch (error) {
    console.error("Query failed with error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
