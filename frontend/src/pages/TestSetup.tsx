import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
// Create a new breadcrumb component for Test Setup if needed, or reuse/modify existing
// import TestSetupBreadcrumb from "@/components/setup/TestSetupBreadcrumb";
import SetupHeader from "@/components/setup/SetupHeader"; // Reuse SetupHeader for now
import TestConfigurationForm, { TestConfigurationFormProps } from "@/components/setup/TestConfigurationForm"; // Import the new component and its props
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from "@/components/ui/input"; // Import Input component
import { Button } from "@/components/ui/button"; // Import Button component

// Define interfaces for Category and Product data fetched from backend
interface Category {
    id: string;
    name: string;
}

interface Product {
    id: string;
    name: string;
    description: string; // Include description if needed for display
    category_id: string;
    // Add other product fields as needed
}


const TestSetup = () => {
    // State for categories and selected category
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

    // State for products based on selected category
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProductId, setSelectedProductId] = useState<string>('');

    // State for persona and criteria data (passed to TestConfigurationForm)
    const [testConfigData, setTestConfigData] = useState<TestConfigurationFormProps['formData']>({
        visitorPersona: {
            background: '',
            pain_points: '',
            goals: '',
            technical_knowledge: '',
            budget_sensitivity: '',
            decision_authority: '',
            previous_experience: '',
        },
        additionalCriteria: {
            distraction_handling: false,
            communication_simplicity: false,
        }
    });

    const [isLoading, setIsLoading] = useState(false); // For fetching data
    const [isSaving, setIsSaving] = useState(false); // For saving configuration

    const { token } = useAuth();

    // --- Fetch Categories on Mount ---
    useEffect(() => {
        const fetchCategories = async () => {
            if (!token) return;
            setIsLoading(true);
            try {
                const res = await fetch("http://localhost:8000/categories", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.detail || "Failed to fetch categories");
                }
                const data = await res.json();
                // Assuming backend returns { _id, name, ... }
                const fetchedCategories: Category[] = data.map((cat: any) => ({ id: cat._id, name: cat.name }));
                setCategories(fetchedCategories);
                // Select the first category by default if available
                if (fetchedCategories.length > 0) {
                    setSelectedCategoryId(fetchedCategories[0].id);
                }
            } catch (error: any) {
                console.error("Error fetching categories:", error);
                toast.error(`Failed to load categories: ${error.message}`);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCategories();
    }, [token]); // Depend on token

    // --- Fetch Products when Category Changes ---
    useEffect(() => {
        const fetchProducts = async () => {
            if (!selectedCategoryId || !token) {
                setProducts([]); // Clear products if no category is selected
                setSelectedProductId(''); // Clear selected product
                return;
            }
            setIsLoading(true);
            try {
                // Assuming your backend endpoint for products is /products/{category_id}
                const res = await fetch(`http://localhost:8000/products/${selectedCategoryId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                 if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.detail || "Failed to fetch products");
                 }
                const data = await res.json();
                 // Assuming backend returns list of { _id, name, category_id, ... }
                const fetchedProducts: Product[] = data.map((prod: any) => ({
                    id: prod._id,
                    name: prod.name,
                    description: prod.description, // Include other fields you need
                    category_id: prod.category_id,
                }));
                setProducts(fetchedProducts);
                // Select the first product by default if available
                if (fetchedProducts.length > 0) {
                    setSelectedProductId(fetchedProducts[0].id);
                } else {
                    setSelectedProductId(''); // Clear if no products found
                }
            } catch (error: any) {
                console.error("Error fetching products:", error);
                toast.error(`Failed to load products: ${error.message}`);
                setProducts([]); // Clear products on error
                setSelectedProductId('');
            } finally {
                setIsLoading(false);
            }
        };
        fetchProducts();
    }, [selectedCategoryId, token]); // Depend on selectedCategoryId and token

    // --- Handlers for Persona and Criteria Changes ---
    const handlePersonaChange: TestConfigurationFormProps['onPersonaChange'] = (field, value) => {
        setTestConfigData(prev => ({
            ...prev,
            visitorPersona: {
                ...prev.visitorPersona,
                [field]: value
            }
        }));
    };

    const handleCriteriaChange: TestConfigurationFormProps['onCriteriaChange'] = (field, checked) => {
        setTestConfigData(prev => ({
            ...prev,
            additionalCriteria: {
                ...prev.additionalCriteria,
                [field]: checked
            }
        }));
    };

    // --- Handler for Saving/Using Test Configuration ---
    // This will need to be implemented based on your backend for saving configurations or starting tests
    const handleSaveConfiguration = async () => {
        if (!selectedProductId) {
            toast.error("Please select a product first.");
            return;
        }
        // Add validation for persona/criteria fields if needed

        setIsSaving(true); // Use a separate loading state for saving
        try {
            // TODO: Implement backend call to save or use this configuration
            console.log("Saving Configuration for Product:", selectedProductId);
            console.log("Persona Data:", testConfigData.visitorPersona);
            console.log("Criteria Data:", testConfigData.additionalCriteria);

            // Example of a placeholder API call (replace with your actual endpoint)
            // const res = await fetch("http://localhost:8000/test-configurations", {
            //     method: "POST",
            //     headers: {
            //         "Content-Type": "application/json",
            //         Authorization: `Bearer ${token}`
            //     },
            //     body: JSON.stringify({
            //         product_id: selectedProductId,
            //         persona: testConfigData.visitorPersona,
            //         criteria: testConfigData.additionalCriteria,
            //     })
            // });

            // if (!res.ok) {
            //     const err = await res.json();
            //     throw new Error(err.detail || "Failed to save configuration");
            // }

            toast.success("Test configuration saved!"); // Or "Test started!"
            // Reset form or navigate
            setTestConfigData({
                visitorPersona: { background: '', pain_points: '', goals: '', technical_knowledge: '', budget_sensitivity: '', decision_authority: '', previous_experience: '' },
                additionalCriteria: { distraction_handling: false, communication_simplicity: false }
            });
             setSelectedCategoryId(''); // Optionally reset selection
             setSelectedProductId('');


        } catch (error: any) {
             console.error("Error saving configuration:", error);
             toast.error(`Failed to save configuration: ${error.message}`);
        } finally {
             setIsSaving(false);
        }
    };


    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-8">
                {/* Replace with TestSetupBreadcrumb if created */}
                {/* <TestSetupBreadcrumb /> */}
                {/* <SetupHeader // Reuse SetupHeader or create a new one
                    title="Test Setup"
                    description="Configure a test conversation with a specific product, customer persona, and evaluation criteria."
                /> */}
                <div className="grid gap-6">
                    {/* Category and Product Selection */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="select-category" className="text-sm font-medium">
                                Select Category
                            </Label>
                             {isLoading ? (
                                <Input value="Loading categories..." disabled />
                             ) : (
                                <Select onValueChange={setSelectedCategoryId} value={selectedCategoryId} disabled={isLoading}>
                                    <SelectTrigger id="select-category">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="select-product" className="text-sm font-medium">
                                Select Product
                            </Label>
                            {isLoading ? (
                                <Input value={selectedCategoryId ? "Loading products..." : "Select a category first..."} disabled />
                            ) : (
                                <Select onValueChange={setSelectedProductId} value={selectedProductId} disabled={isLoading || products.length === 0}>
                                    <SelectTrigger id="select-product">
                                        <SelectValue placeholder={selectedCategoryId ? "Select product" : "Select a category first"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {products.map((prod) => (
                                            <SelectItem key={prod.id} value={prod.id}>
                                                {prod.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>

                    {/* Test Configuration Form (Persona and Criteria) */}
                    {/* Render this only if a product is selected */}
                    {selectedProductId && (
                        <TestConfigurationForm
                            formData={testConfigData}
                            onPersonaChange={handlePersonaChange}
                            onCriteriaChange={handleCriteriaChange}
                            isLoading={isLoading || isSaving} // Pass combined loading state
                            // onSaveConfiguration={handleSaveConfiguration} // Pass the save handler if button is in child
                        />
                    )}

                     {/* Save Configuration Button (If not in child component) */}
                     {selectedProductId && (
                         <div className="flex justify-end mt-6">
                             <Button onClick={handleSaveConfiguration} disabled={isLoading || isSaving}>
                                {isSaving ? "Saving..." : "Save Test Configuration"}
                             </Button>
                         </div>
                     )}

                </div>
            </main>
        </div>
    );
};

export default TestSetup;