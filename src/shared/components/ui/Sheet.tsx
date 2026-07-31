import * as React from "react"
import { X } from "lucide-react"
import { cn } from "../../utils/cn"

const Sheet = ({ children, open, onOpenChange }: { children: React.ReactNode, open: boolean, onOpenChange: (open: boolean) => void }) => {
  if (!open) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        onClick={() => onOpenChange(false)}
      />
      <div className={cn(
        "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out inset-y-0 right-0 h-full w-full border-l border-border sm:max-w-2xl",
        "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right flex flex-col"
      )}>
        {children}
      </div>
    </>
  );
}

const SheetClose = ({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) => {
  return (
    <button onClick={onClick} className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
      {children}
      <span className="sr-only">Close</span>
    </button>
  )
}

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left shrink-0",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = "SheetTitle"

const SheetContent = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <div className={cn("flex-1 overflow-y-auto mt-4 pr-2", className)}>
    {children}
  </div>
)

export {
  Sheet,
  SheetClose,
  SheetHeader,
  SheetTitle,
  SheetContent
}
