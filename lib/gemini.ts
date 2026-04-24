import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface ExtractedEventInfo {
  event_name: string | null;
  event_date: string | null;
  description: string | null;
  venue: string | null;
  organizer: string | null;
  target_audience: string | null;
  key_speakers: string[];
  highlights: string[];
}

export interface GeneratedPost {
  scheduled_date: string;
  scheduled_time: string | null;
  platform: string;
  post_type: string;
  caption: string;
  hashtags: string[];
  media_spec: {
    type: string;
    orientation: string;
    ratio: string;
    resolution: string;
    max_size_mb: number;
    duration_seconds: number | null;
  };
}

const EXTRACT_PROMPT = `Extract event information from this document. Return ONLY valid JSON, no markdown fences:
{
  "event_name": "official event name or null",
  "event_date": "ISO date YYYY-MM-DD or null",
  "description": "2-3 sentence event description or null",
  "venue": "venue name and location or null",
  "organizer": "organizing company or person or null",
  "target_audience": "who the event is for or null",
  "key_speakers": ["speaker names"],
  "highlights": ["3-5 key highlights or selling points"]
}`;

async function runExtract(parts: Parameters<ReturnType<typeof genAI.getGenerativeModel>["generateContent"]>[0]): Promise<ExtractedEventInfo> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(parts);
  const text = result.response.text();
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Gemini did not return valid JSON");
  return JSON.parse(match[0]) as ExtractedEventInfo;
}

export async function extractEventInfo(
  input: { buffer: Buffer; mimeType: string } | { text: string },
): Promise<ExtractedEventInfo> {
  if ("text" in input) {
    return runExtract([input.text + "\n\n" + EXTRACT_PROMPT]);
  }
  return runExtract([
    { inlineData: { data: input.buffer.toString("base64"), mimeType: input.mimeType } },
    EXTRACT_PROMPT,
  ]);
}

export async function generateContentPlan(
  project: {
    event_name: string;
    event_date: string;
    description: string | null;
    language: string;
    platforms: string[];
    timeframe_start: string;
    timeframe_end: string;
  },
  extracted: ExtractedEventInfo | null,
): Promise<GeneratedPost[]> {
  // thinkingBudget: 0 disables the reasoning step — fast text generation
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    generationConfig: { thinkingConfig: { thinkingBudget: 0 } } as any,
  });

  const start = new Date(project.timeframe_start);
  const end = new Date(project.timeframe_end);
  const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const postCount = days < 14 ? 15 : days < 60 ? 25 : 35;
  const lang = project.language === "tr" ? "Turkish" : "English";

  const extraLines = [
    extracted?.venue ? `Venue: ${extracted.venue}` : null,
    extracted?.organizer ? `Organizer: ${extracted.organizer}` : null,
    extracted?.target_audience ? `Target Audience: ${extracted.target_audience}` : null,
    extracted?.key_speakers?.length ? `Key Speakers: ${extracted.key_speakers.join(", ")}` : null,
    extracted?.highlights?.length ? `Key Highlights: ${extracted.highlights.join("; ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `You are a social media content strategist. Generate a complete posting schedule for this event.

Event: ${project.event_name}
Event Date: ${project.event_date}
Description: ${project.description ?? "Not provided"}
${extraLines}

Platforms: ${project.platforms.join(", ")}
Language: ${lang} (write ALL captions in ${lang})
Posting Window: ${project.timeframe_start} to ${project.timeframe_end} (${days} days)

Generate exactly ${postCount} posts spread strategically across the window in these phases:
1. Announcement (first week)
2. Teasers and spotlights (middle)
3. Countdown and urgency (2 weeks before event)
4. Day-of excitement (event date)
5. Post-event recap (1-2 days after, optional)

Platform rules:
- instagram: casual, emoji-rich; post_type from [post, story, reel, carousel]; stories+reels=9:16, posts=1:1 or 4:5
- facebook: warm and engaging; post_type from [post, video, carousel, story]; 16:9 or 1:1
- linkedin: professional tone; post_type from [post, video, carousel]; 16:9 or 1:1
- tiktok: energetic and casual; post_type=short; always 9:16 vertical video

Return ONLY a valid JSON array, no markdown fences:
[
  {
    "scheduled_date": "YYYY-MM-DD",
    "scheduled_time": "HH:MM:SS or null",
    "platform": "facebook|instagram|linkedin|tiktok",
    "post_type": "post|story|reel|carousel|video|short",
    "caption": "full caption in ${lang}",
    "hashtags": ["up to 10 hashtags without # prefix"],
    "media_spec": {
      "type": "image|video|carousel",
      "orientation": "landscape|portrait|square",
      "ratio": "16:9|9:16|1:1|4:5",
      "resolution": "e.g. 1080x1920",
      "max_size_mb": 10,
      "duration_seconds": null
    }
  }
]

Rules:
- All dates must be between ${project.timeframe_start} and ${project.timeframe_end}
- Each selected platform gets posts spread across the full window
- Vary the content angle for every post (no repeated messages)
- Hashtags have no # prefix`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("Gemini did not return a valid JSON array");
  return JSON.parse(match[0]) as GeneratedPost[];
}
