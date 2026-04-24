import { apiResponse, apiError, applyRateLimit } from "@/lib/api-utils";
import { validateAndUseInviteToken, auth } from "@/lib/auth";
import { z } from "zod";
import { headers } from "next/headers";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  inviteToken: z.string().min(1),
});

export async function POST(req: Request) {
  const limited = await applyRateLimit("register", { maxRequests: 5, windowSeconds: 60 });
  if (limited) return limited;

  let body: unknown;
  try { body = await req.json(); } catch { return apiError("Invalid JSON", 400); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);

  const { name, email, password, inviteToken } = parsed.data;

  // Admin can register without a token
  const isAdmin = email === process.env.ADMIN_EMAIL;

  if (!isAdmin) {
    const valid = await validateAndUseInviteToken(inviteToken);
    if (!valid) return apiError("Link di invito non valido o scaduto", 400);
  }

  try {
    const hdrs = await headers();
    const response = await auth.api.signUpEmail({
      body: { name, email, password },
      headers: hdrs,
    });
    return apiResponse(response);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Registrazione fallita";
    return apiError(msg, 400);
  }
}
