import type {
  DocSlug,
  QueryDocumentationInput,
  QueryDocumentationOutput,
} from "../types"

const DEMO_RESPONSES: Partial<
  Record<
    DocSlug,
    Partial<
      Record<
        string,
        Pick<QueryDocumentationOutput, "answer" | "sources" | "suggestedCode" | "codeLanguage">
      >
    >
  >
> = {
  stripe: {
    "payment intent": {
      answer:
        "Create a PaymentIntent on your server with the amount and currency, then confirm it on the client with Stripe.js. The client secret is required for confirmation.",
      sources: [
        { title: "Payment Intents API", url: "https://stripe.com/docs/payments/payment-intents" },
        { title: "Accept a payment", url: "https://stripe.com/docs/payments/accept-a-payment" },
      ],
      suggestedCode: `import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const intent = await stripe.paymentIntents.create({
  amount: 2000,
  currency: 'usd',
  automatic_payment_methods: { enabled: true },
})

return { clientSecret: intent.client_secret }`,
      codeLanguage: "typescript",
    },
    webhook: {
      answer:
        "Verify the webhook signature with your endpoint secret, then handle `checkout.session.completed` or other event types idempotently. Always return 200 quickly and process work asynchronously.",
      sources: [
        { title: "Webhooks", url: "https://stripe.com/docs/webhooks" },
        { title: "Signatures", url: "https://stripe.com/docs/webhooks/signatures" },
      ],
      suggestedCode: `import Stripe from 'stripe'
import { headers } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  const body = await req.text()
  const sig = (await headers()).get('stripe-signature')!
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return new Response('Bad signature', { status: 400 })
  }
  switch (event.type) {
    case 'payment_intent.succeeded':
      break
    default:
      break
  }
  return new Response('ok', { status: 200 })
}`,
      codeLanguage: "typescript",
    },
  },
}

function matchDemo(
  doc: DocSlug,
  query: string
): QueryDocumentationOutput | null {
  const q = query.toLowerCase()
  const bucket = DEMO_RESPONSES[doc]
  if (!bucket) return null
  for (const key of Object.keys(bucket)) {
    if (q.includes(key)) {
      const row = bucket[key as keyof typeof bucket]
      if (!row) continue
      return {
        answer: row.answer ?? "",
        sources: row.sources ?? [],
        suggestedCode: row.suggestedCode,
        codeLanguage: row.codeLanguage,
      }
    }
  }
  return null
}

export function queryDocumentation(
  input: QueryDocumentationInput
): QueryDocumentationOutput {
  const hit = matchDemo(input.documentationId, input.query)
  if (hit) return hit

  return {
    answer: `Based on **${input.documentationId}** docs, here is a concise answer to: "${input.query.slice(0, 120)}${input.query.length > 120 ? "…" : ""}". In production, DocAssist retrieves live context and cites sources.`,
    sources: [
      {
        title: `${input.documentationId} — documentation`,
        url: "https://example.com/docs",
      },
    ],
    suggestedCode: `// Example integration snippet
await fetch('/api/docassist', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    documentationId: '${input.documentationId}',
    query: ${JSON.stringify(input.query)},
  }),
})`,
    codeLanguage: "typescript",
  }
}
