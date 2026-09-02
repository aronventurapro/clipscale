export type StripeEvent = { id: string; type: string; livemode: boolean; data: { object: Record<string, unknown> } };
export function verifyStripeSignature(rawBody: string, signature: string, secret: string, nowSeconds?: number): boolean;
export function parseStripeEvent(rawBody: string): StripeEvent | null;
export function hasExpectedStripeMode(event: StripeEvent, expectedLiveMode: boolean): boolean;
export function stripeIdentifier(value: unknown): string | null;
