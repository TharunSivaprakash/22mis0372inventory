export async function createReservation(payload: any) {
  return fetch("/api/reservations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": `reserve-${Date.now()}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function confirmReservation(id: number) {
  return fetch(`/api/reservations/${id}/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": `checkout-${id}-${Date.now()}-confirm`,
    },
  });
}

export async function confirmBulkReservations(ids: number[], idsStr: string) {
  return fetch("/api/reservations/confirm-bulk", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": `checkout-bulk-${idsStr}-${Date.now()}-confirm`,
    },
    body: JSON.stringify({ ids }),
  });
}

export async function releaseReservation(id: number) {
  return fetch(`/api/reservations/${id}/release`, {
    method: "POST",
  });
}

export async function fetchReservation(id: number) {
  return fetch(`/api/reservations/${id}`);
}
