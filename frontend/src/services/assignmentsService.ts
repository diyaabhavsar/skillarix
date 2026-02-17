import { api } from "@/utils/api";

export interface Assignment {
    id: string;
    salesperson_id: string;
    salesperson_name: string;
    admin_id: string;
    admin_name: string;
    product_id: string;
    product_name: string;
    status: "pending" | "accepted" | "rejected" | "completed";
    notes?: string;
    rejection_reason?: string;
    created_at: string;
    updated_at: string;
    conversation_id?: string;
    score?: number;
}

export const assignmentsService = {
    // Admin: Assign a test
    createAssignment: async (salesperson_id: string, product_id: string, notes?: string): Promise<Assignment> => {
        return api.post("/assignments", { salesperson_id, product_id, notes });
    },

    // Get assignments (filtered by status)
    getAssignments: async (status?: string): Promise<Assignment[]> => {
        const query = status ? `?status=${status}` : "";
        return api.get(`/assignments${query}`);
    },

    // Salesperson: Respond to assignment
    respondToAssignment: async (id: string, status: "accepted" | "rejected", rejection_reason?: string): Promise<any> => {
        return api.put(`/assignments/${id}/respond`, { status, rejection_reason });
    },

    // Get single assignment
    getAssignment: async (id: string): Promise<Assignment> => {
        return api.get(`/assignments/${id}`);
    },
};
