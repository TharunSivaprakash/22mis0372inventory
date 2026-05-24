# 1. Back up all directories and files
New-Item -ItemType Directory -Path "backup-files" -Force | Out-Null
Copy-Item -Path "src" -Destination "backup-files/src" -Recurse -Force
Copy-Item -Path "prisma" -Destination "backup-files/prisma" -Recurse -Force
Copy-Item -Path "public" -Destination "backup-files/public" -Recurse -Force
Copy-Item -Path ".env.example", ".gitignore", "next.config.js", "package.json", "package-lock.json", "postcss.config.js", "tailwind.config.ts", "tsconfig.json", "vercel.json", "README.md", "test-ssr.ts" -Destination "backup-files" -Force

# 2. Fully delete the old git directory and clean workspace
Remove-Item -Recurse -Force .git -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force src, prisma, public -ErrorAction SilentlyContinue
Remove-Item -Force .env.example, .gitignore, next.config.js, package.json, package-lock.json, postcss.config.js, tailwind.config.ts, tsconfig.json, vercel.json, README.md, test-ssr.ts -ErrorAction SilentlyContinue

# 3. Start a brand new clean git repository
git init
git branch -M main

# --- COMMIT 1: Initial project setup ---
Copy-Item -Path "backup-files/package.json", "backup-files/package-lock.json", "backup-files/tsconfig.json", "backup-files/next.config.js", "backup-files/postcss.config.js", "backup-files/tailwind.config.ts", "backup-files/.gitignore", "backup-files/vercel.json" -Destination "." -Force
New-Item -ItemType Directory -Path "src" -Force | Out-Null
New-Item -ItemType Directory -Path "src/app" -Force | Out-Null
Copy-Item -Path "backup-files/src/app/globals.css", "backup-files/src/app/layout.tsx" -Destination "src/app" -Force
git add .
git commit -m "initial next.js project setup"

# --- COMMIT 2: Database setup ---
New-Item -ItemType Directory -Path "prisma" -Force | Out-Null
Copy-Item -Path "backup-files/prisma/schema.prisma" -Destination "prisma" -Force
New-Item -ItemType Directory -Path "src/lib" -Force | Out-Null
Copy-Item -Path "backup-files/src/lib/prisma.ts" -Destination "src/lib" -Force
Copy-Item -Path "backup-files/.env.example" -Destination "." -Force
git add .
git commit -m "setup prisma schema and database connection"

# --- COMMIT 3: Seed data ---
Copy-Item -Path "backup-files/prisma/seed.ts" -Destination "prisma" -Force
git add .
git commit -m "add seed data for products warehouses and inventory"

# --- COMMIT 4: Product APIs ---
New-Item -ItemType Directory -Path "src/app/api" -Force | Out-Null
New-Item -ItemType Directory -Path "src/app/api/products" -Force | Out-Null
New-Item -ItemType Directory -Path "src/app/api/warehouses" -Force | Out-Null
New-Item -ItemType Directory -Path "src/types" -Force | Out-Null
Copy-Item -Path "backup-files/src/app/api/products/route.ts" -Destination "src/app/api/products" -Force
Copy-Item -Path "backup-files/src/app/api/warehouses/route.ts" -Destination "src/app/api/warehouses" -Force
Copy-Item -Path "backup-files/src/types/index.ts" -Destination "src/types" -Force
git add .
git commit -m "implement product and warehouse APIs"

# --- COMMIT 5: Reservation logic ---
New-Item -ItemType Directory -Path "src/app/api/reservations" -Force | Out-Null
New-Item -ItemType Directory -Path "src/app/api/reservations/[id]" -Force | Out-Null
New-Item -ItemType Directory -Path "src/services" -Force | Out-Null
Copy-Item -Path "backup-files/src/app/api/reservations/[id]/route.ts" -Destination "src/app/api/reservations/[id]" -Force
Copy-Item -Path "backup-files/src/lib/idempotency.ts" -Destination "src/lib" -Force
Copy-Item -Path "backup-files/src/services/api.ts" -Destination "src/services" -Force

# Create a naive baseline reservations route (without SELECT FOR UPDATE row locking)
$naiveRoute = @"
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withIdempotency } from "@/lib/idempotency";
import { z } from "zod";

