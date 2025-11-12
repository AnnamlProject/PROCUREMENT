
import { useLookups } from "@/api/hooks/useLookups";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Control } from "react-hook-form";

interface TaxSelectProps {
  control: Control<any>;
  name: string;
  label: string;
  disabled?: boolean;
}

export function TaxSelect({ control, name, label, disabled }: TaxSelectProps) {
  const { data: lookups, isLoading } = useLookups();
  const taxes = lookups?.taxes ?? [];

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
            value={field.value}
            disabled={disabled || isLoading}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Pajak" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {taxes.map((tax) => (
                <SelectItem key={tax.id} value={tax.id}>
                  {tax.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
