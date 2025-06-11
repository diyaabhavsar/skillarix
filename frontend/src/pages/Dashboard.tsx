import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useToast } from "@/hooks/use-toast";

// Import new component files
import MetricsOverview from "@/components/dashboard/MetricsOverview";
import ProgressChart from "@/components/ProgressChart";
import RecentSessions from "@/components/dashboard/RecentSessions";
import PerformanceInsights from "@/components/dashboard/PerformanceInsights";
import ProductsGrid from "@/components/dashboard/ProductsGrid";
import SessionHistoryTable from "@/components/dashboard/SessionHistoryTable";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Demo progress data
  const progressData = [
    { date: "May 5", score: 65 },
    { date: "May 7", score: 72 },
    { date: "May 9", score: 68 },
    { date: "May 11", score: 75 },
    { date: "May 13", score: 82 },
  ];

  // Demo products data
  const products = [
    {
      id: 1,
      name: "CloudGuard Pro",
      description: "Enterprise-grade cloud security solution with advanced threat detection and automated response capabilities.",
      category: "Enterprise Security",
      documentStatus: "processed" as const,
    },
    {
      id: 2,
      name: "DataSync 360",
      description: "Real-time data synchronization platform for multi-cloud environments with zero downtime migration.",
      category: "Data Management",
      documentStatus: "uploaded" as const,
    },
    {
      id: 3,
      name: "DevOpsFlow",
      description: "Complete CI/CD pipeline automation with integrated testing and deployment tools for agile teams.",
      category: "Development Tools",
      documentStatus: "none" as const,
    }
  ];

  // Demo recent sessions data
  const recentSessions = [
    {
      id: 1,
      productName: "CloudGuard Pro",
      date: "May 13, 2023",
      score: 82,
      duration: "15m 24s",
      questions: 8,
    },
    {
      id: 2,
      productName: "CloudGuard Pro",
      date: "May 11, 2023",
      score: 75,
      duration: "12m 08s",
      questions: 8,
    },
    {
      id: 3,
      productName: "DataSync 360",
      date: "May 9, 2023",
      score: 68,
      duration: "16m 42s",
      questions: 8,
    },
  ];

  const handleStartPractice = () => {
    if (products.some(p => p.documentStatus === "processed")) {
      navigate("/practice");
    } else {
      toast({
        title: "No processed products available",
        description: "Please upload and process a product document first.",
        variant: "destructive",
      });
    }
  };

  const handleViewAllSessions = () => {
    setActiveTab("history");
  };

  return (
    <div className="min-h-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Monitor your training progress</p>
        </div>
        <div className="flex gap-3">
          
          <Button onClick={handleStartPractice}>
            Start Practice
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        {/* <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="history">Practice History</TabsTrigger>
        </TabsList> */}
        
        <TabsContent value="overview" className="space-y-6">
          <MetricsOverview />
          <ProgressChart data={progressData} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentSessions 
              sessions={recentSessions} 
              onViewAllClick={handleViewAllSessions} 
            />
            <PerformanceInsights />
          </div>
        </TabsContent>
        
        <TabsContent value="products" className="space-y-6">
          <ProductsGrid products={products} />
        </TabsContent>
        
        <TabsContent value="history" className="space-y-6">
          <SessionHistoryTable sessions={[...recentSessions, ...recentSessions]} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
