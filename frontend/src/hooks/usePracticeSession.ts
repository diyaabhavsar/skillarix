import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/utils/api";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";

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

interface PracticeSessionState {
  categories: Category[];
  products: Product[];
  testConfigurations: TestConfiguration[];
  selectedCategoryId: string;
  selectedProductId: string;
  selectedTestConfigId: string;
  isLoading: boolean;
  error: string | null;
}

interface CategoryResponse {
  _id: string;
  name: string;
}

interface ProductResponse {
  _id: string;
  name: string;
  description: string;
  category_id: string;
}

interface TestConfigurationResponse {
  _id: string;
  id?: string;
  name: string;
  product_id: string;
  visitorPersona: Record<string, unknown>;
  additionalCriteria: Record<string, boolean>;
  created_at: string;
}

interface PracticeSessionHook {
  // Data states
  categories: Category[];
  products: Product[];
  testConfigurations: TestConfiguration[];
  selectedCategoryId: string;
  selectedProductId: string;
  selectedTestConfigId: string;

  // Loading and error states
  isLoading: boolean;
  error: string | null;

  // Selection setters
  setSelectedCategoryId: (id: string) => void;
  setSelectedProductId: (id: string) => void;
  setSelectedTestConfigId: (id: string) => void;

  // Session management
  isSelectionValid: boolean;
  getSelectedConfig: () => {
    productName: string;
    configName: string;
  } | null;

  // Add chat-related properties for compatibility
  chatMessages: any[];
  userResponse: string;
  isEndEvaluationOpen: boolean;
  setIsEndEvaluationOpen: (open: boolean) => void;
  handleResponseChange: (val: string) => void;
  submitResponse: () => void;
  handleEndSession: () => void;
  handleNewSession: () => void;
  waitingForLLM: boolean;
}

