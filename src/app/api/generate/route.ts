import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface RequestBody {
  prompt: string;
  images: string[];
}

interface ImageContent {
  type: "image";
  image: string;
  experimental_providerMetadata: {
    openai: { imageDetail: "low" };
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { prompt, images } = body;

    const { text } = await generateText({
      model: openai("gpt-4o"),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            ...images.map(
              (image) =>
                ({
                  type: "image",
                  image,
                  experimental_providerMetadata: {
                    openai: { imageDetail: "low" },
                  },
                } as ImageContent)
            ),
          ],
        },
      ],
    });

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Error generating caption:", error);
    return NextResponse.json(
      { error: "Failed to generate caption" },
      { status: 500 }
    );
  }
}
