
import * as React from "react"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"

// A custom Command implementation that doesn't rely on Radix UI or cmdk
// to avoid external dependencies for this specific project setup.

interface CommandContextValue {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
}

const CommandContext = React.createContext<CommandContextValue | null>(null);

const useCommand = () => {
    const context = React.useContext(CommandContext);
    if (!context) {
        throw new Error("useCommand must be used within a Command component");
    }
    return context;
}

const Command = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        const [searchTerm, setSearchTerm] = React.useState('');

        return (
            <CommandContext.Provider value={{ searchTerm, setSearchTerm }}>
                <div
                    ref={ref}
                    className={cn(
                        "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
                        className
                    )}
                    {...props}
                />
            </CommandContext.Provider>
        );
    }
);
Command.displayName = "Command";

const CommandInput = React.forwardRef<
    HTMLInputElement,
    React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
    const { setSearchTerm } = useCommand();
    return (
        <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
                ref={ref}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(
                    "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                {...props}
            />
        </div>
    );
});
CommandInput.displayName = "CommandInput";

const CommandList = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
        {...props}
    />
));
CommandList.displayName = "CommandList";

const CommandEmpty = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    (props, ref) => {
        const { searchTerm } = useCommand();
        // This is a simplified version. A real one would check against actual filtered results.
        // For this implementation, we assume if there's search term, something might not be found.
        // This component will be shown/hidden by the parent logic.
        return <div ref={ref} className="py-6 text-center text-sm" {...props} />;
    }
);
CommandEmpty.displayName = "CommandEmpty";

const CommandGroup = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { heading?: string }
>(({ className, heading, children, ...props }, ref) => {
     const { searchTerm } = useCommand();
     
     const filteredChildren = React.Children.map(children, (child) => {
        // FIX: Provide a generic to `isValidElement` to help TypeScript infer the props type, resolving the error when accessing `child.props.value`.
        if (React.isValidElement<{ value?: string }>(child) && typeof child.props.value === 'string') {
            if (child.props.value.toLowerCase().includes(searchTerm.toLowerCase())) {
                 return child;
            }
            return null;
        }
        return child;
     });

     const hasVisibleChildren = React.Children.count(filteredChildren) > 0;

     if (!hasVisibleChildren) {
        return null;
     }

    return (
        <div
            ref={ref}
            className={cn("overflow-hidden p-1 text-foreground", className)}
            {...props}
        >
            {heading && <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{heading}</div>}
            {filteredChildren}
        </div>
    )
});
CommandGroup.displayName = "CommandGroup";


const CommandItem = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { onSelect?: (value: string) => void; value?: any }
>(({ className, onSelect, value, ...props }, ref) => (
    <div
        ref={ref}
        onClick={() => onSelect?.(value)}
        className={cn(
            "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
            className
        )}
        {...props}
    />
));
CommandItem.displayName = "CommandItem";


export {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
};