import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterDefinition, FilterValue } from "@/hooks/useFilters";
import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";

interface FilterItemProps {
  definition: FilterDefinition;
  value?: FilterValue;
  isActive: boolean;
  onChange: (value: FilterValue) => void;
}

export function FilterItem({
  definition,
  value,
  isActive,
  onChange,
}: FilterItemProps) {
  const {
    id,
    name,
    description,
    type,
    defaultValue,
    options,
    min,
    max,
    step,
    unit,
    placeholder,
    icon,
  } = definition;

  // Get current value or default
  const currentValue = value !== undefined ? value : defaultValue;

  // Render different input types based on filter type
  const renderInput = () => {
    switch (type) {
      case "boolean":
        return (
          <div className="flex items-center space-x-3">
            <Switch
              id={id}
              checked={Boolean(currentValue)}
              onCheckedChange={(checked) => onChange(checked)}
            />
            <Label
              htmlFor={id}
              className="text-gray-800 font-medium cursor-pointer"
            >
              {name}
            </Label>
          </div>
        );

      case "range":
        const minVal = min || 0;
        const maxVal = max || 100;
        const stepVal = step || 1;
        const unitVal = unit || "";

        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-gray-800 font-medium">{name}</Label>
              <span className="text-gray-700 text-sm font-medium bg-gray-100 px-2 py-1 rounded-lg border border-gray-200">
                {currentValue || minVal} {unitVal}
              </span>
            </div>
            <Slider
              value={[Number(currentValue) || minVal]}
              onValueChange={(values) => onChange(values[0])}
              min={minVal}
              max={maxVal}
              step={stepVal}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>
                {minVal} {unitVal}
              </span>
              <span>
                {maxVal} {unitVal}
              </span>
            </div>
          </div>
        );

      case "select":
        return (
          <div className="space-y-3">
            <Label className="text-gray-800 font-medium">{name}</Label>
            <Select
              value={String(currentValue || "")}
              onValueChange={(value) => onChange(value)}
            >
              <SelectTrigger className="bg-white border-gray-300 text-gray-800 shadow-sm hover:border-gray-400">
                <SelectValue placeholder={`Select ${name.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 shadow-lg">
                {options?.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={String(option.value)}
                    className="text-gray-800 hover:bg-gray-100 focus:bg-gray-100"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "multiselect":
        const selectedValues = Array.isArray(currentValue) ? currentValue : [];
        const [searchTerm, setSearchTerm] = useState("");

        // Filter options based on search term
        const filteredOptions = useMemo(() => {
          if (!searchTerm.trim()) return options;
          return (
            options?.filter((option) =>
              option.label.toLowerCase().includes(searchTerm.toLowerCase())
            ) || []
          );
        }, [options, searchTerm]);

        return (
          <div className="space-y-3">
            <Label className="text-gray-800 font-medium">{name}</Label>

            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder={`Search ${name.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-8 bg-white border-gray-300 text-gray-800 placeholder:text-gray-500 shadow-sm hover:border-gray-400 focus:border-gray-500"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>

            {/* Scrollable list box */}
            <div className="border border-gray-300 rounded-lg bg-white">
              <div className="max-h-40 overflow-y-auto p-1.5">
                {filteredOptions.length === 0 ? (
                  <div className="text-center py-3 text-gray-500 text-xs">
                    No {name.toLowerCase()} found matching "{searchTerm}"
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {filteredOptions.map((option) => {
                      const isSelected = selectedValues.includes(
                        String(option.value)
                      );

                      return (
                        <div
                          key={option.value}
                          className={`flex items-center space-x-2 p-1.5 rounded-md cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-blue-50 border border-blue-200"
                              : "hover:bg-gray-50"
                          }`}
                          onClick={() => {
                            let newValues;
                            if (isSelected) {
                              newValues = selectedValues.filter(
                                (v) => v !== String(option.value)
                              );
                            } else {
                              newValues = [
                                ...selectedValues,
                                String(option.value),
                              ];
                            }
                            onChange(newValues);
                          }}
                        >
                          <Checkbox
                            id={`${id}-${option.value}`}
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              let newValues;
                              if (checked) {
                                newValues = [
                                  ...selectedValues,
                                  String(option.value),
                                ];
                              } else {
                                newValues = selectedValues.filter(
                                  (v) => v !== String(option.value)
                                );
                              }
                              onChange(newValues);
                            }}
                            className="flex-shrink-0"
                          />
                          <Label
                            htmlFor={`${id}-${option.value}`}
                            className="text-gray-700 text-xs cursor-pointer font-medium flex-1"
                          >
                            {option.label}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Selected items display */}
            {selectedValues.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700">
                    Selected ({selectedValues.length}):
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => onChange([])}
                  >
                    Clear All
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedValues.map((val) => {
                    const option = options?.find(
                      (o) => String(o.value) === val
                    );
                    return (
                      <Button
                        key={val}
                        variant="outline"
                        size="sm"
                        className="h-5 px-1.5 text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
                        onClick={() => {
                          const newValues = selectedValues.filter(
                            (v) => v !== val
                          );
                          onChange(newValues);
                        }}
                      >
                        {option?.label || val}
                        <span className="ml-1 text-blue-500">×</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );

      case "keyword":
        return (
          <div className="space-y-3">
            <Label className="text-gray-800 font-medium">{name}</Label>
            <Input
              type="text"
              placeholder={placeholder || `Enter ${name.toLowerCase()}`}
              value={String(currentValue || "")}
              onChange={(e) => onChange(e.target.value)}
              className="bg-white border-gray-300 text-gray-800 placeholder:text-gray-500 shadow-sm hover:border-gray-400 focus:border-gray-500"
            />
          </div>
        );

      default:
        return (
          <div className="text-white/60 text-sm">
            Unsupported filter type: {type}
          </div>
        );
    }
  };

  return (
    <div className="space-y-3 p-3 rounded-lg bg-gray-50/60 backdrop-blur-sm border border-gray-200/50">
      {/* Filter icon and description */}
      {(icon || description) && (
        <div className="flex items-start gap-2 mb-2">
          {icon && <span className="text-lg text-gray-600">{icon}</span>}
          <div className="flex-1">
            {description && (
              <p className="text-gray-600 text-xs leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Filter input */}
      {renderInput()}

      {/* Active indicator */}
      {isActive && (
        <div className="flex items-center gap-1.5 pt-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-green-600 text-xs font-medium">Active</span>
        </div>
      )}
    </div>
  );
}
