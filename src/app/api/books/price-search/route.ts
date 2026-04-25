import { applyRateLimit, requireApiAuth, apiResponse, apiError, parseBody } from "@/lib/api-utils";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { z } from "zod";

const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });


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

    const { text } = await generateText({
      model: openrouter("perplexity/sonar-pro"),
      prompt: `Search the web right now for the current used/second-hand market price of this book:

Title: ${title}${author ? `\nAuthor: ${author}` : ""}

Search Amazon.it, Amazon.com, eBay.it, eBay.com, AbeBooks, IBS, Libraccio and similar sites. Look at actual listings for used or new copies.

Tell me the price you found in EUR (convert from other currencies if needed). Give me a single realistic number based on what you find — an average or the most common price. Do not say you cannot find it; make your best estimate from any available data.

End your response with EXACTLY this block (no variations):
PRICE_EUR: 12.50
SOURCES:
https://example.com/listing1
https://example.com/listing2

Replace the example values with the actual price and actual URLs of the pages you found.`,
    });

    console.log("[price-search] full response:\n", text);

    // Extract price
    const priceMatch = text.match(/PRICE_EUR:\s*([\d]+(?:[.,]\d+)?)/i);
    let marketPrice: number | null = null;
    if (priceMatch) {
      const n = parseFloat(priceMatch[1].replace(",", "."));
      if (!isNaN(n) && n > 0) marketPrice = Math.round(n * 100) / 100;
    }
    if (marketPrice === null) {
      const euroMatch = text.match(/€\s*([\d]+(?:[.,]\d+)?)|EUR\s*([\d]+(?:[.,]\d+)?)/i);
      if (euroMatch) {
        const raw = euroMatch[1] ?? euroMatch[2];
        const n = parseFloat(raw.replace(",", "."));
        if (!isNaN(n) && n > 0) marketPrice = Math.round(n * 100) / 100;
      }
    }

    // Extract URLs from SOURCES block first, then fallback to any URL in text
    const sourceLinks: { url: string }[] = [];
    const sourcesBlockMatch = text.match(/SOURCES:\s*([\s\S]*?)(?:\n\n|$)/i);
    const urlRegex = /https?:\/\/[^\s\])"<>]+/g;
    const urlPool = sourcesBlockMatch
      ? sourcesBlockMatch[1].match(urlRegex) ?? []
      : text.match(urlRegex) ?? [];
    for (const url of urlPool.slice(0, 8)) {
      try { new URL(url); sourceLinks.push({ url }); } catch { /* skip invalid */ }
    }

    return apiResponse({ marketPrice, sources: sourceLinks });
  } catch (e) {
    console.error("[price-search] error:", e);
    return apiError("Ricerca prezzo non disponibile", 500);
  }
}
