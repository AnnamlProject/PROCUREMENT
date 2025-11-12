
import * as React from "react"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: number[],
    onValueChange?: (value: number[]) => void,
    min?: number,
    max?: number,
    step?: number,
    disabled?: boolean
  }
>(({ className, value = [0], onValueChange, min = 0, max = 100, step = 1, disabled, ...props }, ref) => {
  const [internalValue, setInternalValue] = React.useState(value);
  const trackRef = React.useRef<HTMLDivElement>(null);
  
  const currentValue = value ?? internalValue;

  const handleChange = (newValue: number) => {
    const clampedValue = Math.max(min, Math.min(newValue, max));
    const steppedValue = Math.round(clampedValue / step) * step;
    
    setInternalValue([steppedValue]);
    onValueChange?.([steppedValue]);
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!trackRef.current) return;
    const trackRect = trackRef.current.getBoundingClientRect();
    const percent = (event.clientX - trackRect.left) / trackRect.width;
    handleChange(percent * (max - min) + min);
  };
  
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    if (disabled) return;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    handleMouseMove(event.nativeEvent);
  };
  
  const percentage = ((currentValue[0] - min) / (max - min)) * 100;

  return (
    <div
      ref={ref}
      className={cn("relative flex w-full touch-none select-none items-center", disabled && "opacity-50", className)}
      {...props}
    >
        <div ref={trackRef} onMouseDown={handleMouseDown} className="relative h-2 w-full grow cursor-pointer overflow-hidden rounded-full bg-secondary">
            <div className="absolute h-full bg-primary" style={{ width: `${percentage}%` }}/>
        </div>
        <div 
         className="absolute block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
         style={{ left: `calc(${percentage}% - 10px)`}}
        />
    </div>
  )
})
Slider.displayName = "Slider"

export { Slider }
