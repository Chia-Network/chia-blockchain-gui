export type Principal = { kind: 'ui' } | { kind: 'pair'; topic: string };

const stack: Principal[] = [];

export function getCurrentPrincipal(): Principal | undefined {
  return stack.length > 0 ? stack[stack.length - 1] : undefined;
}

export async function withPrincipal<T>(principal: Principal, fn: () => Promise<T>): Promise<T> {
  stack.push(principal);
  try {
    return await fn();
  } finally {
    const popped = stack.pop();
    if (popped !== principal) {
      // Stack got out of sync; restore as best we can.
      const idx = stack.indexOf(principal);
      if (idx !== -1) stack.splice(idx, 1);
    }
  }
}
