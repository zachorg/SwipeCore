import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FilterDefinition, FilterValue } from '@/hooks/useFilters';

interface FilterItemProps {
  definition: FilterDefinition;
  value?: FilterValue;
  isActive: boolean;
  onChange: (value: FilterValue) => void;
}

export function FilterItem({ definition, value, isActive, onChange }: FilterItemProps) {
  const { id, name, description, type, defaultValue, options, min, max, step, unit, placeholder, icon } = definition;
  
  // Get current value or default
  const currentValue = value !== undefined ? value : defaultValue;

  // Render different input types based on filter type
  const renderInput = () => {
    switch (type) {
      case 'boolean':
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

      case 'range':
        const minVal = min || 0;
        const maxVal = max || 100;
        const stepVal = step || 1;
        const unitVal = unit || '';
        
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-gray-800 font-medium">
                {name}
              </Label>
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
              <span>{minVal} {unitVal}</span>
              <span>{maxVal} {unitVal}</span>
            </div>
          </div>
        );

      case 'select':
        return (
          <div className="space-y-3">
            <Label className="text-gray-800 font-medium">
              {name}
            </Label>
            <Select
              value={String(currentValue || '')}
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

      case 'multiselect':
        const selectedValues = Array.isArray(currentValue) ? currentValue : [];

        // Debug logging for multiselect
        if (id === 'cuisine') {
          console.log('FilterItem rendering cuisine multiselect:', {
            id,
            name,
            options,
            currentValue,
            selectedValues,
            type
          });
        }

        return (
          <div className="space-y-4">
            <Label className="text-gray-800 font-medium">
              {name}
            </Label>
            <div className="grid grid-cols-1 gap-3 max-h-40 overflow-y-auto">
              {options?.map((option) => {
                const isSelected = selectedValues.includes(String(option.value));

                return (
                  <div key={option.value} className="flex items-center space-x-3">
                    <Checkbox
                      id={`${id}-${option.value}`}
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        let newValues;
                        if (checked) {
                          newValues = [...selectedValues, String(option.value)];
                        } else {
                          newValues = selectedValues.filter(v => v !== String(option.value));
                        }
                        onChange(newValues);
                      }}
                    />
                    <Label
                      htmlFor={`${id}-${option.value}`}
                      className="text-gray-700 text-sm cursor-pointer font-medium"
                    >
                      {option.label}
                    </Label>
                  </div>
                );
              })}
            </div>
            {selectedValues.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-3">
                {selectedValues.map((val) => {
                  const option = options?.find(o => String(o.value) === val);
                  return (
                    <Button
                      key={val}
                      variant="outline"
                      size="sm"
                      className="h-7 px-3 text-xs bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 shadow-sm"
                      onClick={() => {
                        const newValues = selectedValues.filter(v => v !== val);
                        onChange(newValues);
                      }}
                    >
                      {option?.label || val} ×
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'keyword':
        return (
          <div className="space-y-3">
            <Label className="text-gray-800 font-medium">
              {name}
            </Label>
            <Input
              type="text"
              placeholder={placeholder || `Enter ${name.toLowerCase()}`}
              value={String(currentValue || '')}
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
    <div className="space-y-3 p-4 rounded-xl bg-gray-50/80 backdrop-blur-sm border border-gray-200 shadow-sm">
      {/* Filter icon and description */}
      {(icon || description) && (
        <div className="flex items-start gap-3 mb-3">
          {icon && (
            <span className="text-xl text-gray-600">{icon}</span>
          )}
          <div className="flex-1">
            {description && (
              <p className="text-gray-600 text-sm leading-relaxed">
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
        <div className="flex items-center gap-2 pt-2">
          <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
          <span className="text-green-600 text-sm font-medium">Active</span>
        </div>
      )}
    </div>
  );
}
