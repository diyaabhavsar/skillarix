
import { SidebarHeader as Header } from "@/components/ui/sidebar";
import { AspectRatio } from "@/components/ui/aspect-ratio";

const SidebarHeader = () => {
  return (
    <Header className="flex items-center justify-center py-4">
      <div className="w-full max-w-[160px] px-4 animate-fade-in">
        <AspectRatio ratio={3 / 1}>
          <div className="flex items-center justify-center h-full w-full">
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Skillarix
            </h1>
          </div>
        </AspectRatio>
      </div>
    </Header>
  );
};

export default SidebarHeader;
