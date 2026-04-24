import { applyRateLimit, requireApiAuth, apiResponse, apiError } from "@/lib/api-utils";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { z } from "zod";

const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });

const bookInfoSchema = z.object({
  title: z.string(),
  author: z.string().optional(),
  year: z.string().optional(),
  edition: z.string().optional(),
});

const enrichmentSchema = z.object({
  description: z.string().optional(),
  marketPrice: z.number().optional(),
});

export async function POST(req: Request) {
  const limited = await applyRateLimit("books-identify", { maxRequests: 10, windowSeconds: 60 });
  if (limited) return limited;

  const { error } = await requireApiAuth();
  if (error) return error;

  const formData = await req.formData();
  const imageFile = formData.get("image") as File | null;
  if (!imageFile || imageFile.size === 0) return apiError("No image provided", 400);

  const buffer = Buffer.from(await imageFile.arrayBuffer());
  const base64 = buffer.toString("base64");
  const mimeType = imageFile.type || "image/jpeg";
  const dataUrl = `data:${mimeType};base64,${base64}`;

  let bookInfo: z.infer<typeof bookInfoSchema> = { title: "" };
  let enrichment: z.infer<typeof enrichmentSchema> = {};

  // Step 1: Vision — identify book
  try {
    const result = await generateObject({
      model: openrouter("google/gemini-2.0-flash"),
      schema: bookInfoSchema,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", image: dataUrl },
            {
              type: "text",
              text: "Identify this book from its cover. Return the title, author, year of publication, and edition if visible. If you cannot identify it, return an empty title.",
            },
          ],
        },
      ],
    });
    bookInfo = result.object;
  } catch {
    return apiResponse({ identified: false, bookInfo: null, enrichment: null });
  }

  if (!bookInfo.title) {
    return apiResponse({ identified: false, bookInfo: null, enrichment: null });
  }

  // Step 2: Enrichment — description + price via Perplexity
  try {
    const result = await generateObject({
      model: openrouter("perplexity/sonar-pro"),
      schema: enrichmentSchema,
      prompt: `Find a brief description (2-3 sentences) and the current average market price in EUR for the book "${bookInfo.title}"${bookInfo.author ? ` by ${bookInfo.author}` : ""}. Search the web for current prices on sites like Amazon, eBay, or bookshops. Return description and marketPrice as a number.`,
    });
    enrichment = result.object;
  } catch {
    // Enrichment failure is non-fatal
    enrichment = {};
  }

  return apiResponse({ identified: true, bookInfo, enrichment });
}
