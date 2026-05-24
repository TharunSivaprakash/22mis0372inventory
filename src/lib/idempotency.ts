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

  const existing = await prisma.idempotencyKey.findUnique({
    where: { key },
  });

  if (existing) {
    return NextResponse.json(existing.response, { status: existing.statusCode });
  }

  const result = await handler();

  await prisma.idempotencyKey.create({
    data: {
      key,
      response: result.data as object,
      statusCode: result.status,
    },
  });

  return NextResponse.json(result.data, { status: result.status });
}
