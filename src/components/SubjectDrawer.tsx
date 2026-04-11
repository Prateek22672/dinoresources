import { useState, useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { List, LayoutGrid, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ResourceCard from "./ResourceCard";
import { UserRole } from "@/hooks/useUserRole";

interface Resource {
  id: string;
  title: string;
  type: "pdf" | "youtube" | "link";
  url: string;
  created_at: string;
  created_by: string | null;
  category: string;
  unit_number: number | null;
}

interface SubjectDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  subjectName: string;
  userRole: UserRole | null;
  userId: string | null;
}

export default function SubjectDrawer({
  open,
  onOpenChange,
  subjectId,
  subjectName,
  userRole,
  userId,
}: SubjectDrawerProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("Syllabus");
  const [viewMode, setViewMode] = useState<"list" | "expanded">("list");

  useEffect(() => {
    if (open && subjectId) {
      loadResources();
    }
  }, [open, subjectId]);

  const loadResources = async () => {
    const { data, error } = await supabase
      .from("resources")
      .select("id, title, type, url, created_at, created_by, category, unit_number")
      .eq("subject_id", subjectId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load resources");
      return;
    }

    setResources(data || []);
  };

  const getResourcesByCategory = (category: string) => {
    return resources.filter((r) => r.category === category);
  };

  const getCategoryLabel = (category: string) => {
    if (category === "Previous Papers") return "Previous Year Questions";
    return category;
  };

  const selectedResources = getResourcesByCategory(selectedCategory);

  // Helper styles for navigation items to keep it clean
  const navItemBaseStyle = "w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-center justify-between text-sm sm:text-base border border-transparent";
  const navItemActiveStyle = "bg-white/10 text-white font-medium border-white/5 shadow-[inset_3px_0_0_0_#fff]";
  const navItemInactiveStyle = "text-zinc-400 hover:text-zinc-200 hover:bg-white/5";

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className="h-[92vh] max-h-[92vh] overflow-hidden bg-[#0a0a0c] border-t border-white/10 text-zinc-100 sm:rounded-t-[40px] shadow-2xl"
        style={{ touchAction: "manipulation" }}
        onTouchMove={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Premium Header */}
        <DrawerHeader className="relative border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-xl z-10 pb-4 pt-6">
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:bg-white/10 hover:text-white rounded-full h-10 w-10 transition-colors"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>

          <DrawerTitle className="text-xl sm:text-2xl font-bold tracking-tight text-center text-white">
            {subjectName}
          </DrawerTitle>
        </DrawerHeader>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden bg-[#0a0a0c]">

  {/* Horizontal Navigation */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/5 bg-[#0d0d10] p-3 md:p-4 flex-shrink-0">
            <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible scrollbar-none snap-x md:snap-none">

              {[
                "Syllabus",
                "Unit 1",
                "Unit 2",
                "Unit 3",
                "Unit 4",
                "Unit 5",
                "Previous Papers"
              ].map((category) => {
                const isActive = selectedCategory === category;
                const count = getResourcesByCategory(category).length;

                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`shrink-0 md:w-full text-left px-4 py-2 md:py-3 rounded-xl transition-all duration-200 flex items-center justify-between text-sm border snap-start ${
                      isActive
                        ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30 shadow-[inset_3px_0_0_0_#818cf8]"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`hidden md:flex w-6 h-6 rounded-md items-center justify-center text-xs font-bold ${
                        isActive ? "bg-indigo-500/20 text-indigo-400" : "bg-white/5 text-zinc-500"
                      }`}>
                        {category.includes("Unit") ? category.split(" ")[1] : ""}
                      </div>
                      {category}
                    </div>
                    
                  </button>
                );
              })}
            </nav>
          </div>
          

          {/* Right Panel - Resources */}
          <div
            className="flex-1 p-4 sm:p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent bg-[#0a0a0c]"
            style={{ touchAction: "pan-y" }}
          >
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
              <h3 className="text-2xl font-bold tracking-tight text-white">
                {getCategoryLabel(selectedCategory)}
              </h3>
              
              {/* Premium View Toggle Buttons */}
              <div className="flex gap-2 p-1 bg-[#121214] border border-white/5 rounded-full shadow-inner">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`rounded-full h-8 px-3 transition-all ${
                    viewMode === "list" 
                      ? "bg-white text-black hover:bg-zinc-200 shadow-sm" 
                      : "text-zinc-500 hover:text-white hover:bg-white/5"
                  }`}
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`rounded-full h-8 px-3 transition-all ${
                    viewMode === "expanded" 
                      ? "bg-white text-black hover:bg-zinc-200 shadow-sm" 
                      : "text-zinc-500 hover:text-white hover:bg-white/5"
                  }`}
                  onClick={() => setViewMode("expanded")}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {selectedResources.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 border border-dashed border-white/10 rounded-3xl bg-[#0e0e11]">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <LayoutGrid className="w-6 h-6 text-zinc-600" />
                </div>
                <h4 className="text-lg font-medium text-white mb-1">No resources yet</h4>
                <p className="text-sm text-zinc-500 text-center max-w-sm">
                  Resources for {getCategoryLabel(selectedCategory).toLowerCase()} will appear here once they are uploaded.
                </p>
              </div>
            ) : (
              <div
                className={
                  viewMode === "list" 
                    ? "space-y-4" 
                    : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                }
              >
                {selectedResources.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    viewMode={viewMode}
                    userRole={userRole}
                    userId={userId}
                    onUpdate={loadResources}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}