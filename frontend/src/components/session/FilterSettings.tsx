
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { SlidersHorizontal } from "lucide-react";
import { FilterSettings } from "@/types/session";

interface FilterSettingsProps {
  filterSettings: FilterSettings;
  handleFilterChange: (key: keyof FilterSettings, value: any) => void;
  toggleFocusArea: (area: string) => void;
  resetFilters: () => void;
}

const FilterSettingsComponent = ({ 
  filterSettings, 
  handleFilterChange, 
  toggleFocusArea,
  resetFilters
}: FilterSettingsProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filters</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Advanced Settings</h4>
          
          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty Level</Label>
            <Select 
              value={filterSettings.difficultyLevel}
              onValueChange={(value) => handleFilterChange('difficultyLevel', value)}
            >
              <SelectTrigger id="difficulty">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="persona">Customer Persona</Label>
            <Select 
              value={filterSettings.customerPersona}
              onValueChange={(value) => handleFilterChange('customerPersona', value)}
            >
              <SelectTrigger id="persona">
                <SelectValue placeholder="Select persona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technical">Technical Decision Maker</SelectItem>
                <SelectItem value="business">Business Executive</SelectItem>
                <SelectItem value="end-user">End User</SelectItem>
                <SelectItem value="skeptical">Skeptical Buyer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Focus Areas</Label>
            <div className="grid grid-cols-2 gap-2">
              {['features', 'benefits', 'pricing', 'security', 'implementation', 'support', 'comparisons'].map((area) => (
                <div key={area} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`focus-${area}`} 
                    checked={filterSettings.focusAreas.includes(area)}
                    onCheckedChange={() => toggleFocusArea(area)}
                  />
                  <Label htmlFor={`focus-${area}`} className="capitalize text-sm">
                    {area}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="questionCount">Number of Questions: {filterSettings.questionCount}</Label>
            </div>
            <Slider
              id="questionCount"
              min={4}
              max={12}
              step={1}
              value={[filterSettings.questionCount]}
              onValueChange={(value) => handleFilterChange('questionCount', value[0])}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>4</span>
              <span>8</span>
              <span>12</span>
            </div>
          </div>
          
          <Button 
            className="w-full" 
            variant="outline" 
            size="sm"
            onClick={resetFilters}
          >
            Reset to Default
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FilterSettingsComponent;