export const usePracticeSession = (): PracticeSessionHook => {
  const location = useLocation();
  const [state, setState] = useState<PracticeSessionState>({
    categories: [],
    products: [],
    testConfigurations: [],
    selectedCategoryId: "",
    selectedProductId: "",
    selectedTestConfigId: "",
    isLoading: false,
    error: null,
  });

  // Refs to handle auto-selection from navigation state without causing loops
  const pendingProductId = useRef<string | null>(null);
  const pendingConfigId = useRef<string | null>(null);

  useEffect(() => {
    const navState = location.state as { preSelectedCategoryId?: string; preSelectedProductId?: string; preSelectedConfigId?: string } | null;
    if (navState) {
      if (navState.preSelectedProductId) pendingProductId.current = navState.preSelectedProductId;
      if (navState.preSelectedConfigId) pendingConfigId.current = navState.preSelectedConfigId;

      // If Category provided, set it immediately to trigger cascade
      if (navState.preSelectedCategoryId && navState.preSelectedCategoryId !== state.selectedCategoryId) {
        setState(prev => ({ ...prev, selectedCategoryId: navState.preSelectedCategoryId! }));
      }
    }
  }, [location.state]); // Only run when location state changes (usually mount)

  const setStateWithLoading = (updater: (prevState: PracticeSessionState) => Partial<PracticeSessionState>) => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      ...updater(prev)
    }));
  };

  const handleError = (operation: string, error: unknown) => {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    toast.error(`Failed to ${operation}: ${message}`);
    setState(prev => ({ ...prev, error: message, isLoading: false }));
  };

  const isSelectionValid = Boolean(
    state.selectedCategoryId &&
    state.selectedProductId &&
    state.selectedTestConfigId
  );

  const getSelectedConfig = useCallback(() => {
    if (!state.selectedProductId || !state.selectedTestConfigId) return null;

    const product = state.products.find(p => p.id === state.selectedProductId);
    const config = state.testConfigurations.find(c => c.id === state.selectedTestConfigId);

    return {
      productName: product?.name || 'N/A',
      configName: config?.name || 'N/A'
    };
  }, [state.selectedProductId, state.selectedTestConfigId, state.products, state.testConfigurations]);

  // Fetch Categories
  const fetchCategories = async () => {
    // Don't clear categories if we already have them (prevents flicker on re-mount if cached)
    // But for now, simple implementation
    setStateWithLoading(prev => ({ ...prev })); // Just set loading
    try {
      const response = await api.get("/categories");

      const categoriesData = Array.isArray(response) ? response :
        (response && typeof response === 'object' && 'data' in response) ? response.data :
          [];

      if (!Array.isArray(categoriesData)) {
        throw new Error('Invalid categories data format received');
      }

      const fetchedCategories: Category[] = categoriesData.map((cat: CategoryResponse) => ({
        id: cat._id,
        name: cat.name
      }));

      setState(prev => ({
        ...prev,
        categories: fetchedCategories,
        // Only set default if NO selection exists
        selectedCategoryId: prev.selectedCategoryId || (fetchedCategories.length > 0 ? fetchedCategories[0].id : ""),
        isLoading: false
      }));
    } catch (error) {
      handleError("load categories", error);
    }
  };

  // Fetch Products
  const fetchProducts = async (categoryId: string) => {
    if (!categoryId) {
      setState(prev => ({ ...prev, products: [], selectedProductId: "" }));
      return;
    }
    setStateWithLoading(prev => ({ ...prev, products: [] }));
    try {
      const data = await api.get<ProductResponse[]>(`/products/${categoryId}`);
      const fetchedProducts: Product[] = data.map((prod) => ({
        id: prod._id,
        name: prod.name,
        description: prod.description,
        category_id: prod.category_id,
      }));

      let nextProductId = "";
      // Check pending selection first
      if (pendingProductId.current && fetchedProducts.find(p => p.id === pendingProductId.current)) {
        nextProductId = pendingProductId.current;
        pendingProductId.current = null; // Clear it
      } else {
        nextProductId = fetchedProducts.length > 0 ? fetchedProducts[0].id : "";
      }

      setState(prev => ({
        ...prev,
        products: fetchedProducts,
        selectedProductId: nextProductId,
        isLoading: false
      }));
    } catch (error) {
      handleError("load products", error);
      setState(prev => ({ ...prev, products: [], selectedProductId: "" }));
    }
  };

  // Fetch Test Configurations
  const fetchTestConfigurations = async (productId: string) => {
    if (!productId) {
      setState(prev => ({ ...prev, testConfigurations: [], selectedTestConfigId: "" }));
      return;
    }
    setStateWithLoading(prev => ({ ...prev, testConfigurations: [] }));
    try {
      const data = await api.get<TestConfigurationResponse[]>(`/test-configurations/${productId}`);
      const formattedConfigs = data.map((config) => ({
        id: config.id || config._id,
        name: config.name,
        product_id: config.product_id,
        visitorPersona: config.visitorPersona || {},
        additionalCriteria: config.additionalCriteria || {},
        created_at: config.created_at
      }));

      let nextConfigId = "";
      // Check pending selection
      if (pendingConfigId.current && formattedConfigs.find(c => c.id === pendingConfigId.current)) {
        nextConfigId = pendingConfigId.current;
        pendingConfigId.current = null;
      } else {
        nextConfigId = formattedConfigs.length > 0 ? formattedConfigs[0].id : "";
      }

      setState(prev => ({
        ...prev,
        testConfigurations: formattedConfigs,
        selectedTestConfigId: nextConfigId,
        isLoading: false
      }));
    } catch (error) {
      handleError("load test configurations", error);
      setState(prev => ({ ...prev, testConfigurations: [], selectedTestConfigId: "" }));
    }
  };

  // Effect for initial categories load
  useEffect(() => {
    fetchCategories();
  }, []);

  // Effect for products load when category changes
  useEffect(() => {
    if (state.selectedCategoryId) {
      fetchProducts(state.selectedCategoryId);
    }
  }, [state.selectedCategoryId]);

  // Effect for test configurations load when product changes
  useEffect(() => {
    if (state.selectedProductId) {
      fetchTestConfigurations(state.selectedProductId);
    }
  }, [state.selectedProductId]);

  const chatMessages: any[] = [];
  const userResponse = "";
  const isEndEvaluationOpen = false;
  const setIsEndEvaluationOpen = () => { };
  const handleResponseChange = () => { };
  const submitResponse = () => { };
  const handleEndSession = () => { };
  const handleNewSession = () => { };
  const waitingForLLM = false;

  return {
    // Data
    categories: state.categories,
    products: state.products,
    testConfigurations: state.testConfigurations,
    selectedCategoryId: state.selectedCategoryId,
    selectedProductId: state.selectedProductId,
    selectedTestConfigId: state.selectedTestConfigId,

    // Status
    isLoading: state.isLoading,
    error: state.error,

    // Setters
    setSelectedCategoryId: (id: string) => setState(prev => ({ ...prev, selectedCategoryId: id })),
    setSelectedProductId: (id: string) => setState(prev => ({ ...prev, selectedProductId: id })),
    setSelectedTestConfigId: (id: string) => setState(prev => ({ ...prev, selectedTestConfigId: id })),

    // Helpers
    isSelectionValid,
    getSelectedConfig,
    // Add stubs for chat-related values so PracticeSessionContainer doesn't error
    chatMessages,
    userResponse,
    isEndEvaluationOpen,
    setIsEndEvaluationOpen,
    handleResponseChange,
    submitResponse,
    handleEndSession,
    handleNewSession,
    waitingForLLM
  };
};
