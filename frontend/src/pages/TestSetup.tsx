import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
// Create a new breadcrumb component for Test Setup if needed, or reuse/modify existing
// import TestSetupBreadcrumb from "@/components/setup/TestSetupBreadcrumb";
import {TestSetupHeader} from "@/components/setup/SetupHeader"; // Reuse SetupHeader for now
import TestConfigurationForm, { TestConfigurationFormProps, TestConfigurationFormData } from "@/components/setup/TestConfigurationForm"; // Import the component, its props, AND the FormData interface
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

// ADDED: Define the initial state for the test configuration form data
const initialTestConfigurationFormData: TestConfigurationFormData = {
    name: '', // Initialize the new name field as an empty string
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
};


const TestSetup = () => {
    // State for categories and selected category
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

    // State for products based on selected category
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProductId, setSelectedProductId] = useState<string>('');

    // State for persona and criteria data (passed to TestConfigurationForm)
    // MODIFIED: Initialize the state using the new initialTestConfigurationFormData
    const [testConfigData, setTestConfigData] = useState<TestConfigurationFormData>(initialTestConfigurationFormData);


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
                setTestConfigData(initialTestConfigurationFormData); // ADDED: Clear form data when category changes
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
                 setTestConfigData(initialTestConfigurationFormData); // ADDED: Clear form data when products are fetched successfully
            } catch (error: any) {
                console.error("Error fetching products:", error);
                toast.error(`Failed to load products: ${error.message}`);
                setProducts([]); // Clear products on error
                setSelectedProductId('');
                 setTestConfigData(initialTestConfigurationFormData); // ADDED: Clear form data on error
            } finally {
                setIsLoading(false);
            }
        };
        fetchProducts();
    }, [selectedCategoryId, token]); // Depend on selectedCategoryId and token

    // ADDED: Handler for Test Name Change
    const handleNameChange = (name: string) => {
        setTestConfigData(prev => ({
            ...prev,
            name: name
        }));
    };

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

    // --- Handler for Saving Test Configuration ---
    const handleSaveConfiguration = async () => {
        if (!selectedProductId) {
            toast.error("Please select a product first.");
            return;
        }
        // ADDED: Check if the name field is empty
        if (!testConfigData.name.trim()) {
             toast.error("Please enter a Test Name."); // User-friendly notification
             return;
        }
         if (!token) {
             toast.error("Not authenticated. Please log in.");
             return;
         }
        // Add validation for persona/criteria fields if needed

        setIsSaving(true); // Use a separate loading state for saving
        try {
            // Make the API call to the new backend endpoint
            const response = await fetch("http://localhost:8000/test-configurations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: testConfigData.name, // ADDED: Include the test name in the payload
                    product_id: selectedProductId, // Use the selected product ID
                    visitorPersona: testConfigData.visitorPersona,
                    additionalCriteria: testConfigData.additionalCriteria,
                })
            });

            if (!response.ok) {
                const err = await response.json();
                // MODIFIED: Improve error message display
                throw new Error(err.detail || "Failed to save configuration");
            }

            const result = await response.json();
            toast.success("Test configuration saved successfully!");
            console.log("Saved Test Configuration Details:", result);

            // Reset form state after successful save
            // MODIFIED: Use initialTestConfigurationFormData to reset all fields including name
            setTestConfigData(initialTestConfigurationFormData);
             // Optionally reset selection or navigate elsewhere
             // setSelectedCategoryId('');
             // setSelectedProductId('');


        } catch (error: any) { // Use any for now, or define a proper error type
             console.error("Error saving configuration:", error);
             // MODIFIED: Display the error message string instead of the object
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
                <TestSetupHeader/>
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
                                <Select onValueChange={setSelectedProductId} value={selectedProductId} disabled={isLoading || products.length === 0 || !selectedCategoryId}> {/* Added !selectedCategoryId condition */}
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

                    {/* Test Configuration Form (Name, Persona, and Criteria) */}
                    {/* Render this only if a product is selected */}
                    {selectedProductId && (
                        <TestConfigurationForm
                            formData={testConfigData} // Pass the state containing name
                            onNameChange={handleNameChange} // Pass the new handler for name changes
                            onPersonaChange={handlePersonaChange}
                            onCriteriaChange={handleCriteriaChange}
                            isLoading={isLoading || isSaving} // Pass combined loading state
                        />
                    )}

                     {/* Save Configuration Button */}
                     {selectedProductId && (
                         <div className="flex justify-end mt-6">
                             <Button onClick={handleSaveConfiguration} disabled={isLoading || isSaving || !selectedProductId || !testConfigData.name.trim()}> {/* MODIFIED: Disable if name is empty */}
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