import { capitalizeTitle } from "@/utils/textFormatting";

interface EvaluationContentProps {
  title: string;
  content: string | React.ReactNode;
}

export const EvaluationContent: React.FC<EvaluationContentProps> = ({ title, content }) => {
  // Transform the title if it matches overall_score
  const displayTitle = title.toLowerCase() === 'overall_score' 
    ? 'Overall Evaluation'
    : capitalizeTitle(title);

  return (
    <div className="mb-4">
      <h3 className="font-medium text-slate-900 mb-2">{displayTitle}</h3>
      <div className="text-sm text-slate-600">{content}</div>
    </div>
  );
};
