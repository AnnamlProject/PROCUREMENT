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

interface WithholdingSelectProps {
  control: Control<any>;
  name: string;
  label: string;
  disabled?: boolean;
}

export function WithholdingSelect({ control, name, label, disabled }: WithholdingSelectProps) {
  const { data: lookups, isLoading } = useLookups();
  const withholdings = lookups?.withholdings ?? [];

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
                <SelectValue placeholder="Pilih PPh..." />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="">Tidak ada</SelectItem>
              {withholdings.map((wh) => (
                <SelectItem key={wh.id} value={wh.id}>
                  {wh.name}
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
