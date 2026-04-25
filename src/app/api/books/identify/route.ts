import { applyRateLimit, requireApiAuth, apiResponse, apiError } from "@/lib/api-utils";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";

const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });

function parseJSON(text: string): Record<string, unknown> {
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
  const limited = await applyRateLimit("books-identify", { maxRequests: 40, windowSeconds: 60 });
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
      model: openrouter("meta-llama/llama-3.2-11b-vision-instruct"),
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

  // Step 1.5: Verification — use Perplexity to look up the book and correct author/year
  try {
    const visionTitle = bookInfo.title!;
    const visionAuthor = bookInfo.author ?? "";
    const { text: verifyText } = await generateText({
      model: openrouter("perplexity/sonar-pro"),
      prompt: `A vision model read a book cover and extracted this information:
Title: "${visionTitle}"${visionAuthor ? `\nAuthor: "${visionAuthor}"` : ""}

Search online for this book and find the verified, correct metadata. Be precise — vision models often hallucinate author names and publication years.

Reply ONLY with this JSON, no other text:
{"title":"exact official title","author":"exact full author name as credited on the book","year":"original first publication year as 4-digit string","edition":""}

If the book does not exist or you cannot find it, return the original values unchanged. Never invent data.`,
    });

    const verified = parseJSON(verifyText);
    const stripCitations = (s: string) => s.replace(/\[\d+\]/g, "").trim();
    if (typeof verified.title === "string" && verified.title) {
      bookInfo.title = stripCitations(verified.title);
    }
    if (typeof verified.author === "string" && verified.author) {
      bookInfo.author = stripCitations(verified.author);
    }
    if (typeof verified.year === "string" && verified.year) {
      bookInfo.year = stripCitations(verified.year);
    }
    if (typeof verified.edition === "string" && verified.edition) {
      bookInfo.edition = stripCitations(verified.edition);
    }
  } catch (e) {
    console.error("[identify] verification error:", e);
    // non-fatal: continue with vision data
  }

  // Step 2: Enrichment — descriptions in IT, EN, RU via Perplexity
  let enrichment: { descriptionIt?: string; descriptionEn?: string; descriptionRu?: string } = {};

  try {
    const title = bookInfo.title!;
    const author = bookInfo.author ?? "";
    const { text } = await generateText({
      model: openrouter("perplexity/sonar-pro"),
      prompt: `You are a book cataloging assistant. Write a 2-3 sentence description of this book:

Title: ${title}${author ? `\nAuthor: ${author}` : ""}

Rules:
- Do NOT include citations, references, or footnote markers like [1] [2] etc.
- Write fluent, natural prose in each language.
- Your entire response must be ONLY the following JSON object, nothing else before or after it:

{"descriptionIt":"descrizione in italiano qui","descriptionEn":"description in English here","descriptionRu":"описание на русском здесь"}`,
    });

    const parsed = parseJSON(text);
    const stripCitations = (s: string) => s.replace(/\[\d+\]/g, "").trim();

    enrichment = {
      descriptionIt: typeof parsed.descriptionIt === "string" && parsed.descriptionIt ? stripCitations(parsed.descriptionIt) : undefined,
      descriptionEn: typeof parsed.descriptionEn === "string" && parsed.descriptionEn ? stripCitations(parsed.descriptionEn) : undefined,
      descriptionRu: typeof parsed.descriptionRu === "string" && parsed.descriptionRu ? stripCitations(parsed.descriptionRu) : undefined,
    };
  } catch (e) {
    console.error("[identify] enrichment error:", e);
  }

  return apiResponse({ identified: true, bookInfo, enrichment });
}
