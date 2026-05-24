import { prisma } from "./prisma";
import { NextResponse } from "next/server";

export async function withIdempotency(
  key: string | null,
  handler: () => Promise<{ data: unknown; status: number }>
): Promise<NextResponse> {
  if (!key) {
    const result = await handler();
    return NextResponse.json(result.data, { status: result.status });
  }

  // Check if we already have a stored response for this key
  const existing = await prisma.idempotencyKey.findUnique({
    where: { key },
  });

  if (existing) {
    return NextResponse.json(existing.response, { status: existing.statusCode });
  }

  const result = await handler();

  // Store the result for future duplicate requests
  await prisma.idempotencyKey.create({
    data: {
      key,
      response: result.data as object,
      statusCode: result.status,
    },
  });

  return NextResponse.json(result.data, { status: result.status });
}
