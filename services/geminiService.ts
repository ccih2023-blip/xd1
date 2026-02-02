
import { GoogleGenAI, Modality } from "@google/genai";

// Always use process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a poem based on location context
 */
export async function generatePoemContent(locationName: string, poetName: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `اكتب قصيدة قصيرة (4-6 أبيات) عن ${locationName} في مدينة نابل التونسية، بأسلوب الشاعر التونسي ${poetName}. اجعلها بليغة ومعبرة عن تاريخ المكان وجمال تونس الخضراء وروح الوطن القبلي.`,
      config: {
        temperature: 0.8,
        topP: 0.9,
      }
    });
    // Use .text property directly
    return response.text || "عذراً، لم نتمكن من نظم الشعر حالياً.";
  } catch (error) {
    console.error("Gemini Content Error:", error);
    return "سكت الشعر في حضرة الجمال التونسي... حاول لاحقاً.";
  }
}

/**
 * Generates an interactive digital mural (image) based on the poem's themes
 */
export async function generateMuralImage(poemText: string, locationName: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `Create a high-contrast, black and white artistic mural illustration representing the soul of Nabeul, Tunisia. The theme is: "${locationName}". Incorporate elements of Arabic calligraphy, Mediterranean waves, and traditional pottery motifs. Style: High contrast photocopy, grainy woodcut, brutalist art. No colors, only black and white ink style. Inspired by this poem: ${poemText}`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    let imageUrl = '';
    // Iterating through all parts to find the image part as per guidelines
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }
    
    if (!imageUrl) throw new Error("No image data generated");
    return imageUrl;
  } catch (error) {
    console.error("Gemini Image Generation Error:", error);
    // Return a placeholder or empty if it fails
    return "https://www.transparenttextures.com/patterns/stardust.png"; 
  }
}

/**
 * Converts text to audio using Gemini TTS
 */
export async function textToSpeech(text: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `اقرأ هذا الشعر ببطء وتأنّي وبصوت جهوري شاعري تظهر فيه نبرة الاعتزاز والجمال: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned");
    
    return `data:audio/pcm;base64,${base64Audio}`;
  } catch (error) {
    console.error("Gemini TTS Error:", error);
    throw error;
  }
}

/**
 * Standard Audio Decoding for PCM
 */
export async function playPcmAudio(base64: string) {
  const binaryString = atob(base64.split(',')[1]);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const dataInt16 = new Int16Array(bytes.buffer);
  const buffer = audioContext.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  
  for (let i = 0; i < dataInt16.length; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  source.start();
}
