
import { useState } from "react";
import Navbar from "@/components/Navbar";
import PastSessionsTable from "@/components/past-sessions/PastSessionsTable";
import SessionsPagination from "@/components/past-sessions/SessionsPagination";
import { pastSessionsData } from "@/data/mockSessionsData";

const PastSessions = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(pastSessionsData.length / itemsPerPage);

  // Using pagination logic only for UI demo - in a real app we would slice the data
  // based on the current page and items per page
  // const currentData = pastSessionsData.slice(
  //   (currentPage - 1) * itemsPerPage,
  //   currentPage * itemsPerPage
  // );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Practice Session History</h1>
          <p className="text-muted-foreground">
            Review your past practice sessions and performance
          </p>
        </div>
        
        <PastSessionsTable sessions={pastSessionsData} />
        
        <SessionsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </main>
    </div>
  );
};

export default PastSessions;
