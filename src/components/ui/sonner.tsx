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
            "group toast group-[.toaster]:bg-[#141416]/95 group-[.toaster]:text-zinc-100 group-[.toaster]:border group-[.toaster]:border-white/10 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl group-[.toaster]:backdrop-blur-xl group-[.toaster]:py-3.5 group-[.toaster]:px-4",
          title: "group-[.toast]:text-zinc-100 group-[.toast]:font-medium",
          description: "group-[.toast]:text-zinc-400",
          actionButton: "group-[.toast]:bg-white group-[.toast]:text-black group-[.toast]:rounded-full group-[.toast]:font-semibold",
          cancelButton: "group-[.toast]:bg-white/10 group-[.toast]:text-zinc-300 group-[.toast]:rounded-full",
          success: "group-[.toaster]:[&_[data-icon]]:text-emerald-400",
          error: "group-[.toaster]:[&_[data-icon]]:text-red-400",
          info: "group-[.toaster]:[&_[data-icon]]:text-[#a9a0f5]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
