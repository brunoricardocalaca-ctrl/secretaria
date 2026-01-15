import * as React from "react"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"

export interface ExpandableTextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    compactHeight?: string
    expandedHeight?: string
}

const ExpandableTextarea = React.forwardRef<HTMLTextAreaElement, ExpandableTextareaProps>(
    ({ className, compactHeight = "min-h-[60px]", expandedHeight = "min-h-[200px]", ...props }, ref) => {
        const [isFocused, setIsFocused] = React.useState(false)
        const [hasContent, setHasContent] = React.useState(false)

        // Update hasContent when value changes
        React.useEffect(() => {
            if (props.value && props.value.toString().length > 0) {
                setHasContent(true)
            } else {
                setHasContent(false)
            }
        }, [props.value])

        return (
            <div className="relative w-full transition-all duration-300 ease-in-out">
                <Textarea
                    ref={ref}
                    className={cn(
                        "transition-all duration-300 ease-in-out resize-none",
                        isFocused ? "overflow-y-auto" : "overflow-hidden",
                        isFocused ? expandedHeight : compactHeight,
                        // If it has content but not focused, maybe show a bit more than empty? 
                        // For now let's keep it simple: focus = big, blur = small (unless we want to read it)
                        // Let's actually make it: if focused -> big. If not focused -> small.
                        // If user wants to read, they click it.
                        className
                    )}
                    onFocus={(e) => {
                        setIsFocused(true)
                        props.onFocus?.(e)
                    }}
                    onBlur={(e) => {
                        setIsFocused(false)
                        props.onBlur?.(e)
                    }}
                    {...props}
                />
                {!isFocused && !hasContent && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        {/* Optional: Add an icon or cue if needed, but placeholder usually suffices */}
                    </div>
                )}
            </div>
        )
    }
)
ExpandableTextarea.displayName = "ExpandableTextarea"

export { ExpandableTextarea }
