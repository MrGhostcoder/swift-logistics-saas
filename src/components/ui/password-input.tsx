import { forwardRef, useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const PasswordInput = forwardRef<HTMLInputElement, Omit<ComponentProps<"input">, "type">>(
  ({ className, disabled, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const label = visible ? "Hide password" : "Show password";
    return (
      <div className={cn("relative", className)}>
        <Input {...props} ref={ref} disabled={disabled} type={visible ? "text" : "password"} className="pr-11" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 text-muted-foreground"
          aria-label={label}
          aria-pressed={visible}
          aria-controls={props.id}
          title={label}
          disabled={disabled}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </Button>
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";