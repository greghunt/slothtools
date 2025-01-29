'use client';

import Image from "next/image";
import { FileUpload } from "@/components/file-upload";
import { useState } from "react";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai"
import { Slider } from "@/components/ui/slider"
import { useCopyToClipboard } from "@uidotdev/usehooks";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { Input } from "@/components/ui/input"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const openai = createOpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY })

interface ImageContent {
  type: 'image';
  image: string;
  experimental_providerMetadata: {
    openai: { imageDetail: 'low' };
  };
}

export default function Home() {
  const [analysis, setAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [wordLength, setWordLength] = useState(100);
  const [hashTagCount, setHashTagCount] = useState(5);
  const [copiedText, copyToClipboard] = useCopyToClipboard();
  const [tone, setTone] = useState<string>("");
  const [seedText, setSeedText] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const hasCopiedText = Boolean(copiedText);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
  };
  
  const prompt = `I will create an instagram post from these images. Please create a caption for the post. The caption should be ${wordLength} words long and include ${hashTagCount} hashtags. The tone of the caption should be ${tone}` + (seedText ? `\n\nThe caption should be about ${seedText}.` : "");

  const handleFilesSelected = (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      setAnalysis("Please upload at least one image file.");
      return;
    }
    setSelectedFiles(imageFiles);
  };

  const generateCaption = async () => {
    if (selectedFiles.length === 0) {
      setAnalysis("Please upload at least one image file.");
      return;
    }

    try {
      setIsAnalyzing(true);
      setAnalysis("");

      const base64Images = await Promise.all(
        selectedFiles.map(file => fileToBase64(file))
      );

      const { text } = await generateText({
        model: openai('gpt-4o'),
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              ...base64Images.map(image => ({
                type: 'image',
                image,
                experimental_providerMetadata: {
                  openai: { imageDetail: 'low' },
                },
              } as ImageContent)),
            ],
          },
        ],
      });
      setAnalysis(text);
    } catch (error) {
      console.error('Error analyzing images:', error);
      setAnalysis("An error occurred while analyzing the images. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 h-screen">
      <Image
        aria-hidden
        src="/mascott.webp"
        alt="Nerdy disco sloth"
        width={256}
        className="col-span-1 h-72 md:h-full object-cover w-full"
        height={256}
      />
      <main className="col-span-3 p-12">
        <h1 className="font-bold text-muted-foreground">Sloth Tools</h1>
        <h2 className="text-2xl font-bold">Caption my Images</h2>
        <div className="not-prose space-y-6">
          <div>
            <h3>Use {wordLength} words</h3>
            <Slider defaultValue={[wordLength]} max={300} step={1} onValueChange={(value) => setWordLength(value[0])} />
          </div>
          <div>
            <h3>{hashTagCount > 0 ? `Use ${hashTagCount} hashtags` : 'Don\'t use hashtags'}</h3>
            <Slider defaultValue={[hashTagCount]} max={10} step={1} onValueChange={(value) => setHashTagCount(value[0])} />
          </div>
          <div>
            <h3>Tone</h3>
            <Select value={tone} onValueChange={(value) => setTone(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="funny">Funny</SelectItem>
                <SelectItem value="serious">Serious</SelectItem>
                <SelectItem value="sarcastic">Sarcastic</SelectItem>
                <SelectItem value="inspirational">Inspirational</SelectItem>
                <SelectItem value="motivational">Motivational</SelectItem>
                <SelectItem value="thoughtful">Thoughtful</SelectItem>
                <SelectItem value="witty">Witty</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div>
            <h3>Briefly, what do you want the caption to be about? <small className="text-muted"></small>(optional)</h3>
            <Input value={seedText} onChange={(e) => setSeedText(e.target.value)} />
          </div>
          <FileUpload
            onFilesSelected={handleFilesSelected}
            maxFiles={5}
            acceptedFileTypes={["image/"]}
          />
          {selectedFiles.length > 0 && (
            <Button 
              onClick={generateCaption} 
              disabled={isAnalyzing || !tone}
              className="w-full"
            >
              {isAnalyzing ? "Generating caption..." : "Generate Caption"}
            </Button>
          )}
          {analysis && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Your snazzy caption</h3>
              <div className="flex flex-row gap-2">
                <Button onClick={() => copyToClipboard(analysis)}>            
                  {hasCopiedText ? <Check /> : <Copy />}                  
                </Button>
                <p className="prose prose-slate lg:prose-xl">{analysis}</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
