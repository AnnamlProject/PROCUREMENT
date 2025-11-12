
import * as React from "react"

import { cn } from "@/lib/utils"

// A custom Popover implementation that doesn't rely on Radix UI
// to avoid external dependencies for this specific project setup.

interface PopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface PopoverContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null);

const usePopover = () => {
  const context = React.useContext(PopoverContext);
  if (!context) {
    throw new Error("usePopover must be used within a Popover");
  }
  return context;
};

const Popover: React.FC<PopoverProps> = ({ open: controlledOpen, onOpenChange: setControlledOpen, children }) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = setControlledOpen ?? setUncontrolledOpen;

  React.useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (open && triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        const popoverContent = document.querySelector('[data-popover-content]');
        if (popoverContent && !popoverContent.contains(event.target as Node)) {
           setOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [open, setOpen]);


  const contextValue = {
    open,
    onOpenChange: setOpen,
    triggerRef,
  };

  return (
    <PopoverContext.Provider value={contextValue}>
      <div className="relative inline-block">{children}</div>
    </PopoverContext.Provider>
  );
};

const PopoverTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ children, asChild = false, onClick, ...props }, ref) => {
  const { open, onOpenChange, triggerRef } = usePopover();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onOpenChange(!open);
    onClick?.(e);
  };
  
  const child = React.Children.only(children) as React.ReactElement;

  if (asChild) {
      // FIX: Cast child to React.ReactElement<any> to allow 'ref' prop to be passed via cloneElement, resolving a TypeScript type inference issue.
      return React.cloneElement(child as React.ReactElement<any>, {
        ref: (node: HTMLButtonElement) => {
            triggerRef.current = node;
            // Handle external ref passed to PopoverTrigger
            if (typeof ref === 'function') {
                ref(node);
            } else if (ref) {
                ref.current = node;
            }
        },
        onClick: handleClick,
        ...props,
      });
  }

  return (
    <button ref={triggerRef} onClick={handleClick} {...props}>
      {children}
    </button>
  );
});
PopoverTrigger.displayName = "PopoverTrigger";

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
    align?: 'start' | 'center' | 'end';
}

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, align = 'center', ...props }, ref) => {
    const { open } = usePopover();
    
    if (!open) return null;

    const alignClasses = {
        start: 'left-0',
        center: 'left-1/2 -translate-x-1/2',
        end: 'right-0'
    }

    return (
      <div
        ref={ref}
        data-popover-content
        className={cn(
          "absolute z-50 mt-2 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          alignClasses[align],
          className
        )}
        {...props}
      />
    );
  }
);
PopoverContent.displayName = "PopoverContent";

export { Popover, PopoverTrigger, PopoverContent };