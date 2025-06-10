import { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/api";
import { toast } from "sonner";

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
}

export const usePracticeSession = (): PracticeSessionHook => {
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
    setStateWithLoading(prev => ({ ...prev, categories: [] }));
    try {
      const data = await api.get<CategoryResponse[]>("/categories");
      const fetchedCategories: Category[] = data.map((cat) => ({ 
        id: cat._id, 
        name: cat.name 
      }));
      setState(prev => ({ 
        ...prev, 
        categories: fetchedCategories,
        selectedCategoryId: fetchedCategories.length > 0 ? fetchedCategories[0].id : "",
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
      setState(prev => ({ 
        ...prev, 
        products: fetchedProducts,
        selectedProductId: fetchedProducts.length > 0 ? fetchedProducts[0].id : "",
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
      setState(prev => ({ 
        ...prev, 
        testConfigurations: formattedConfigs,
        selectedTestConfigId: formattedConfigs.length > 0 ? formattedConfigs[0].id : "",
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
    getSelectedConfig
  };
};
