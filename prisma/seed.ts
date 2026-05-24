import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.reservation.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.idempotencyKey.deleteMany();

  // Create warehouses
  const chennai = await prisma.warehouse.create({
    data: { name: "Chennai", location: "Tamil Nadu, India" },
  });
  const bangalore = await prisma.warehouse.create({
    data: { name: "Bangalore", location: "Karnataka, India" },
  });
  const mumbai = await prisma.warehouse.create({
    data: { name: "Mumbai", location: "Maharashtra, India" },
  });

  // Create products
  const iphone = await prisma.product.create({
    data: {
      name: "iPhone 15 Pro",
      description: "A17 Pro chip, titanium design, 48MP camera system",
    },
  });
  const macbook = await prisma.product.create({
    data: {
      name: "MacBook Air M3",
      description: "13-inch, M3 chip, 18-hour battery life",
    },
  });
  const airpods = await prisma.product.create({
    data: {
      name: "AirPods Pro 2",
      description: "Active Noise Cancellation, Adaptive Audio",
    },
  });
  const ipad = await prisma.product.create({
    data: {
      name: "iPad Pro M4",
      description: "13-inch Ultra Retina XDR display, M4 chip",
    },
  });
  const watch = await prisma.product.create({
    data: {
      name: "Apple Watch Ultra 2",
      description: "Rugged titanium design, dual-frequency GPS, up to 36-hour battery life",
    },
  });

  // Create inventory per product per warehouse
  const inventoryData = [
    { productId: iphone.id, warehouseId: chennai.id, totalStock: 5 },
    { productId: iphone.id, warehouseId: bangalore.id, totalStock: 3 },
    { productId: iphone.id, warehouseId: mumbai.id, totalStock: 1 }, // low stock for demo
    { productId: macbook.id, warehouseId: chennai.id, totalStock: 8 },
    { productId: macbook.id, warehouseId: bangalore.id, totalStock: 4 },
    { productId: airpods.id, warehouseId: chennai.id, totalStock: 15 },
    { productId: airpods.id, warehouseId: mumbai.id, totalStock: 10 },
    { productId: ipad.id, warehouseId: bangalore.id, totalStock: 2 },
    { productId: ipad.id, warehouseId: mumbai.id, totalStock: 6 },
    { productId: watch.id, warehouseId: chennai.id, totalStock: 6 },
    { productId: watch.id, warehouseId: bangalore.id, totalStock: 4 },
    { productId: watch.id, warehouseId: mumbai.id, totalStock: 2 },
  ];

  for (const inv of inventoryData) {
    await prisma.inventory.create({ data: { ...inv, reservedStock: 0 } });
  }

  console.log("✅ Seed complete");
  console.log(`   ${3} warehouses`);
  console.log(`   ${4} products`);
  console.log(`   ${inventoryData.length} inventory records`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