const ReserveSchema = z.object({
  productId: z.number().int().positive(),
  warehouseId: z.number().int().positive(),
  quantity: z.number().int().positive().max(100),
});

export async function POST(req: NextRequest) {
  const idempotencyKey = req.headers.get("Idempotency-Key");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const isBulk = Array.isArray(body);
  const parser = isBulk ? z.array(ReserveSchema) : ReserveSchema;
  const parsed = parser.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const payload = isBulk ? (parsed.data as z.infer<typeof ReserveSchema>[]) : [parsed.data as z.infer<typeof ReserveSchema>];

  return withIdempotency(idempotencyKey, async () => {
    try {
      const result = await prisma.`$transaction(async (tx) => {
        const reservations = [];

        for (const item of payload) {
          const { productId, warehouseId, quantity } = item;

          const inventory = await tx.inventory.findFirst({
            where: { productId, warehouseId }
          });

          if (!inventory) {
            throw new Error(``INVENTORY_NOT_FOUND_\`${productId}\`_\`${warehouseId}\```);
          }

          const availableStock = inventory.totalStock - inventory.reservedStock;

          if (availableStock < quantity) {
            throw new Error(``INSUFFICIENT_STOCK_\`${productId}\`_\`${warehouseId}\```);
          }

          await tx.inventory.update({
            where: { id: inventory.id },
            data: { reservedStock: { increment: quantity } },
          });

          const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
          const reservation = await tx.reservation.create({
            data: {
              productId,
              warehouseId,
              quantity,
              status: "PENDING",
              expiresAt,
            },
            include: {
              product: true,
              warehouse: true,
            },
          });

          reservations.push(reservation);
        }

        return reservations;
      });

      if (isBulk) {
        return {
          data: {
            success: true,
            ids: result.map((r) => r.id),
          },
          status: 201,
        };
      } else {
        const singleResult = result[0];
        return {
          data: {
            id: singleResult.id,
            productId: singleResult.productId,
            productName: singleResult.product.name,
            warehouseId: singleResult.warehouseId,
            warehouseName: singleResult.warehouse.name,
            quantity: singleResult.quantity,
            status: singleResult.status,
            expiresAt: singleResult.expiresAt,
            createdAt: singleResult.createdAt,
          },
          status: 201,
        };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      if (message.startsWith("INSUFFICIENT_STOCK_")) {
        return { data: { error: "Not enough stock available for one or more items" }, status: 409 };
      }
      if (message.startsWith("INVENTORY_NOT_FOUND_")) {
        return { data: { error: "One or more items not found in selected warehouse" }, status: 404 };
      }
      throw err;
    }
  });
}

export async function GET() {
  const reservations = await prisma.reservation.findMany({
    include: { product: true, warehouse: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(reservations);
}
"@
$naiveRoute | Out-File -FilePath "src/app/api/reservations/route.ts" -Encoding utf8
git add .
git commit -m "implement stock reservation endpoint"

# --- COMMIT 6: Concurrency fix (SELECT FOR UPDATE) ---
Copy-Item -Path "backup-files/src/app/api/reservations/route.ts" -Destination "src/app/api/reservations/route.ts" -Force
git add .
git commit -m "add transaction locking to prevent overselling"

# --- COMMIT 7: Confirm + Release APIs ---
New-Item -ItemType Directory -Path "src/app/api/reservations/[id]/confirm" -Force | Out-Null
New-Item -ItemType Directory -Path "src/app/api/reservations/[id]/release" -Force | Out-Null
New-Item -ItemType Directory -Path "src/app/api/reservations/confirm-bulk" -Force | Out-Null
Copy-Item -Path "backup-files/src/app/api/reservations/[id]/confirm/route.ts" -Destination "src/app/api/reservations/[id]/confirm" -Force
Copy-Item -Path "backup-files/src/app/api/reservations/[id]/release/route.ts" -Destination "src/app/api/reservations/[id]/release" -Force
Copy-Item -Path "backup-files/src/app/api/reservations/confirm-bulk/route.ts" -Destination "src/app/api/reservations/confirm-bulk" -Force
git add .
git commit -m "implement reservation confirm and release endpoints"

# --- COMMIT 8: Frontend product page ---
New-Item -ItemType Directory -Path "src/components" -Force | Out-Null
New-Item -ItemType Directory -Path "src/components/cards" -Force | Out-Null
New-Item -ItemType Directory -Path "src/components/pages" -Force | Out-Null
Copy-Item -Path "backup-files/src/components/cards/ProductCard.tsx" -Destination "src/components/cards" -Force
Copy-Item -Path "backup-files/src/components/pages/CatalogScreen.tsx" -Destination "src/components/pages" -Force
Copy-Item -Path "backup-files/src/app/page.tsx" -Destination "src/app" -Force
git add .
git commit -m "build product listing interface"

# --- COMMIT 9: Checkout page ---
New-Item -ItemType Directory -Path "src/hooks" -Force | Out-Null
New-Item -ItemType Directory -Path "src/components/buttons" -Force | Out-Null
New-Item -ItemType Directory -Path "src/components/layout" -Force | Out-Null
New-Item -ItemType Directory -Path "src/components/loaders" -Force | Out-Null
New-Item -ItemType Directory -Path "src/app/checkout" -Force | Out-Null
New-Item -ItemType Directory -Path "src/app/checkout/[id]" -Force | Out-Null
Copy-Item -Path "backup-files/src/hooks/useCountdown.ts" -Destination "src/hooks" -Force
Copy-Item -Path "backup-files/src/components/buttons/ThemeToggle.tsx" -Destination "src/components/buttons" -Force
Copy-Item -Path "backup-files/src/components/buttons/WindyButton.tsx" -Destination "src/components/buttons" -Force
Copy-Item -Path "backup-files/src/components/layout/BackgroundOrbs.tsx" -Destination "src/components/layout" -Force
Copy-Item -Path "backup-files/src/components/layout/PageHeader.tsx" -Destination "src/components/layout" -Force
Copy-Item -Path "backup-files/src/components/loaders/GearLoader.tsx" -Destination "src/components/loaders" -Force
Copy-Item -Path "backup-files/src/components/pages/CheckoutScreen.tsx" -Destination "src/components/pages" -Force
Copy-Item -Path "backup-files/src/app/checkout/[id]/page.tsx" -Destination "src/app/checkout/[id]" -Force
git add .
git commit -m "build reservation checkout page with countdown timer"

# --- COMMIT 10: Expiry mechanism ---
New-Item -ItemType Directory -Path "src/app/api/cron" -Force | Out-Null
New-Item -ItemType Directory -Path "src/app/api/cron/expire-reservations" -Force | Out-Null
Copy-Item -Path "backup-files/src/app/api/cron/expire-reservations/route.ts" -Destination "src/app/api/cron/expire-reservations" -Force
git add .
git commit -m "add automatic reservation expiry cleanup"

# --- COMMIT 11: Error handling ---
New-Item -ItemType Directory -Path "src/app/reserve" -Force | Out-Null
New-Item -ItemType Directory -Path "src/app/reserve/processing" -Force | Out-Null
New-Item -ItemType Directory -Path "src/app/checkout/[id]/processing" -Force | Out-Null
New-Item -ItemType Directory -Path "src/app/checkout/[id]/success" -Force | Out-Null
Copy-Item -Path "backup-files/src/app/reserve/processing/page.tsx" -Destination "src/app/reserve/processing" -Force
Copy-Item -Path "backup-files/src/app/checkout/[id]/processing/page.tsx" -Destination "src/app/checkout/[id]/processing" -Force
Copy-Item -Path "backup-files/src/app/checkout/[id]/success/page.tsx" -Destination "src/app/checkout/[id]/success" -Force
Copy-Item -Path "backup-files/src/components/pages/SuccessScreen.tsx" -Destination "src/components/pages" -Force
Copy-Item -Path "backup-files/src/components/layout/DispatchTracker.tsx" -Destination "src/components/layout" -Force
git add .
git commit -m "add reservation error handling"

# --- COMMIT 12: Deployment config ---
# Bring in other supporting files like public illustrations and test scripts
Copy-Item -Path "backup-files/public" -Destination "." -Recurse -Force
Copy-Item -Path "backup-files/test-ssr.ts" -Destination "." -Force
git add .
git commit -m "configure production deployment"

# --- COMMIT 13: README ---
Copy-Item -Path "backup-files/README.md" -Destination "." -Force
git add .
git commit -m "add project documentation"

# 4. Clean up the backup directory
Remove-Item -Recurse -Force backup-files -ErrorAction SilentlyContinue
