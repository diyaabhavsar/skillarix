import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SessionFeedbackDisplay from '@/components/past-sessions/SessionFeedbackDisplay';
import { ConversationEvaluation } from '@/types/conversations';

const SessionFeedback: React.FC = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<ConversationEvaluation | null>(null);

  useEffect(() => {
    // Try to get the session data from sessionStorage
    console.log('Looking for session with ID:', sessionId);
    const storedSession = sessionStorage.getItem(`session-${sessionId}`);
    console.log('Found stored session:', storedSession ? 'yes' : 'no');
    
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession);
        console.log('Successfully parsed session data');
        setSession(parsedSession);
      } catch (error) {
        console.error('Error parsing session data:', error);
        navigate('/practice');
      }
    } else {
      console.log('No session data found, redirecting to practice');
      // If no session data is found, redirect to practice page
      navigate('/practice');
    }
  }, [sessionId, navigate]);

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SessionFeedbackDisplay
      session={session}
      onBack={() => navigate('/practice')}
    />
  );
};

export default SessionFeedback;