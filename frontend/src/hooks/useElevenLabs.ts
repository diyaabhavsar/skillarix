import { env } from "@/config/env";
import { useState, useCallback, useEffect } from "react";
import { api } from "@/utils/api";

// Import environment configuration for the prompt title
const PROMPT_TITLE = env.ELEVENLABS_PROMPT_TITLE;

interface ElevenLabsConfig {
  visitorPersona: string;
  product: ProductInfo;
  firstMessage?: string;
  prompt?: string;
}

interface PromptCondition {
  condition: string;
  prompt: string;
}

interface Prompt {
  _id: string;
  title: string;
  prompt: PromptCondition[];
}

const agent_id = env.AGENT_ID;
const api_key = env.API_KEY;

// Fallback prompt in case the dynamic fetch fails
const FALLBACK_PROMPT_TEMPLATE = `# Personality
You are an experienced interviewer, acting as {{Visitor_persona}} visiting a booth to learn more about {{Product_title}}. Your goal is to evaluate the sales rep's skills by asking relevant questions.
# Goal
Ask questions about {{Product_title}} and understand {{Product_detail}} to evaluate the sales rep's knowledge.`;

// Function to fetch the current prompt from the API
async function fetchCurrentPrompt(): Promise<string | null> {
  try {
    // Encode the title for the URL
    const encodedTitle = encodeURIComponent(PROMPT_TITLE);

    // Fetch the prompt by title
    const response = await api.get<Prompt>(`/prompts?title=${encodedTitle}`);

    // Check if we got a valid response with prompt data
    if (response && response.prompt && response.prompt.length > 0) {
      // Find the main condition or use the first one
      const mainCondition = response.prompt.find((c) => c.condition === "main");
      return mainCondition ? mainCondition.prompt : response.prompt[0].prompt;
    }

    console.warn("No prompt found with title:", PROMPT_TITLE);
    return null;
  } catch (error) {
    console.error("Error fetching prompt:", error);
    return null;
  }
}

// Simple function to apply the visitor persona and product values
interface ProductInfo {
  content: string;
  description: string;
  name: string;
}

function getDynamicPrompt(
  visitorPersona: string,
  product: ProductInfo,
  promptTemplate: string
) {
  console.log({product})
  return promptTemplate
    .replace(/{{Visitor_persona}}/gi, visitorPersona)
    .replace(/{{Product_detail}}/gi, `${product.content || ''} ${product.description || ''}`.trim())
    .replace(/{{Product_title}}/gi, product.name || '');
}

// Build the conversation_config object as per your provided structure
export function buildConversationConfig(
  config: ElevenLabsConfig,
  promptTemplate: string
) {
  return {
    conversation_config: {
      agent: {
        first_message:
          config.firstMessage ||
          "Hi there! I'm Harper from Mobio Solutions. How are you?",
        dynamic_variables: {
          dynamic_variable_placeholders: {
            Visitor_persona: config.visitorPersona,
            Product_title: config.product.name,
            Product_detail: `${config.product.content} ${config.product.description}`.trim(),
          },
        },
        prompt: config.prompt
          ? { prompt: config.prompt }
          : {
              prompt: getDynamicPrompt(
                config.visitorPersona,
                config.product,
                promptTemplate
              ),
            },
      },
    },
  };
}

export default function useElevenLabsConfig() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<any>(null);
  const [promptTemplate, setPromptTemplate] = useState<string>(
    FALLBACK_PROMPT_TEMPLATE
  );

  // Fetch the current prompt when the hook is initialized
  useEffect(() => {
    const getPrompt = async () => {
      try {
        const fetchedPrompt = await fetchCurrentPrompt();
        if (fetchedPrompt) {
          console.log("Using dynamic prompt from drawer");
          setPromptTemplate(fetchedPrompt);
        } else {
          console.warn("Using fallback prompt template");
          setPromptTemplate(FALLBACK_PROMPT_TEMPLATE);
        }
      } catch (err) {
        console.error("Error fetching prompt template:", err);
        setPromptTemplate(FALLBACK_PROMPT_TEMPLATE);
      }
    };

    getPrompt();
  }, []);

  const updateAgentConfig = async (config: ElevenLabsConfig) => {
    setLoading(true);
    setError(null);
    try {
      // Try to get the latest prompt
      let currentPrompt = promptTemplate;

      try {
        const freshPrompt = await fetchCurrentPrompt();
        if (freshPrompt) {
          currentPrompt = freshPrompt;
          setPromptTemplate(freshPrompt);
        }
      } catch (err) {
        console.warn("Could not fetch latest prompt, using cached version");
      }

      const bodyObj = buildConversationConfig(config, currentPrompt);

      console.log("Updating ElevenLabs agent with prompt:", {
        promptTitle: PROMPT_TITLE,
        promptLength: currentPrompt.length,
        visitorPersona: config.visitorPersona,
        product: config.product,
      });

      const res = await fetch(
        `https://api.elevenlabs.io/v1/convai/agents/${agent_id}`,
        {
          method: "PATCH",
          headers: {
            "Xi-Api-Key": api_key,
            "Api-Key": "xi-api-key",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bodyObj),
        }
      );
      const body = await res.json();
      setResponse(body);
      return body;
    } catch (err: any) {
      setError(err.message || "Unknown error");
      setResponse(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Helper to manually refresh the prompt
  const refreshPrompt = useCallback(async () => {
    try {
      const freshPrompt = await fetchCurrentPrompt();
      if (freshPrompt) {
        setPromptTemplate(freshPrompt);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to refresh prompt:", err);
      return false;
    }
  }, []);

  return { updateAgentConfig, loading, error, response, refreshPrompt };
}
