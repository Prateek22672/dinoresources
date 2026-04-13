import { Button } from "@/components/ui/button";
import { BookPlus, Upload, BookOpen, Layers, ChevronRight } from "lucide-react";
import genai from "@/assets/aiWhite.png";

interface SubjectGridProps {
  activeTab: string;
  isContributor: boolean;
  searchQuery: string;
  filteredSubjects: any[];
  setIsAddSubjectDialogOpen: (val: boolean) => void;
  setIsUploadDialogOpen: (val: boolean) => void;
  handleSubjectClick: (subject: any) => void;
}

// Smart helper function to map subject names to high-quality, relevant images
const getSubjectImage = (name: string) => {
  const lowerName = name.toLowerCase();
  
  // AI / Deep Learning / Neural Networks / NLP
  if (lowerName.includes('artificial') || lowerName.includes('ai') || lowerName.includes('neural') || lowerName.includes('deep') || lowerName.includes('nlp') || lowerName.includes('language')) {
    return "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800";
  }
  // Cyber Security / Cryptography / Forensics / Info Sec
  if (lowerName.includes('security') || lowerName.includes('cryptography') || lowerName.includes('forensics') || lowerName.includes('cyber')) {
    return "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800";
  }
  // Web Dev / Frameworks / Compilers / Programming
  if (lowerName.includes('web') || lowerName.includes('framework') || lowerName.includes('programming') || lowerName.includes('compiler')) {
    return "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800";
  }
  // Data Analytics / Visualization
  if (lowerName.includes('data') || lowerName.includes('analytics') || lowerName.includes('visualization')) {
    return "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800";
  }
  // Agile / Software Engineering / OOSE / Design Patterns
  if (lowerName.includes('agile') || lowerName.includes('software') || lowerName.includes('oose') || lowerName.includes('pattern')) {
    return "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=800";
  }
  
  // Premium Fallback tech images for unmatched subjects
  const fallbacks = [
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&q=80&w=800"
  ];
  
  // Deterministic fallback based on name length so the same subject always gets the same image
  return fallbacks[name.length % fallbacks.length];
};

export function SubjectGrid({
  activeTab,
  isContributor,
  searchQuery,
  filteredSubjects,
  setIsAddSubjectDialogOpen,
  setIsUploadDialogOpen,
  handleSubjectClick
}: SubjectGridProps) {
  
  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-6 relative z-10">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-2 flex items-center gap-2">
            {activeTab === "ai_subjects" ? <><img src={genai} alt="AI" className="w-6 h-6" /> Study with AI</> : "Your Subjects"}
          </h2>
          <p className="text-zinc-400 font-medium">
            {activeTab === "ai_subjects"
              ? "Select a module to launch your AI study assistant."
              : "Select a module to view your study materials."}
          </p>
        </div>

        {isContributor && activeTab === "subjects" && (
          <div className="flex gap-3 w-full sm:w-auto">
            <Button onClick={() => setIsAddSubjectDialogOpen(true)} variant="outline" className="flex-1 sm:flex-none bg-transparent border-white/10 text-white hover:bg-white hover:text-black rounded-full">
              <BookPlus className="w-4 h-4 mr-2" /> Add Subject
            </Button>
            <Button onClick={() => setIsUploadDialogOpen(true)} className="flex-1 sm:flex-none bg-white text-black hover:bg-zinc-200 rounded-full">
              <Upload className="w-4 h-4 mr-2" /> Upload Resource
            </Button>
          </div>
        )}
      </div>

      {filteredSubjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 border border-dashed border-white/10 rounded-3xl bg-[#0a0a0c] relative z-10">
          {activeTab === "ai_subjects" ? (
            <img src={genai} alt="AI" className="w-12 h-12 opacity-30 mb-4" />
          ) : (
            <BookOpen className="w-12 h-12 text-zinc-700 mb-4" />
          )}
          <p className="text-zinc-400 font-medium text-center">
            {searchQuery ? `No subjects found matching "${searchQuery}"` : "No subjects found for this semester."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSubjects.map((subject, index) => (
            <div
              key={subject.id}
              onClick={() => handleSubjectClick(subject)}
              className="group aspect-square sm:aspect-auto sm:h-[280px] rounded-[28px] border border-white/5 p-6 flex flex-col justify-between cursor-pointer transition-all duration-500 hover:border-white/20 hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.1)] hover:-translate-y-1.5 relative overflow-hidden bg-[#121214] animate-in fade-in slide-in-from-bottom-8 fill-mode-both"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Dynamic Image Background - Removed grayscale, increased opacity, added blend mode */}
              <div
                className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-50 mix-blend-screen transition-all duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url(${getSubjectImage(subject.name)})` }}
              />
              
              {/* Refined Gradient Overlay to ensure text readability against colored images */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-[#09090b]/20" />

              <div className="relative z-10 flex justify-start">
                {activeTab === "ai_subjects" ? (
                  <span className="px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 shadow-sm backdrop-blur-md">
                    <img src={genai} alt="AI" className="w-3 h-3" /> AI Personalized
                  </span>
                ) : (
                  <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-zinc-200 text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 shadow-sm backdrop-blur-md">
                    <Layers className="w-3 h-3" /> Standard
                  </span>
                )}
              </div>

              <div className="relative z-10 mt-auto pt-8">
                <h3 className="text-xl font-bold text-white leading-tight mb-3 line-clamp-3 drop-shadow-md">
                  {subject.name}
                </h3>
                <div className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-zinc-400 group-hover:text-white transition-colors">
                  {activeTab === "ai_subjects" ? "Launch Tutor" : "View Resources"}
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}