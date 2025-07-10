import { env } from "@/config/env";
import { useState, useCallback, useEffect } from "react";
import { api } from "@/utils/api";

// Constants
const {
  ELEVENLABS_PROMPT_TITLE: PROMPT_TITLE,
  AGENT_ID: agent_id,
  API_KEY: api_key,
} = env;

// Type definitions
interface ProductConfig {
  content: string;
  description: string;
  metadata: Record<string, unknown>;
  name: string;
}

interface ElevenLabsConfig {
  visitorPersona: string;
  product: ProductConfig;
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

interface AgentResponse {
  id: string;
  status: string;
  message?: string;
  error?: string;
}

// Fallback prompt in case the dynamic fetch fails
const FALLBACK_PROMPT_TEMPLATE = `# Role and Context
You are an experienced interviewer acting as {{Visitor_persona}} visiting a product demonstration booth. You are here to learn about {{Product_title}} and evaluate the sales representative's knowledge and communication skills.

# Background Information
Product Name: {{Product_title}}
Product Details: {{Product_detail}}

# Your Objectives
1. Gather detailed information about {{Product_title}}
2. Test the sales representative's product knowledge
3. Evaluate their ability to explain technical features
4. Assess how well they handle specific questions

# Conversation Style
- Ask relevant and detailed questions about {{Product_title}}
- Request clarification on technical aspects from {{Product_detail}}
- Maintain a professional but engaging tone
- Follow up on unclear or incomplete answers

# Key Areas to Explore
- Product features and specifications
- Use cases and benefits
- Technical capabilities
- Pricing and availability
- Comparisons with competitors (if applicable)

Remember to stay in character as {{Visitor_persona}} throughout the conversation.`;

// Fetch and extract the current prompt from the API
const fetchCurrentPrompt = async (): Promise<string | null> => {
  if (!PROMPT_TITLE) {
    console.error("Missing PROMPT_TITLE in environment configuration");
    return null;
  }

  try {
    const encodedTitle = encodeURIComponent(PROMPT_TITLE);
    const response = await api.get<Prompt>(`/prompts?title=${encodedTitle}`);

    if (!response?.prompt?.length) {
      console.warn("No prompt found with title:", PROMPT_TITLE);
      return null;
    }

    const { prompt: conditions } = response;
    return (
      conditions.find((c) => c.condition === "main")?.prompt ??
      conditions[0].prompt
    );
  } catch (error) {
    console.error("Error fetching prompt:", error);
    return null;
  }
};

// Apply template variables with product information
const getDynamicPrompt = (
  visitorPersona: string,
  { content, name }: ProductConfig,
  promptTemplate: string
): string => {
  if (!content || !name) {
    console.warn("Missing required product information", {
      hasContent: !!content,
      hasName: !!name,
    });
  }

  console.debug("Generating dynamic prompt with values:", {
    productName: name,
    contentLength: content?.length,
  });

  const replacements = new Map([
    ["{{Visitor_persona}}", visitorPersona],
    ["{{Product_detail}}", content],
    ["{{Product_title}}", name],
  ]);

  return Array.from(replacements).reduce(
    (prompt, [pattern, value]) =>
      prompt.replace(new RegExp(pattern, "gi"), value || ""),
    promptTemplate
  );
};

// Build the conversation_config object as per your provided structure
export function buildConversationConfig(
  config: ElevenLabsConfig,
  promptTemplate: string
) {
  const generatedPrompt =
    config.prompt ??
    getDynamicPrompt(config.visitorPersona, config.product, promptTemplate);

  return {
    conversation_config: {
      agent: {
        first_message:
          config.firstMessage ??
          "Hi there! I'm Harper from Mobio Solutions. How are you?",
        dynamic_variables: {
          dynamic_variable_placeholders: {
            Visitor_persona: config.visitorPersona,
            Product_title: config.product.name,
            Product_detail: config.product.content,
          },
        },
        prompt: {
          prompt: generatedPrompt,
        },
      },
    },
  };
}

export default function useElevenLabsConfig() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AgentResponse | null>(null);
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
      // Get the most recent prompt template
      const currentPrompt = await (async () => {
        try {
          const freshPrompt = await fetchCurrentPrompt();
          if (freshPrompt) {
            setPromptTemplate(freshPrompt);
            return freshPrompt;
          }
        } catch (err) {
          console.warn("Could not fetch latest prompt, using cached version");
        }
        return promptTemplate;
      })();

      const bodyObj = buildConversationConfig(config, currentPrompt);

      console.debug("Updating ElevenLabs agent:", {
        promptTitle: PROMPT_TITLE,
        promptLength: currentPrompt.length,
        hasVisitorPersona: !!config.visitorPersona,
        hasProduct: !!config.product,
      });

      if (!agent_id || !api_key) {
        throw new Error("Missing required API configuration");
      }

      const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/agents/${agent_id}`,
        {
          method: "PATCH",
          headers: {
            "Xi-Api-Key": api_key,
            "Api-Key": "xi-api-key",
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(bodyObj),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const data: AgentResponse = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setResponse(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
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
