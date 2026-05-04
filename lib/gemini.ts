import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface MetaAdsBudget {
  target_connections: number;
  budget_usd: number;
  daily_budget_usd: number;
  duration_days: number;
  strategy: string;
}

export interface MetaAdsPlan {
  selected_post: {
    caption_preview: string;
    post_type: string;
    scheduled_date: string;
    rationale: string;
  };
  ad_time_window: {
    start: string;
    end: string;
    rationale: string;
  };
  keywords: string[];
  campaign_type: string;
  campaign_rationale: string;
  budgets: MetaAdsBudget[];
}

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

export async function generateMetaAdsPlan(
  project: {
    event_name: string;
    event_date: string;
    description: string | null;
    timeframe_start: string;
    timeframe_end: string;
  },
  instagramPosts: Array<{
    scheduled_date: string;
    post_type: string;
    caption: string;
  }>,
): Promise<MetaAdsPlan> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    generationConfig: { thinkingConfig: { thinkingBudget: 0 } } as any,
  });

  const postList = instagramPosts
    .map((p, i) => `${i + 1}. [${p.post_type}] ${p.scheduled_date}: ${p.caption.substring(0, 150)}`)
    .join("\n");

  const prompt = `You are a Meta Ads strategist. Create a paid Instagram ad proposal for this event campaign.

Event: ${project.event_name}
Event Date: ${project.event_date}
Description: ${project.description ?? "Not provided"}
Organic posting window: ${project.timeframe_start} to ${project.timeframe_end}

Instagram posts in the content plan:
${postList || "No Instagram posts yet — propose based on the event details."}

Generate 3 realistic budget tiers (small, medium, large) calibrated to this specific event. Consider:
- Event niche and audience competitiveness (sports camp, concert, corporate, etc.)
- Geographic reach (local, national, international)
- Realistic Meta Ads CPM/CPC for this audience segment
- Campaign duration relative to the event date
- Expected conversion rate for this event type

Tiers must have meaningfully different budgets, durations, and strategies. Derive all numbers from the event context — do NOT use generic defaults.

Return ONLY valid JSON, no markdown fences:
{
  "selected_post": {
    "caption_preview": "first 120 characters of the best post caption for an ad",
    "post_type": "post|story|reel|carousel",
    "scheduled_date": "YYYY-MM-DD of that post",
    "rationale": "one sentence: why this post converts best as a paid ad"
  },
  "ad_time_window": {
    "start": "YYYY-MM-DD",
    "end": "YYYY-MM-DD",
    "rationale": "one sentence: optimal run window relative to the event date"
  },
  "keywords": ["up to 10 interest/behaviour keywords Meta Ads would target"],
  "campaign_type": "BRAND_AWARENESS|REACH|TRAFFIC|ENGAGEMENT|LEAD_GENERATION|CONVERSIONS",
  "campaign_rationale": "one sentence: why this objective fits the event goal",
  "budgets": [
    {
      "target_connections": <calculate based on event>,
      "budget_usd": <calculate based on event>,
      "daily_budget_usd": <budget_usd divided by duration_days>,
      "duration_days": <calculate based on event>,
      "strategy": "specific strategy for this tier based on the event niche and audience"
    },
    {
      "target_connections": <calculate based on event>,
      "budget_usd": <calculate based on event>,
      "daily_budget_usd": <budget_usd divided by duration_days>,
      "duration_days": <calculate based on event>,
      "strategy": "specific strategy for this tier based on the event niche and audience"
    },
    {
      "target_connections": <calculate based on event>,
      "budget_usd": <calculate based on event>,
      "daily_budget_usd": <budget_usd divided by duration_days>,
      "duration_days": <calculate based on event>,
      "strategy": "specific strategy for this tier based on the event niche and audience"
    }
  ]
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Gemini did not return valid JSON for ads plan");
  return JSON.parse(match[0]) as MetaAdsPlan;
}
