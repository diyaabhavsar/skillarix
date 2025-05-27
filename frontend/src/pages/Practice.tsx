import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import EvaluationDisplay from "@/components/EvaluationDisplay";
import { Upload } from "lucide-react";
import { Link } from "react-router-dom";
import PracticeSessionContainer from "@/components/practice/PracticeSessionContainer";

type PracticeMode = "idle" | "active" | "completed";

const categories = [
  { value: "enterprise-security", label: "Enterprise Security" },
  { value: "data-management", label: "Data Management" },
  { value: "development-tools", label: "Development Tools" },
];

const products = [
  { value: "cloudguard", label: "CloudGuard Pro", category: "enterprise-security" },
  { value: "datasync", label: "DataSync 360", category: "data-management" },
  { value: "devopsflow", label: "DevOpsFlow", category: "development-tools" },
];

const Practice = () => {
  const [mode, setMode] = useState<PracticeMode>("idle");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [showEvaluation, setShowEvaluation] = useState(false);

  const handleStartSession = () => {
    if (!selectedProduct) return;
    setMode("active");
  };

  const handleEndSession = () => {
    setMode("completed");
    setShowEvaluation(true);
  };

  // Demo mock evaluation data for mid-session evaluation
  const midEvaluationData = {
    type: "mid" as const,
    totalScore: 7,
    maxScore: 10,
    categories: [
      { 
        name: "Conversation Direction", 
        score: 2, 
        maxScore: 3,
        details: ["Good progression toward solution", "Benefits clearly communicated"]
      },
      { 
        name: "Information Consistency", 
        score: 2, 
        maxScore: 3,
        details: ["Consistently accurate information", "One minor contradiction noted"]
      },
      { 
        name: "Customer Engagement", 
        score: 3, 
        maxScore: 4,
        details: ["Strong rapport building", "All questions addressed directly", "Good follow-up questions"]
      },
    ],
    feedback: "You're maintaining a good conversation flow and accurately explaining product features. Keep focusing on connecting features to specific customer benefits.",
    recommendations: [
      "Ask more questions to understand customer needs",
      "Highlight how this product compares to alternatives",
      "Use more concrete examples in explanations"
    ]
  };

  // Demo mock evaluation data for end-of-session evaluation
  const completeEvaluationData = {
    type: "complete" as const,
    totalScore: 8,
    maxScore: 10,
    categories: [
      { name: "Overall Progress", score: 2, maxScore: 3 },
      { name: "Sales Strategy", score: 3, maxScore: 3 },
      { name: "Customer Journey", score: 1, maxScore: 2 },
      { name: "Technical Accuracy", score: 2, maxScore: 2 },
    ],
    feedback: "You demonstrated excellent product knowledge and sales technique throughout the conversation. Your responses were technically accurate and you handled objections well.",
    successMoments: [
      "Excellent explanation of cloud security architecture in Q2",
      "Strong value proposition presented in response to pricing question",
      "Good use of competitor comparison when asked about alternatives"
    ],
    missedOpportunities: [
      "Could have asked about current security setup earlier",
      "Missed chance to discuss implementation timeline when customer showed interest"
    ]
  };

  // Filter products by selected category
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Final Session</h1>
          <p className="text-muted-foreground">Demonstrate your sales skills in this final evaluation</p>
        </div>
        
        {mode === "idle" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Start Session</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Category</label>
                    <Select value={selectedCategory} onValueChange={(value) => {
                      setSelectedCategory(value);
                      setSelectedProduct(""); // Reset product when category changes
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Product</label>
                    <Select
                      value={selectedProduct}
                      onValueChange={setSelectedProduct}
                      disabled={!selectedCategory}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredProducts.map((prod) => (
                          <SelectItem key={prod.value} value={prod.value}>
                            {prod.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Session Settings</label>
                    <div className="border rounded-md p-4">
                      <h4 className="font-medium mb-2">Session Features</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex gap-2">
                          <svg className="h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>8 customer questions</span>
                        </li>
                        <li className="flex gap-2">
                          <svg className="h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Mid-conversation evaluation</span>
                        </li>
                        <li className="flex gap-2">
                          <svg className="h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Complete evaluation summary</span>
                        </li>
                        <li className="flex gap-2">
                          <svg className="h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Customizable customer types</span>
                        </li>
                        <li className="flex gap-2">
                          <svg className="h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Multiple difficulty levels</span>
                        </li>
                        <li className="flex gap-2">
                          <svg className="h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Focus area customization</span>
                        </li>
                      </ul>
                    </div>
                    <Button 
                      onClick={handleStartSession} 
                      disabled={!selectedProduct}
                      className="w-full"
                    >
                      Start Session
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <div className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle>Upload Transcript</CardTitle>
                    <Upload className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload your sales conversation transcript for AI evaluation and feedback
                    </p>
                    <div className="border-2 border-dashed rounded-md p-6 text-center">
                      <p className="text-sm text-muted-foreground">
                        Drag and drop or click to upload transcript files
                      </p>
                      <Button variant="outline" className="mt-4">
                        <Upload className="h-4 w-4 mr-2" />
                        Select Files
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Practice Tips</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-sm">
                      <li className="flex gap-2">
                        <div className="h-5 w-5 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center">
                          <span className="text-primary text-xs">1</span>
                        </div>
                        <span>Answer as if speaking to a real customer</span>
                      </li>
                      <li className="flex gap-2">
                        <div className="h-5 w-5 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center">
                          <span className="text-primary text-xs">2</span>
                        </div>
                        <span>Balance technical details with business benefits</span>
                      </li>
                      <li className="flex gap-2">
                        <div className="h-5 w-5 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center">
                          <span className="text-primary text-xs">3</span>
                        </div>
                        <span>Ask follow-up questions to understand needs</span>
                      </li>
                      <li className="flex gap-2">
                        <div className="h-5 w-5 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center">
                          <span className="text-primary text-xs">4</span>
                        </div>
                        <span>Address objections directly with evidence</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
        
        {mode === "active" && (
          <div className="h-[calc(100vh-12rem)]">
            <PracticeSessionContainer />
          </div>
        )}
        
        {mode === "completed" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">Session Complete</h2>
                <EvaluationDisplay {...completeEvaluationData} />
              </div>
              
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Session Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Product</div>
                        <div className="font-medium">
                          {selectedProduct === "cloudguard" ? "CloudGuard Pro" : selectedProduct === "datasync" ? "DataSync 360" : "DevOpsFlow"}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Duration</div>
                        <div className="font-medium">14m 32s</div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Questions</div>
                        <div className="font-medium">8/8 completed</div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Overall Score</div>
                        <div className="font-medium">80%</div>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <div className="text-sm font-medium mb-2">Score Breakdown</div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span>Overall Progress</span>
                          <span className="font-medium">67%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded">
                          <div className="h-full bg-yellow-500 rounded" style={{ width: "67%" }} />
                        </div>
                        
                        <div className="flex justify-between items-center text-sm">
                          <span>Sales Strategy</span>
                          <span className="font-medium">100%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded">
                          <div className="h-full bg-green-500 rounded" style={{ width: "100%" }} />
                        </div>
                        
                        <div className="flex justify-between items-center text-sm">
                          <span>Customer Journey</span>
                          <span className="font-medium">50%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded">
                          <div className="h-full bg-yellow-500 rounded" style={{ width: "50%" }} />
                        </div>
                        
                        <div className="flex justify-between items-center text-sm">
                          <span>Technical Accuracy</span>
                          <span className="font-medium">100%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded">
                          <div className="h-full bg-green-500 rounded" style={{ width: "100%" }} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex gap-4">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setMode("idle")}
                  >
                    New Session
                  </Button>
                  <Button className="flex-1">
                    View Transcript
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <Dialog open={showEvaluation} onOpenChange={setShowEvaluation}>
        <DialogContent className="sm:max-w-lg">
          <EvaluationDisplay {...midEvaluationData} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Practice;
