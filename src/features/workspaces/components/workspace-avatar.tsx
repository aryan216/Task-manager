import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface WorkspaceAvatarProps {
    image?: string;
    name: string;
    className?: string;
}

export const WorkspaceAvatar = ({
    image,
    name,
    className,
}: WorkspaceAvatarProps) => {
    if (image) {
        return (
            <div
                className={cn(
                    " size-10 relative rounded-md overflow-hidden",
                    className
                )}
            >
                <img src={image} alt={name} className="absolute inset-0 h-full w-full object-cover" />
            </div>
        );
    }

    return (
        <Avatar className={cn(" size-10 rounded-md", className)}>
            <AvatarFallback className="rounded-md bg-foreground text-xs font-medium uppercase text-background">
                {name[0]}
            </AvatarFallback>
        </Avatar>
    );
};
