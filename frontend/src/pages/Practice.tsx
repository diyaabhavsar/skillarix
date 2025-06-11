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
import { usePracticeSession } from "@/hooks/usePracticeSession";
import { useWebSocketSession } from "@/hooks/useWebSocketSession";

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
    const { user } = useAuth();
    
    const {
        categories,
        products,
        testConfigurations,
        selectedCategoryId,
        selectedProductId,
        selectedTestConfigId,
        setSelectedCategoryId,
        setSelectedProductId,
        setSelectedTestConfigId,
        isLoading
    } = usePracticeSession();

    const [isSessionActive, setIsSessionActive] = useState(false);
    
    const {
        websocket,
        sessionLoading,
        sessionError,
        conversationHistory,
        currentCustomerQuestion,
        evaluationResults,
        sendAnswer,
        endSession,
    } = useWebSocketSession(isSessionActive, selectedProductId, selectedTestConfigId);

    const [salespersonInput, setSalespersonInput] = useState('');
    const [isSelectionLoading, setIsSelectionLoading] = useState(false);

    // Add debugging useEffect at the component level (not inside another function)
    useEffect(() => {
        console.log("Conversation history updated:", conversationHistory);
    }, [conversationHistory]);

    const startSession = () => {
        if (!selectedProductId || !selectedTestConfigId) {
            toast.error("Please select a product and a test configuration to start.");
            return;
        }

        try {
            setIsSessionActive(true);
            // Reset conversation history and other states as needed
        } catch (error) {
            console.error("Error starting session:", error);
            setIsSessionActive(false);
        }
    };

    const isStartButtonDisabled = isSelectionLoading || !selectedProductId || !selectedTestConfigId || isSessionActive;

    return (
        <div className="min-h-screen flex flex-col">
            {/* <Navbar /> */}
            <main className="flex-1 container mx-auto px-4 py-8">
                <SetupHeader />

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
                            <CardTitle>Practice Session {sessionLoading ? "(Connecting...)" : ""}</CardTitle>
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
                                        <div className="mb-2">{pair.visitor_text}</div>
                                        
                                        {pair.salesperson_text && (
                                            <div className="mt-3">
                                                <div className="font-semibold text-green-600">Salesperson:</div>
                                                <div>{pair.salesperson_text}</div>
                                            </div>
                                        )}
                                        
                                        {/* Show current input as draft when typing for the latest question */}
                                        {index === conversationHistory.length - 1 && 
                                         !pair.salesperson_text && 
                                         salespersonInput.trim() && 
                                         !sessionLoading && (
                                            <div className="mt-3">
                                                <div className="font-semibold text-green-600">Salesperson (Draft):</div>
                                                <div className="text-muted-foreground italic">{salespersonInput}</div>
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
                                    disabled={sessionLoading || !currentCustomerQuestion} // Only disable when loading or no question
                                    rows={3}
                                />
                                <Button 
                                    onClick={() => sendAnswer(salespersonInput)} 
                                    disabled={sessionLoading || !salespersonInput.trim() || !currentCustomerQuestion}>
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











