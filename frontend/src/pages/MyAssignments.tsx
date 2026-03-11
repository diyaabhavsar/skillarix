import { useEffect, useState } from "react";
import { assignmentsService, Assignment } from "@/services/assignmentsService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, FileText } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/utils/api";

const MyAssignments = () => {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const [rejectId, setRejectId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [isRejecting, setIsRejecting] = useState(false);

    const fetchAssignments = async () => {
        try {
            setIsLoading(true);
            const data = await assignmentsService.getAssignments();
            setAssignments(data);
        } catch (error) {
            console.error("Failed to fetch assignments", error);
            toast.error("Failed to load assignments");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignments();
    }, []);

    const handleAccept = async (assignment: Assignment) => {
        try {
            // 1. Update status to 'accepted'
            await assignmentsService.respondToAssignment(assignment.id, "accepted");
            toast.success("Assignment accepted! Redirecting to setup...");

            // 2. Redirect to session setup with pre-selected product/category
            navigate("/session/setup", {
                state: {
                    preSelectedProductId: assignment.product_id,
                    preSelectedCategoryId: (assignment as any).category_id,
                    assignmentId: assignment.id
                }
            });

        } catch (error: any) {
            toast.error("Failed to accept assignment: " + error.message);
        }
    };

    const handleReject = async () => {
        if (!rejectId) return;
        if (!rejectReason.trim()) {
            toast.error("Please provide a reason for rejection");
            return;
        }

        try {
            setIsRejecting(true);
            await assignmentsService.respondToAssignment(rejectId, "rejected", rejectReason);
            toast.success("Assignment rejected");
            setRejectId(null);
            setRejectReason("");
            fetchAssignments(); // Refresh list
        } catch (error: any) {
            toast.error("Failed to reject: " + error.message);
        } finally {
            setIsRejecting(false);
        }
    };

    const handleViewEvaluation = async (conversationId: string) => {
        try {
            const data: any = await api.get(`/conversations/${conversationId}`);
            if (data) {
                // Store in sessionStorage as SessionFeedback expects
                sessionStorage.setItem(`session-${conversationId}`, JSON.stringify(data));
                navigate(`/feedback/${conversationId}`);
            }
        } catch (error) {
            toast.error("Failed to load evaluation details");
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending": return <Badge variant={"outline" as any} className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending Request</Badge>;
            case "accepted": return <Badge variant={"outline" as any} className="bg-blue-100 text-blue-800 border-blue-200">Accepted</Badge>;
            case "rejected": return <Badge variant={"destructive" as any}>Rejected</Badge>;
            case "completed": return <Badge className="bg-green-600">Completed</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">My Assignments</h1>
                <p className="text-muted-foreground">Manage your test assignments from administrators.</p>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : assignments.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                    <p className="text-lg text-muted-foreground">No assignments found.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {assignments.map((assignment) => (
                        <Card key={assignment.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-1">
                                        <CardTitle className="text-xl">{assignment.product_name}</CardTitle>
                                        <CardDescription>
                                            By {assignment.admin_name} • {new Date(assignment.created_at).toLocaleDateString()}
                                        </CardDescription>
                                    </div>
                                    {getStatusBadge(assignment.status)}
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                {assignment.notes && (
                                    <div className="mb-4 text-sm bg-muted p-3 rounded-md">
                                        <span className="font-semibold block mb-1">Note:</span>
                                        {assignment.notes}
                                    </div>
                                )}
                                {assignment.status === "rejected" && assignment.rejection_reason && (
                                    <div className="mb-4 text-sm bg-destructive/10 text-destructive p-3 rounded-md">
                                        <span className="font-semibold block mb-1">Rejection Reason:</span>
                                        {assignment.rejection_reason}
                                    </div>
                                )}
                                {assignment.status === "completed" && (
                                    <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-100">
                                        <span className="font-bold text-green-800 text-lg">Score: {assignment.score || 0}/100</span>
                                    </div>
                                )}
                            </CardContent>
                            <div className="p-6 pt-0 mt-auto flex flex-col gap-3">
                                {assignment.status === "pending" && (
                                    <div className="flex gap-3">
                                        <Button
                                            className="flex-1"
                                            onClick={() => handleAccept(assignment)}
                                        >
                                            <CheckCircle className="mr-2 h-4 w-4" /> Accept
                                        </Button>
                                        <Button
                                            variant={"outline" as any}
                                            className="flex-1 text-destructive hover:text-destructive"
                                            onClick={() => setRejectId(assignment.id)}
                                        >
                                            <XCircle className="mr-2 h-4 w-4" /> Reject
                                        </Button>
                                    </div>
                                )}
                                {assignment.status === "accepted" && (
                                    <Button
                                        className="w-full bg-blue-600 hover:bg-blue-700"
                                        onClick={() => navigate("/session/setup", {
                                            state: {
                                                preSelectedProductId: assignment.product_id,
                                                preSelectedCategoryId: (assignment as any).category_id,
                                                assignmentId: assignment.id
                                            }
                                        })}
                                    >
                                        Start Test Now
                                    </Button>
                                )}
                                {assignment.status === "completed" && assignment.conversation_id && (
                                    <Button
                                        variant={"outline" as any}
                                        className="w-full"
                                        onClick={() => handleViewEvaluation(assignment.conversation_id!)}
                                    >
                                        <FileText className="mr-2 h-4 w-4" /> View Full Feedback
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Reject Modal */}
            <Dialog open={!!rejectId} onOpenChange={(open) => !open && setRejectId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Assignment</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this assignment.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        placeholder="Reason for rejection..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="min-h-[100px]"
                    />
                    <DialogFooter>
                        <Button variant={"outline" as any} onClick={() => setRejectId(null)}>Cancel</Button>
                        <Button
                            variant={"destructive" as any}
                            onClick={handleReject}
                            disabled={isRejecting || !rejectReason.trim()}
                        >
                            {isRejecting ? "Rejecting..." : "Confirm Rejection"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MyAssignments;
