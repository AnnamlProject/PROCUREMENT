
// FIX: Import React to provide the 'React' namespace for types like React.ChangeEvent.
import React from "react";
import { Input } from "@/components/ui/input";
import { ControllerRenderProps } from "react-hook-form";

interface CurrencyInputProps {
    field: ControllerRenderProps<any, any>;
    disabled?: boolean;
}

export const CurrencyInput = ({ field, disabled }: CurrencyInputProps) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const numberValue = Number(value.replace(/[^0-9]/g, ''));
        field.onChange(numberValue);
    };

    const formattedValue = new Intl.NumberFormat('id-ID').format(field.value || 0);

    return (
        <Input
            {...field}
            onChange={handleChange}
            value={formattedValue}
            disabled={disabled}
            onFocus={(e) => e.target.select()}
        />
    );
};