import { useEffect, useState } from "react";
import { assignmentsService, Assignment } from "@/services/assignmentsService";
import { useUsers } from "@/hooks/useUsers";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { api } from "@/utils/api";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, User, Package, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const AdminAssignments = () => {
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { users, fetchAllUsers } = useUsers();
    const { products, fetchAllProducts } = useProducts();

    const [formData, setFormData] = useState({
        salespersonId: "",
        productId: "",
        notes: "",
    });

    const loadAssignments = async () => {
        setIsLoading(true);
        try {
            const data = await assignmentsService.getAssignments();
            setAssignments(data);
        } catch (error) {
            console.error("Failed to load assignments", error);
            toast.error("Failed to load assignments");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAssignments();
        fetchAllUsers();
        fetchAllProducts();
    }, []);

    const salespersons = users.filter((u) => {
        const role = (u.role || '').toLowerCase();
        // Include everyone EXCEPT admins to be as inclusive as possible for the salesperson dropdown
        // This ensures users with role 'string', 'employee', 'salesman', etc. all appear
        return role !== "admin";
    });

    // Debugging logs to help identify missing users
    useEffect(() => {
        if (users.length > 0) {
            console.log(`Total users loaded: ${users.length}`);
            console.log(`Common roles found: ${Array.from(new Set(users.map(u => u.role)))}`);
            console.log(`Salespersons filtered: ${salespersons.length}`);
            if (salespersons.length > 0) {
                console.log("Example salespersons:", salespersons.slice(0, 3).map(u => ({ id: u.id, name: u.name, role: u.role })));
            }
        }
    }, [users, salespersons]);

    const handleCreate = async () => {
        if (!formData.salespersonId || !formData.productId) {
            toast.error("Please select a salesperson and a product");
            return;
        }

        setIsSubmitting(true);
        try {
            await assignmentsService.createAssignment(
                formData.salespersonId,
                formData.productId,
                formData.notes
            );
            toast.success("Test assigned successfully");
            setIsDialogOpen(false);
            setFormData({ salespersonId: "", productId: "", notes: "" });
            loadAssignments();
        } catch (error: any) {
            toast.error("Failed to assign test: " + error.message);
        } finally {
            setIsSubmitting(false);
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
            case "pending":
                return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
            case "accepted":
                return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Accepted, Pending Start</Badge>;
            case "rejected":
                return <Badge variant="destructive">Rejected</Badge>;
            case "completed":
                return <Badge className="bg-green-600">Completed</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Test Assignments</h1>
                    <p className="text-muted-foreground">Assign tests to sales representatives and track their progress.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Assign New Test
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Assign Test</DialogTitle>
                            <DialogDescription>
                                Select a salesperson and a product to assign for assessment.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="salesperson">Salesperson</Label>
                                <Select
                                    value={formData.salespersonId}
                                    onValueChange={(val) => setFormData({ ...formData, salespersonId: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Salesperson" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {salespersons.length === 0 ? (
                                            <div className="p-2 text-sm text-center text-muted-foreground italic">
                                                No eligible users found.
                                            </div>
                                        ) : (
                                            salespersons.map((user) => (
                                                <SelectItem key={user.id} value={user.id}>
                                                    {user.name}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="product">Product</Label>
                                <Select
                                    value={formData.productId}
                                    onValueChange={(val) => setFormData({ ...formData, productId: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Product" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {products.length === 0 ? (
                                            <div className="p-2 text-sm text-center text-muted-foreground italic">
                                                No products found.
                                            </div>
                                        ) : (
                                            products.map((prod) => (
                                                <SelectItem key={prod._id} value={prod._id}>
                                                    {prod.name}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="notes">Notes (Optional)</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Add any specific instructions..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreate} disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Assigning...
                                    </>
                                ) : (
                                    "Assign Test"
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Assignments</CardTitle>
                    <CardDescription>View all current and past test assignments.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Salesperson</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Assigned By</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Notes</TableHead>
                                    <TableHead>Result & Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                        </TableCell>
                                    </TableRow>
                                ) : assignments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            No assignments found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    assignments.map((assignment) => (
                                        <TableRow key={assignment.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    {assignment.salesperson_name}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Package className="h-4 w-4 text-muted-foreground" />
                                                    {assignment.product_name}
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                                            <TableCell>{assignment.admin_name}</TableCell>
                                            <TableCell>{assignment.created_at ? new Date(assignment.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                                            <TableCell>
                                                {assignment.notes ? (
                                                    <div className="max-w-[200px] truncate" title={assignment.notes}>
                                                        {assignment.notes}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                                {assignment.status === 'rejected' && (
                                                    <div className="text-destructive text-sm mt-1" title={assignment.rejection_reason}>
                                                        {assignment.rejection_reason}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-2">
                                                    {assignment.score !== null && assignment.score !== undefined ? (
                                                        <span className="font-bold">{assignment.score}/100</span>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs italic">Not completed</span>
                                                    )}
                                                    {assignment.status === 'completed' && assignment.conversation_id && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleViewEvaluation(assignment.conversation_id!)}
                                                        >
                                                            <FileText className="h-4 w-4 mr-1" /> View Feedback
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminAssignments;
