import { applyRateLimit, requireApiAuth, apiResponse, apiError, parseBody } from "@/lib/api-utils";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { z } from "zod";

const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });

function parseJSON(text: string): Record<string, unknown> {
  const clean = text.replace(/```(?:json)?\n?/g, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1) return {};
  try { return JSON.parse(clean.slice(start, end + 1)); } catch { return {}; }
}

export async function POST(req: Request) {
  const limited = await applyRateLimit("books-price-search", { maxRequests: 10, windowSeconds: 60 });
  if (limited) return limited;

  const { error } = await requireApiAuth();
  if (error) return error;

  const { data, error: parseErr } = await parseBody(req, z.object({
    title: z.string().min(1),
    author: z.string().optional(),
  }));
  if (parseErr) return parseErr;

  try {
    const { title, author } = data;

    const { text, sources } = await generateText({
      model: openrouter("perplexity/sonar-pro"),
      prompt: `Search the web right now for the current used/second-hand market price of this book:

Title: ${title}${author ? `\nAuthor: ${author}` : ""}

Search Amazon.it, Amazon.com, eBay.it, eBay.com, AbeBooks, IBS, Libraccio and similar sites. Look at actual listings for used or new copies.

Tell me the price you found in EUR (convert from other currencies if needed). Give me a single realistic number based on what you find — an average or the most common price. Do not say you cannot find it; make your best estimate from any available data.

End your response with a line in exactly this format:
PRICE_EUR: 12.50`,
    });

    console.log("[price-search] raw:", text.slice(0, 600));

    // Extract price from "PRICE_EUR: X.XX" line
    const match = text.match(/PRICE_EUR:\s*([\d]+(?:[.,]\d+)?)/i);
    let marketPrice: number | null = null;
    if (match) {
      const n = parseFloat(match[1].replace(",", "."));
      if (!isNaN(n) && n > 0) marketPrice = Math.round(n * 100) / 100;
    }

    // Fallback: try to extract any euro price from the text
    if (marketPrice === null) {
      const euroMatch = text.match(/€\s*([\d]+(?:[.,]\d+)?)|EUR\s*([\d]+(?:[.,]\d+)?)/i);
      if (euroMatch) {
        const raw = euroMatch[1] ?? euroMatch[2];
        const n = parseFloat(raw.replace(",", "."));
        if (!isNaN(n) && n > 0) marketPrice = Math.round(n * 100) / 100;
      }
    }

    // Collect source URLs from SDK sources + any URLs embedded in the text
    const sourceLinks: { url: string; title?: string }[] = [];
    for (const s of sources ?? []) {
      if ("url" in s && typeof s.url === "string") {
        sourceLinks.push({ url: s.url, title: "title" in s && typeof s.title === "string" ? s.title : undefined });
      }
    }
    // Fallback: extract URLs from text if SDK didn't expose them
    if (sourceLinks.length === 0) {
      const urlRegex = /https?:\/\/[^\s\])"]+/g;
      const found = text.match(urlRegex) ?? [];
      for (const url of found.slice(0, 8)) sourceLinks.push({ url });
    }

    return apiResponse({ marketPrice, sources: sourceLinks });
  } catch (e) {
    console.error("[price-search] error:", e);
    return apiError("Ricerca prezzo non disponibile", 500);
  }
}
