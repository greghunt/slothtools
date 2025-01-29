"use client";

import Image from "next/image";
import { FileUpload } from "@/components/file-upload";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { useCopyToClipboard } from "@uidotdev/usehooks";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to convert file to base64"));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const prompt =
    `I will create an instagram post from these images. Please create a caption for the post. The caption should be ${wordLength} words long and include ${hashTagCount} hashtags. The tone of the caption should be ${tone}` +
    (seedText ? `\n\nThe caption should be about ${seedText}.` : "");

  const handleFilesSelected = (files: File[]) => {
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
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
        selectedFiles.map((file) => fileToBase64(file))
      );

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          images: base64Images,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate caption");
      }

      const { text } = await response.json();
      setAnalysis(text);
    } catch (error) {
      console.error("Error analyzing images:", error);
      setAnalysis(
        "An error occurred while analyzing the images. Please try again."
      );
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
        <header className="flex items-center gap-6">
          <Image src="/favicon.svg" alt="Sloth Tools" width={64} height={64} />
          <div>
            <h2 className="text-2xl font-bold">Caption my Images</h2>
            <p className="text-lg">
              Don&apos;t know what to write for your Instagram post? Let Sloth
              Tools help you out!
            </p>
          </div>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
          <div>
            <Label>Use {wordLength} words</Label>
            <Slider
              defaultValue={[wordLength]}
              max={300}
              step={1}
              onValueChange={(value) => setWordLength(value[0])}
            />
          </div>
          <div>
            <Label>
              {hashTagCount > 0
                ? `Use ${hashTagCount} hashtags`
                : "Don't use hashtags"}
            </Label>
            <Slider
              defaultValue={[hashTagCount]}
              max={10}
              step={1}
              onValueChange={(value) => setHashTagCount(value[0])}
            />
          </div>
          <div>
            <Label htmlFor="tone">Choose your tone of voice</Label>
            <Select
              name="tone"
              value={tone}
              onValueChange={(value) => setTone(value)}
            >
              <SelectTrigger>
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
            <Label htmlFor="seedText">
              Briefly, what do you want the caption to be about?{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="seedText"
              value={seedText}
              onChange={(e) => setSeedText(e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <FileUpload
              onFilesSelected={handleFilesSelected}
              maxFiles={5}
              acceptedFileTypes={["image/png", "image/jpeg", "image/jpg"]}
            />
          </div>
        </div>

        <div className="my-12">
          <Button
            onClick={generateCaption}
            disabled={isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="animate-spin" /> Generating caption...
              </>
            ) : (
              "Generate Caption"
            )}
          </Button>
          {analysis && (
            <div className="bg-background border-2 border-pink-500 p-4 rounded-lg my-8 shadow-lg">
              <div className="flex justify-between items-center mb-2">
                <h3 className="uppercase font-bold mb-2">
                  Your snazzy caption
                </h3>
                <Button onClick={() => copyToClipboard(analysis)}>
                  {hasCopiedText ? <Check /> : <Copy />}
                </Button>
              </div>
              <p className="leading-relaxed text-lg">{analysis}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
