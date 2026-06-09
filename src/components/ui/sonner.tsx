import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",

          success:
            "group-[.toaster]:bg-green-50 group-[.toaster]:text-green-700 group-[.toaster]:border-green-200 dark:group-[.toaster]:bg-green-900 dark:group-[.toaster]:text-green-50 dark:group-[.toaster]:border-green-500",

          error:
            "group-[.toaster]:bg-red-50 group-[.toaster]:text-red-700 group-[.toaster]:border-red-200 dark:group-[.toaster]:bg-red-900 dark:group-[.toaster]:text-red-50 dark:group-[.toaster]:border-red-500",

          warning:
            "group-[.toaster]:bg-amber-50 group-[.toaster]:text-amber-700 group-[.toaster]:border-amber-200 dark:group-[.toaster]:bg-amber-900 dark:group-[.toaster]:text-amber-50 dark:group-[.toaster]:border-amber-500",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };