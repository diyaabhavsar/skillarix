import React from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from '@/components/ui/checkbox'; // Need Checkbox here
import { Label } from '@/components/ui/label';
// import { Button } from '@/components/ui/button'; // Added Button for potential future use or Cancel

// Define interfaces for persona and criteria data structure
interface VisitorPersona {
    background: string;
    pain_points: string;
    goals: string;
    technical_knowledge: string;
    budget_sensitivity: string;
    decision_authority: string;
    previous_experience: string;
}

interface AdditionalCriteria {
    distraction_handling: boolean;
    communication_simplicity: boolean;
}

// Define the shape of the form data state managed by the parent
export interface TestConfigurationFormData {
    name: string; // ADDED: Name field
    visitorPersona: VisitorPersona;
    additionalCriteria: AdditionalCriteria;
}

// Define the props for this component
export interface TestConfigurationFormProps {
    // State for the form data (now includes name)
    formData: TestConfigurationFormData; // Use the updated interface
    // Handlers to update the parent state
    onNameChange: (name: string) => void; // ADDED: Handler for name change
    onPersonaChange: (field: keyof VisitorPersona, value: string) => void;
    onCriteriaChange: (field: keyof AdditionalCriteria, checked: boolean) => void;
    isLoading: boolean; // To disable inputs while loading
    // onSaveConfiguration is likely handled by the parent button
}

const TestConfigurationForm: React.FC<TestConfigurationFormProps> = ({
    formData,
    onNameChange, // ADDED: Destructure the new prop
    onPersonaChange,
    onCriteriaChange,
    isLoading,
    // onSaveConfiguration
}) => {
    return (
        <div className="grid gap-6">
            {/* ADDED: Test Name Field */}
            <div className="grid gap-2">
                <Label htmlFor="test-name" className="text-sm font-medium">
                    Test Name <span className="text-red-500">*</span> {/* Indicate compulsory */}
                </Label>
                <Input
                    id="test-name"
                    value={formData.name} // Bind value to parent state
                    onChange={e => onNameChange(e.target.value)} // Call parent handler on change
                    disabled={isLoading}
                    required // HTML required attribute (for basic browser validation)
                    placeholder="Enter a name for this test scenario" // Added placeholder
                />
            </div>
            {/* End Test Name Field */}

            {/* Visitor Persona Section */}
            <div>
                <div className="text-lg font-medium mb-4">Visitor Persona</div>
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Example mapping over expected persona fields */}
                    {Object.entries(formData.visitorPersona).map(([key, value]) => (
                        <div className="grid gap-2" key={key}>
                            <Label className="text-sm font-medium">
                                {/* Format key for display */}
                                {key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                            </Label>
                            {/* Using select for dropdowns */}
                            <select
                                className="border rounded px-3 py-2" // Basic styling, use your component library's styles if available
                                value={String(value)}
                                onChange={e => onPersonaChange(key as keyof VisitorPersona, e.target.value)}
                                disabled={isLoading}
                            >
                                <option value="">Select {key.replace(/_/g, " ")}</option>
                                {/* Options based on your previous implementation */}
                                {key === "background" && <>
                                    <option value="tech">Tech Professional</option>
                                    <option value="non-tech">Non-Technical</option>
                                    <option value="student">Student</option>
                                </>}
                                {key === "pain_points" && <>
                                    <option value="cost">High Cost</option>
                                    <option value="complexity">Complexity</option>
                                    <option value="support">Lack of Support</option>
                                </>}
                                {key === "goals" && <>
                                    <option value="efficiency">Increase Efficiency</option>
                                    <option value="growth">Business Growth</option>
                                    <option value="learning">Learning/Adoption</option>
                                </>}
                                {key === "technical_knowledge" && <>
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </>}
                                {key === "budget_sensitivity" && <>
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </>}
                                {key === "decision_authority" && <>
                                    <option value="final">Final Decision Maker</option>
                                    <option value="influencer">Influencer</option>
                                    <option value="none">No Authority</option>
                                </>}
                                {key === "previous_experience" && <>
                                    <option value="extensive">Extensive</option>
                                    <option value="some">Some</option>
                                    <option value="none">None</option>
                                </>}
                            </select>
                        </div>
                    ))}
                </div>
            </div>

            {/* Additional Criteria Section */}
            <div>
                <div className="text-lg font-medium mb-4">Additional Criteria (for Salesperson Evaluation)</div>
                <div className="grid gap-2 md:grid-cols-2">
                    <Label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                            checked={formData.additionalCriteria.distraction_handling}
                            onCheckedChange={(checked) => onCriteriaChange("distraction_handling", Boolean(checked))}
                            disabled={isLoading}
                        />
                        Distraction Handling
                    </Label>
                    <Label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                            checked={formData.additionalCriteria.communication_simplicity}
                            onCheckedChange={(checked) => onCriteriaChange("communication_simplicity", Boolean(checked))}
                            disabled={isLoading}
                        />
                        Communication Simplicity
                    </Label>
                </div>
            </div>

             {/* Optional: Add a button to save/use the configuration */}
             {/*
             <div className="flex justify-end mt-6">
                 <Button onClick={onSaveConfiguration} disabled={isLoading}>
                     Save Test Configuration
                 </Button>
             </div>
             */}
        </div>
    );
};

export default TestConfigurationForm;