import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useConversationHistory } from "@/hooks/useConversationHistory";
import PastSessionsTable from "@/components/past-sessions/PastSessionsTable";
import PracticeHeader from "@/components/practice/PracticeHeader";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useState } from "react";
import { ConversationEvaluation, CompleteRating } from "@/types/conversations";

interface PaginationData {
  skip: number;
  limit: number;
  count: number;
  total_count: number;
  total_pages: number;
}

const defaultRating = { score: 0, max: 0 };

export default function Practice() {
  const location = useLocation();
  const { conversations, fetchConversations } = useConversationHistory();
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationData, setPaginationData] = useState<PaginationData>({
    skip: 0,
    limit: 10,
    count: 0,
    total_count: 0,
    total_pages: 1,
  });

  // Load conversations and show completion toast if needed
  useEffect(() => {
    let mounted = true;
    let refreshInterval: ReturnType<typeof setInterval>;

    async function load() {
      if (!mounted) return;

      try {
        await fetchConversations();

        if (mounted && location.state?.sessionCompleted) {
          toast.success("Assessment session completed!");
        }
      } catch (error) {
        if (mounted) {
          console.error("[Practice] Failed to load conversations:", error);
          toast.error("Failed to load practice sessions");
        }
      }
    }

    // Initial load
    load();

    // Only set up refresh interval if we completed a session
    if (location.state?.sessionCompleted) {
      refreshInterval = setInterval(() => {
        if (document.visibilityState === "visible") {
          load();
        }
      }, 5000);
    }

    // Cleanup function
    return () => {
      mounted = false;
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [location.state?.sessionCompleted]); // Remove fetchConversations from deps

  // Update pagination data when conversations change
  useEffect(() => {
    if (conversations) {
      setPaginationData({
        skip: conversations.skip || 0,
        limit: conversations.limit || 10,
        count: conversations.count || 0,
        total_count: conversations.total_count || 0,
        total_pages: conversations.total_pages || 1,
      });
    }
  }, [conversations]);

  // Transform conversation data to match expected types
  const processedSessions =
    (conversations?.data?.map((session: any) => ({
      ...session,
      evaluation_data: {
        ...session.evaluation_data,
        complete_rating: {
          overall_progress:
            session.evaluation_data?.complete_rating?.overall_progress ||
            defaultRating,
          sales_strategy:
            session.evaluation_data?.complete_rating?.sales_strategy ||
            defaultRating,
          customer_journey:
            session.evaluation_data?.complete_rating?.customer_journey ||
            defaultRating,
          technical_accuracy:
            session.evaluation_data?.complete_rating?.technical_accuracy ||
            defaultRating,
          total:
            session.evaluation_data?.complete_rating?.total || defaultRating,
        } as CompleteRating,
      },
    })) as ConversationEvaluation[]) || [];

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <PracticeHeader />

        <div className="my-8">
          <h2 className="text-2xl font-semibold mb-4">Past Sessions</h2>
          <PastSessionsTable sessions={processedSessions} />
          {paginationData.total_pages > 1 && (
            <div className="mt-4">
              <nav className="flex justify-center">
                <ul className="inline-flex -space-x-px">
                  {Array.from({ length: paginationData.total_pages }).map(
                    (_, index) => (
                      <li key={index}>
                        <button
                          onClick={() => setCurrentPage(index + 1)}
                          className={`px-3 py-2 ${
                            currentPage === index + 1
                              ? "bg-blue-500 text-white"
                              : "bg-white text-gray-500 hover:bg-gray-100"
                          } border border-gray-300`}
                        >
                          {index + 1}
                        </button>
                      </li>
                    )
                  )}
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
