import { api } from "@/utils/api";
import { useState } from "react";

interface TranscriptRequestBody {
  // Define the expected structure of the body here
  [key: string]: any;
}

export default function useElevenLabsTranscript() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<any>(null);

  const postTranscript = async (body: TranscriptRequestBody) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/elevenlabs/transcript", body);
      setResponse(res);
      return res;
    } catch (err: any) {
      setError(err.message || "Unknown error");
      setResponse(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { postTranscript, loading, error, response };
}
