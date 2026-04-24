import { applyRateLimit, requireApiAuth, apiResponse, apiError } from "@/lib/api-utils";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";

const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });

function parseJSON(text: string): Record<string, unknown> {
  // Strip markdown code fences if present
  const clean = text.replace(/```(?:json)?\n?/g, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1) return {};
  try {
    return JSON.parse(clean.slice(start, end + 1));
  } catch {
    return {};
  }
}

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

  // Step 1: Vision — identify book from cover
  let bookInfo: { title?: string; author?: string; year?: string; edition?: string } = {};

  try {
    const { text } = await generateText({
      model: openrouter("google/gemini-2.0-flash"),
      messages: [
        {
          role: "user",
          content: [
            { type: "image", image: dataUrl },
            {
              type: "text",
              text: 'Identify this book from its cover photo. Reply ONLY with a JSON object, no other text. Format: {"title":"...","author":"...","year":"...","edition":"..."}. Use empty string for fields you cannot determine. If you cannot identify the book at all, return {"title":""}.',
            },
          ],
        },
      ],
    });

    const parsed = parseJSON(text);
    bookInfo = {
      title: typeof parsed.title === "string" ? parsed.title : "",
      author: typeof parsed.author === "string" ? parsed.author : undefined,
      year: typeof parsed.year === "string" ? parsed.year : undefined,
      edition: typeof parsed.edition === "string" ? parsed.edition : undefined,
    };
  } catch (e) {
    console.error("[identify] vision error:", e);
    return apiResponse({ identified: false, bookInfo: null, enrichment: null });
  }

  if (!bookInfo.title) {
    return apiResponse({ identified: false, bookInfo: null, enrichment: null });
  }

  // Step 2: Enrichment — description + price via Perplexity (web search)
  let enrichment: { description?: string; marketPrice?: number } = {};

  try {
    const query = `"${bookInfo.title}"${bookInfo.author ? ` by ${bookInfo.author}` : ""}`;
    const { text } = await generateText({
      model: openrouter("perplexity/sonar-pro"),
      prompt: `Search the web and find: (1) a brief description (2-3 sentences) of the book ${query}, and (2) its current average market price in EUR from online bookshops or Amazon. Reply ONLY with a JSON object: {"description":"...","marketPrice":0.00}. Use null for marketPrice if you cannot find a reliable price.`,
    });

    const parsed = parseJSON(text);
    enrichment = {
      description: typeof parsed.description === "string" ? parsed.description : undefined,
      marketPrice: typeof parsed.marketPrice === "number" ? parsed.marketPrice : undefined,
    };
  } catch (e) {
    console.error("[identify] enrichment error:", e);
    // Non-fatal — return what we have from vision
  }

  return apiResponse({ identified: true, bookInfo, enrichment });
}
