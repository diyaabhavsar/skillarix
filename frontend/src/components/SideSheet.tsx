import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ReactNode } from "react";

interface SideSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  trigger?: ReactNode;
  side?: "left" | "right" | "top" | "bottom";
  className?: string;
}

const SideSheet: React.FC<SideSheetProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  trigger,
  side = "right",
  className = "w-full max-w-md sm:max-w-lg md:max-w-xl h-screen overflow-y-auto flex flex-col",
}) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
    <SheetContent side={side} className={className}>
      {(title || description) && (
        <SheetHeader>
          {title && <SheetTitle>{title}</SheetTitle>}
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
      )}
      {children}
      {footer && <SheetFooter className="mt-auto flex gap-2">{footer}</SheetFooter>}
    </SheetContent>
  </Sheet>
);

export default SideSheet;