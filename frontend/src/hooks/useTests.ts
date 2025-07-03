import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { api } from "@/utils/api";
import { Test } from "@/types/testconfig";

export const useTests = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [testsResponse, setTestsResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth();


  // Fetch test configurations with pagination
  const fetchTests = async (page: number = 1, limit: number = 10) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data: any = await api.get(`/test-configurations?page=${page}&limit=${limit}`);
      
      // Handle pagination response format
      if (data.data && Array.isArray(data.data)) {
        setTests(data.data);
        setTestsResponse(data);
      } else {
        // Fallback for old format
        setTests(data as Test[]);
      }
    } catch (error: any) {
      console.error("Error fetching tests:", error);
      toast.error(`Failed to load tests: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all test configurations (for dropdowns, etc.)
  const fetchAllTests = async () => {
    if (!token) return;
    try {
      const data: any = await api.get("/test-configurations");
      // Handle both paginated and non-paginated responses
      const testData = data.data && Array.isArray(data.data) ? data.data : data;
      setTests(testData as Test[]);
    } catch (error: any) {
      console.error("Error fetching all tests:", error);
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
    testsResponse,
    isLoading,
    createTest,
    updateTest,
    deleteTest,
    fetchTests,
    fetchAllTests,
    fetchTestById,
    getTestById,
    getTestName
  };
};
