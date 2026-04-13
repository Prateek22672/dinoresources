import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AddAnnouncementDialog } from "./AddAnnouncementDialog";
import { ExternalLink, Plus, BellRing } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Linkify from "linkify-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  tag: string;
  created_at: string;
}

interface AnnouncementsSectionProps {
  isAdmin: boolean;
}

export function AnnouncementsSection({ isAdmin }: AnnouncementsSectionProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const feedbackUrl = "https://forms.gle/vvqruVcKQdGSpgWh8";

  const loadAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err) {
      console.error("Error loading announcements:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  /* ----------------------------
     Shared announcement content
     ---------------------------- */
  const announcementContent = (
    <>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-500 space-y-4">
          <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-zinc-400 animate-spin" />
          <p className="text-sm font-medium tracking-wide">Loading updates...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/10 rounded-3xl bg-[#0a0a0c]">
          <BellRing className="w-10 h-10 text-zinc-700 mb-3" />
          <p className="text-zinc-400 font-medium">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="group relative bg-[#121214] border border-white/5 rounded-[24px] p-6 transition-all duration-300 hover:bg-[#18181b] hover:border-white/10 hover:shadow-lg"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                <h3 className="font-semibold text-lg text-zinc-100 leading-snug break-words">
                  {announcement.title}
                </h3>
                {/* Custom Sleek Badge */}
                <span className="px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold tracking-widest uppercase shrink-0 w-fit">
                  {announcement.tag}
                </span>
              </div>

              <Linkify
                options={{
                  target: "_blank",
                  rel: "noopener noreferrer",
                  className: "text-indigo-400 hover:text-indigo-300 underline transition-colors break-all",
                }}
              >
                <p className="text-sm text-zinc-400 whitespace-pre-wrap break-words leading-relaxed mb-4">
                  {announcement.content}
                </p>
              </Linkify>

              <div className="flex items-center gap-2 mt-auto pt-4 border-t border-white/5">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                <p className="text-xs font-medium text-zinc-500">
                  {formatDistanceToNow(new Date(announcement.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <BellRing className="w-5 h-5 text-indigo-400" />
            Latest Updates
          </h3>
          <p className="text-zinc-400 text-sm mt-1">
            Stay informed with campus news and platform updates.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button 
            variant="outline" 
            size="sm" 
            asChild
            className="flex-1 sm:flex-none rounded-full bg-white/5 border-white/10 text-zinc-300 hover:bg-white hover:text-black transition-all"
          >
            <a
              href={feedbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Feedback Form</span>
            </a>
          </Button>

          {isAdmin && (
            <AddAnnouncementDialog
              onAnnouncementAdded={loadAnnouncements}
              trigger={
                <Button
                  className="rounded-full bg-indigo-500 text-white hover:bg-indigo-600 transition-all px-4"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Create
                </Button>
              }
            />
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="w-full">
        {/* Mobile: NO ScrollArea (fixes clipping on phones) */}
        <div className="block sm:hidden">
          {announcementContent}
        </div>

        {/* Desktop: ScrollArea with custom height to fit perfectly */}
        <div className="hidden sm:block">
          <ScrollArea className="h-[500px] pr-4">
            {announcementContent}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}