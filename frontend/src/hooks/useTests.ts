import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { api } from "@/utils/api";

export interface VisitorPersona {
  product_knowledge: string;
  product_familiarity: string;
  technical_expertise: string;
  key_challenges: string;
  buying_objective: string;
  budget_range: string;
  decision_authority: string;
  exhibition_objective: string;
  category?: string;
}

export interface AdditionalCriteria {
  distraction_handling: boolean;
  communication_simplicity: boolean;
}

export interface Test {
  _id: string;
  name: string;
  product_id: string;
  visitorPersona: VisitorPersona;
  additionalCriteria: AdditionalCriteria;
  created_by: string;
  created_at: string;
  updated_at: string;
  updated_by: string;
  category_id?: string;
}

export const useTests = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth();

  const fetchTests = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await api.get<Test[]>("/test-configurations");
      setTests(data);
    } catch (error: any) {
      console.error("Error fetching tests:", error);
      toast.error(`Failed to load tests: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const createTest = async (formData: any) => {
    if (!token) throw new Error("Not authenticated");
    try {
      const newTest = await api.post<Test>("/test-configurations", formData);
      setTests((prev) => [...prev, newTest]);
      return newTest;
    } catch (error: any) {
      console.error("Error creating test:", error);
      toast.error(`Failed to create test: ${error.message}`);
      throw error;
    }
  };

  const updateTest = async (id: string, formData: any) => {
    if (!token) throw new Error("Not authenticated");
    try {
      const updatedTest = await api.put<Test>(
        `/test-configurations/${id}`,
        formData
      );
      setTests((prev) =>
        prev.map((test) => (test._id === id ? updatedTest : test))
      );
      return updatedTest;
    } catch (error: any) {
      console.error("Error updating test:", error);
      toast.error(`Failed to update test: ${error.message}`);
      throw error;
    }
  };

  const deleteTest = async (id: string) => {
    if (!token) throw new Error("Not authenticated");
    try {
      await api.delete(`/test-configurations/${id}`);
      setTests((prev) => prev.filter((test) => test._id !== id));
    } catch (error: any) {
      console.error("Error deleting test:", error);
      toast.error(`Failed to delete test: ${error.message}`);
      throw error;
    }
  };

  useEffect(() => {
    if (token) {
      fetchTests();
    }
  }, [token]);

  return {
    tests,
    isLoading,
    createTest,
    updateTest,
    deleteTest,
    fetchTests,
  };
};
