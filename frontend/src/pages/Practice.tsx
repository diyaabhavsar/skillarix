import React, { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import { SetupHeader } from "@/components/setup/SetupHeader";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Category {
    id: string;
    name: string;
}

interface Product {
    id: string;
    name: string;
    description: string;
    category_id: string;
}

interface TestConfiguration {
    id: string;
    name: string;
    product_id: string;
    visitorPersona: { [key: string]: any };
    additionalCriteria: { [key: string]: boolean };
    created_at: string;
}

interface ConversationPair {
    visitor_text: string;
    salesperson_text: string;
}

const Practice = () => {
    const { token } = useAuth();
    console.log(token)

    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [testConfigurations, setTestConfigurations] = useState<TestConfiguration[]>([]);
    const [selectedTestConfigId, setSelectedTestConfigId] = useState<string>('');

    const [isSessionActive, setIsSessionActive] = useState(false);
    const [conversationHistory, setConversationHistory] = useState<ConversationPair[]>([]);
    const [salespersonInput, setSalespersonInput] = useState('');
    const [currentCustomerQuestion, setCurrentCustomerQuestion] = useState('');
    const [sessionLoading, setSessionLoading] = useState(false);
    const [sessionError, setSessionError] = useState<string | null>(null);
    const [websocket, setWebsocket] = useState<WebSocket | null>(null);

    const [evaluationResults, setEvaluationResults] = useState<any>(null);

    const [isSelectionLoading, setIsSelectionLoading] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            if (!token) return;
            setIsSelectionLoading(true);
            try {
                const res = await fetch("http://localhost:8000/categories", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.detail || "Failed to fetch categories");
                }
                const data = await res.json();
                const fetchedCategories: Category[] = data.map((cat: any) => ({ id: cat._id, name: cat.name }));
                setCategories(fetchedCategories);
                if (fetchedCategories.length > 0) {
                    setSelectedCategoryId(fetchedCategories[0].id);
                } else {
                     setSelectedCategoryId('');
                }
            } catch (error: any) {
                console.error("Error fetching categories:", error);
                toast.error(`Failed to load categories: ${error.message}`);
            } finally {
                setIsSelectionLoading(false);
            }
        };
        fetchCategories();
    }, [token]);

    useEffect(() => {
        const fetchProducts = async () => {
            if (!selectedCategoryId || !token) {
                setProducts([]);
                setSelectedProductId('');
                setTestConfigurations([]);
                setSelectedTestConfigId('');
                return;
            }
            setIsSelectionLoading(true);
            try {
                const res = await fetch(`http://localhost:8000/products/${selectedCategoryId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                 if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.detail || "Failed to fetch products");
                 }
                const data = await res.json();
                const fetchedProducts: Product[] = data.map((prod: any) => ({
                    id: prod._id,
                    name: prod.name,
                    description: prod.description,
                    category_id: prod.category_id,
                }));
                setProducts(fetchedProducts);
                setTestConfigurations([]);
                setSelectedTestConfigId('');
                if (fetchedProducts.length > 0) {
                    setSelectedProductId(fetchedProducts[0].id);
                } else {
                    setSelectedProductId('');
                }
            } catch (error: any) {
                console.error("Error fetching products:", error);
                toast.error(`Failed to load products: ${error.message}`);
                setProducts([]);
                setSelectedProductId('');
                setTestConfigurations([]);
                setSelectedTestConfigId('');
            } finally {
                setIsSelectionLoading(false);
            }
        };
        fetchProducts();
    }, [selectedCategoryId, token]);

    useEffect(() => {
        const fetchTestConfigurations = async () => {
            if (!selectedProductId || !token) {
                setTestConfigurations([]);
                setSelectedTestConfigId('');
                return;
            }
            setIsSelectionLoading(true);
            try {
                const res = await fetch(`http://localhost:8000/test-configurations/${selectedProductId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                 if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.detail || "Failed to fetch test configurations");
                 }
                const data = await res.json();
                setTestConfigurations(data);
                const currentSelectionExists = data.some((config: TestConfiguration) => config.id === selectedTestConfigId);
                if (data.length > 0 && (!selectedTestConfigId || !currentSelectionExists)) {
                    setSelectedTestConfigId(data[0].id);
                } else if (data.length === 0) {
                    setSelectedTestConfigId('');
                }
            } catch (error: any) {
                console.error("Error fetching test configurations:", error);
                toast.error(`Failed to load test configurations: ${error.message}`);
                setTestConfigurations([]);
                setSelectedTestConfigId('');
            } finally {
                setIsSelectionLoading(false);
            }
        };
        fetchTestConfigurations();
    }, [selectedProductId, token]);

    useEffect(() => {
        if (!isSessionActive) {
            websocket?.close();
            setWebsocket(null);
            return;
        }

        const ws = new WebSocket("ws://localhost:8000/ws/chat");

        ws.onopen = () => {
            console.log("WebSocket connection established.");
            if (selectedProductId && selectedTestConfigId) {
                 ws.send(JSON.stringify({
                      type: "start",
                      product_id: selectedProductId,
                      test_configuration_id: selectedTestConfigId,
                 }));
                 setSessionLoading(true);
                 setSessionError(null);
            } else {
                 setSessionError("Product and Test Configuration must be selected to start.");
                 setIsSessionActive(false);
                 ws.close();
            }
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("WebSocket message received:", data);

            if (data.type === "question") {
                setCurrentCustomerQuestion(data.content);
                setConversationHistory(prev => [...prev, { visitor_text: data.content, salesperson_text: '' }]);
                setSessionLoading(false);
            } else if (data.type === "evaluation") {
                setConversationHistory(prev => {
                    const lastPair = { ...prev[prev.length - 1] };
                    lastPair.salesperson_text = salespersonInput;
                    return [...prev.slice(0, -1), lastPair];
                });
                console.log("Individual Evaluation:", data.evaluation);
                setSalespersonInput('');

                 setCurrentCustomerQuestion(data.next_question);
                 setConversationHistory(prev => [...prev, { visitor_text: data.next_question, salesperson_text: '' }]);


                setSessionLoading(false);

            } else if (data.type === "session_complete") {
                 console.log("Session Complete:", data);
                 setEvaluationResults({
                      complete: data.complete_evaluation,
                      additional: data.additional_criteria_evaluation,
                 });
                 setIsSessionActive(false);
                 setSessionLoading(false);

            } else if (data.type === "error") {
                 console.error("WebSocket Error from server:", data.content);
                 setSessionError(data.content || "An error occurred during the session.");
                 setIsSessionActive(false);
                 setSessionLoading(false);
            }
        };

        ws.onerror = (event) => {
            console.error("WebSocket error:", event);
            setSessionError("WebSocket connection error.");
            setIsSessionActive(false);
            setSessionLoading(false);
        };

        ws.onclose = (event) => {
            console.log("WebSocket connection closed:", event.code, event.reason);
            if (isSessionActive) {
                 setSessionError("Session ended unexpectedly.");
            }
            setIsSessionActive(false);
            setSessionLoading(false);
        };

        setWebsocket(ws);

        return () => {
            ws.close();
        };
    }, [isSessionActive, selectedProductId, selectedTestConfigId, token]);

     const sendSalespersonAnswer = () => {
         if (websocket && websocket.readyState === WebSocket.OPEN && !sessionLoading && salespersonInput.trim() && currentCustomerQuestion) {
             setSessionLoading(true);
             setSessionError(null);

             const historyPayload = conversationHistory.map((pair, index) => {
                 if (index === conversationHistory.length - 1) {
                      return { visitor_text: pair.visitor_text, salesperson_text: salespersonInput };
                 }
                 return pair;
             });

             websocket.send(JSON.stringify({
                 type: "answer",
                 product_id: selectedProductId,
                 last_question: currentCustomerQuestion,
                 answer: salespersonInput,
                 history: historyPayload,
                 test_configuration_id: selectedTestConfigId,
             }));

         }
     };

     const endSession = () => {
          if (websocket && websocket.readyState === WebSocket.OPEN && selectedProductId && selectedTestConfigId) {
               setSessionLoading(true);
               websocket.send(JSON.stringify({
                    type: "end_session",
                    product_id: selectedProductId,
                    history: conversationHistory,
                    test_configuration_id: selectedTestConfigId,
               }));
          } else {
               setIsSessionActive(false);
          }
     };

    const startSession = () => {
         if (!selectedProductId || !selectedTestConfigId) {
              toast.error("Please select a product and a test configuration to start.");
              return;
         }
         setIsSessionActive(true);
         setConversationHistory([]);
         setCurrentCustomerQuestion('');
         setEvaluationResults(null);
         setSessionError(null);
    };

     const isStartButtonDisabled = isSelectionLoading || !selectedProductId || !selectedTestConfigId || isSessionActive;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
                <SetupHeader/>
                
                {!isSessionActive ? (
                    <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Start Session</CardTitle>
                </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="select-category" className="text-sm font-medium">
                                    Select Category
                                </Label>
                                <Select onValueChange={setSelectedCategoryId} value={selectedCategoryId} disabled={isSelectionLoading}>
                                    <SelectTrigger id="select-category">
                        <SelectValue placeholder="Choose a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                            <div className="grid gap-2">
                                <Label htmlFor="select-product" className="text-sm font-medium">
                                    Select Product
                                </Label>
                                <Select onValueChange={setSelectedProductId} value={selectedProductId} disabled={isSelectionLoading || products.length === 0 || !selectedCategoryId}>
                                    <SelectTrigger id="select-product">
                                        <SelectValue placeholder={selectedCategoryId ? (isSelectionLoading ? "Loading products..." : "Choose a product") : "Select a category first"} />
                      </SelectTrigger>
                      <SelectContent>
                                        {products.map((prod) => (
                                            <SelectItem key={prod.id} value={prod.id}>
                                                {prod.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                            <div className="grid gap-2">
                                <Label htmlFor="select-test-config" className="text-sm font-medium">
                                    Select Test Scenario
                                </Label>
                                <Select onValueChange={setSelectedTestConfigId} value={selectedTestConfigId} disabled={isSelectionLoading || testConfigurations.length === 0 || !selectedProductId}>
                                    <SelectTrigger id="select-test-config">
                                        <SelectValue placeholder={selectedProductId ? (isSelectionLoading ? "Loading scenarios..." : "Choose a scenario") : "Select a product first"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {testConfigurations.map((config) => (
                                            <SelectItem key={config.id} value={config.id}>
                                                {config.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button onClick={startSession} disabled={isStartButtonDisabled}>
                                {isSessionActive ? "Session in Progress" : "Start Session"}
                    </Button>

                            {sessionError && <div className="text-red-500">{sessionError}</div>}

                </CardContent>
              </Card>
                ) : (
                    <Card className="mb-6">
                         <CardHeader>
                             <CardTitle>Practice Session</CardTitle>
                             {selectedProductId && (
                                  <p className="text-sm text-muted-foreground">
                                      Product: {products.find(p => p.id === selectedProductId)?.name || 'N/A'} |
                                      Scenario: {testConfigurations.find(c => c.id === selectedTestConfigId)?.name || 'N/A'}
                                  </p>
                             )}
                         </CardHeader>
                         <CardContent className="grid gap-6">
                              <ScrollArea className="h-[400px] border rounded-md p-4">
                              {conversationHistory.map((pair, index) => (
    <div key={index} className="mb-4">
        <div className="font-semibold text-blue-600">Customer:</div>
        <div>{pair.visitor_text}</div>
        {pair.salesperson_text && (
            <div>
                <div className="font-semibold text-green-600 mt-2">Salesperson:</div>
                <div>{pair.salesperson_text}</div>
            </div>
        )}
    </div>
))}
                                  {sessionLoading && (
                                       <div className="italic text-muted-foreground">AI is thinking...</div>
                                  )}
                             </ScrollArea>

                             <div className="grid gap-2">
                                 <Label htmlFor="salesperson-input" className="text-sm font-medium">
                                     Your Response
                                 </Label>
                                 <Textarea
                                     id="salesperson-input"
                                     placeholder="Type your response here..."
                                     value={salespersonInput}
                                     onChange={(e) => setSalespersonInput(e.target.value)}
                                     disabled={sessionLoading}
                                     rows={3}
                                 />
                                  <Button onClick={sendSalespersonAnswer} disabled={sessionLoading || !salespersonInput.trim()}>
                                      {sessionLoading ? "Sending..." : "Send Response"}
                                  </Button>
            </div>
            
                             <div className="flex justify-end">
                                  <Button variant="outline" onClick={endSession} disabled={sessionLoading}>
                                       End Session & Get Evaluation
                      </Button>
                    </div>

                              {sessionError && <div className="text-red-500 mt-4">{sessionError}</div>}
                  </CardContent>
                </Card>
                )}

                 {evaluationResults && (
                <Card>
                  <CardHeader>
                                <CardTitle>Evaluation Results</CardTitle>
                  </CardHeader>
                           <CardContent className="grid gap-4">
                                <div>
                                     <h3 className="text-lg font-semibold mb-2">Complete Conversation Evaluation:</h3>
                                     <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: evaluationResults.complete.replace(/\n/g, '<br/>') }}></div>
                        </div>
                                {evaluationResults.additional && (
                                     <div>
                                          <Separator className="my-4" />
                                          <h3 className="text-lg font-semibold mb-2">Additional Criteria Evaluation:</h3>
                                           <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: evaluationResults.additional.replace(/\n/g, '<br/>') }}></div>
                      </div>
                                )}
                  </CardContent>
                </Card>
        )}
      </main>
    </div>
  );
};

export default Practice;
