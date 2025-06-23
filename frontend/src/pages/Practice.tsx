import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useConversationHistory } from "@/hooks/useConversationHistory";
import PastSessionsTable from "@/components/past-sessions/PastSessionsTable";
import PracticeHeader from "@/components/practice/PracticeHeader";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useState } from "react";
import { ConversationEvaluation, CompleteRating } from "@/types/conversations";
import SessionsPagination from "@/components/past-sessions/SessionsPagination";
import { PaginationData } from "@/components/past-sessions/SessionsPagination";

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
  const [isLoading, setIsLoading] = useState(false);
  // Function to handle page changes
  const handlePageChange = async (page: number) => {
    try {
      setIsLoading(true);
      setCurrentPage(page);
      await fetchConversations(page);
    } catch (error) {
      console.error("Failed to fetch page:", page, error);
      toast.error("Failed to load page " + page);
    } finally {
      setIsLoading(false);
    }
  };

  // Load conversations and show completion toast if needed
  useEffect(() => {
    let mounted = true;
    let refreshInterval: ReturnType<typeof setInterval>;

    async function load() {
      if (!mounted) return;

      try {
        setIsLoading(true);
        await fetchConversations(currentPage);

        if (mounted && location.state?.sessionCompleted) {
          toast.success("Assessment session completed!");
        }
      } catch (error) {
        if (mounted) {
          console.error("[Practice] Failed to load conversations:", error);
          toast.error("Failed to load practice sessions");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
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
  }, [location.state?.sessionCompleted]); // Only depend on session completion state

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
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
            <PastSessionsTable sessions={processedSessions} />
          </div>
          {paginationData.total_pages > 1 && (
            <SessionsPagination
              currentPage={currentPage}
              paginationData={paginationData}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
