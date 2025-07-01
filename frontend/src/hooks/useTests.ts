import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { api } from "@/utils/api";
import { Test } from "@/types/testconfig";


export const useTests = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth();


  // Fetch all test configurations
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


  // Create a new test configuration
  const createTest = async (formData: any) => {
    if (!token) throw new Error("Not authenticated");
    try {
      const newTest = await api.post("/test-configurations", formData);
      setTests((prev: Test[]) => [...prev, newTest as Test]);
      return newTest;
    } catch (error: any) {
      console.error("Error creating test:", error);
      toast.error(`Failed to create test: ${error.message}`);
      throw error;
    }
  };


  // Update a test configuration
  const updateTest = async (id: string, formData: any) => {
    if (!token) throw new Error("Not authenticated");
    try {
      const updatedTest = await api.put(
        `/test-configurations/${id}`,
        formData
      );
      setTests((prev: Test[]) =>
        prev.map((test) => (test._id === id ? (updatedTest as Test) : test))
      );
      return updatedTest;
    } catch (error: any) {
      console.error("Error updating test:", error);
      toast.error(`Failed to update test: ${error.message}`);
      throw error;
    }
  };


  // Delete a test configuration
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


  // Find a test in the local state by id
  const fetchTestById = (id: string) => tests.find(test => test._id === id);

  // Fetch a single test configuration by id using the /config/:id endpoint
  const getTestById = async (id: string): Promise<Test | undefined> => {
    if (!token) return undefined;
    setIsLoading(true);
    try {
      const data = await api.get<Test>(`/test-configurations/config/${id}`);

      return data;
    } catch (error: any) {
      console.error("Error fetching test by id:", error);
      toast.error(`Failed to load test: ${error.message}`);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  };

  // Get the name of a test by id
  const getTestName = (testId: string) => {
    const test = tests.find((t) => t._id === testId);
    return test?.name || "Unknown Test";
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
    fetchTestById,
    getTestById,
    getTestName
  };
};
