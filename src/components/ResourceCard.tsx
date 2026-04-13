import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText, Video, Link2, Trash2, Edit, Eye, Maximize, Minimize, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { UserRole } from "@/hooks/useUserRole";

interface Resource {
  id: string;
  title: string;
  type: "pdf" | "youtube" | "link";
  url: string;
  created_at: string;
  created_by?: string | null;
  category?: string;
  unit_number?: number | null;
}

interface ResourceCardProps {
  resource: Resource;
  viewMode: "list" | "expanded";
  userRole: UserRole | null;
  userId: string | null;
  onUpdate: () => void;
}

export default function ResourceCard({ resource, viewMode, userRole, userId, onUpdate }: ResourceCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(resource.title);
  const [isUpdating, setIsUpdating] = useState(false);
  const dialogContentRef = useRef<HTMLDivElement>(null);

  const canDelete = userRole === "admin" || (userRole === "contributor" && resource.created_by === userId);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const getIcon = () => {
    switch (resource.type) {
      case "pdf":
        return <FileText className="w-4 h-4" />;
      case "youtube":
        return <Video className="w-4 h-4" />;
      case "link":
        return <Link2 className="w-4 h-4" />;
    }
  };

  const getTypeColor = () => {
    switch (resource.type) {
      case "pdf":
        return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
      case "youtube":
        return "bg-red-600/10 text-red-600 hover:bg-red-600/20";
      case "link":
        return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
    }
  };

  const getYoutubeEmbedUrl = (url: string) => {
    const videoId = url.match(
      /(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^&\n?#]+)/,
    )?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const { error } = await supabase.from("resources").delete().eq("id", resource.id);

    setIsDeleting(false);
    setShowDeleteDialog(false);

    if (error) {
      toast.error("Failed to delete resource");
    } else {
      toast.success("Resource deleted successfully");
      onUpdate();
    }
  };

  const handleRename = async () => {
    if (!editedTitle.trim() || editedTitle === resource.title) {
      setIsEditingTitle(false);
      setEditedTitle(resource.title);
      return;
    }

    setIsUpdating(true);
    const { error } = await supabase
      .from("resources")
      .update({ title: editedTitle.trim() })
      .eq("id", resource.id);

    setIsUpdating(false);
    setIsEditingTitle(false);

    if (error) {
      toast.error("Failed to rename resource");
      setEditedTitle(resource.title);
    } else {
      toast.success("Resource renamed successfully");
      onUpdate();
    }
  };

  const toggleFullscreen = async () => {
    if (!dialogContentRef.current) return;

    try {
      if (!isFullscreen) {
        await dialogContentRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };

  // const renderResourceContent = () => {
  //   if (resource.type === "pdf") {
  //     return (
  //       <iframe
  //         src={resource.url}
  //         className="w-full h-[600px] rounded-lg border border-border"
  //         title={resource.title}
  //       />
  //     );
  //   }
  //   if (resource.type === "youtube") {
  //     return (
  //       <iframe
  //         src={getYoutubeEmbedUrl(resource.url) || resource.url}
  //         className="w-full h-[400px] rounded-lg"
  //         title={resource.title}
  //         allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  //         allowFullScreen
  //       />
  //     );
  //   }
  //   return null;
  // };

  const renderResourceContent = () => {
    if (resource.type === "pdf") {
      return (
        <div
          className={`w-full rounded-lg border border-border ${
            isFullscreen ? "h-full overflow-auto touch-auto" : "aspect-[3/2] sm:aspect-[16/9] overflow-hidden"
          }`}
          style={isFullscreen ? { touchAction: "pan-x pan-y pinch-zoom" } : undefined}
        >
          <iframe src={resource.url} className="w-full h-full" title={resource.title} allowFullScreen />
        </div>
      );
    }

    if (resource.type === "youtube") {
      return (
        <div
          className={`w-full rounded-lg ${
            isFullscreen ? "h-full overflow-auto touch-auto" : "aspect-[16/9] overflow-hidden"
          }`}
          style={isFullscreen ? { touchAction: "pan-x pan-y pinch-zoom" } : undefined}
        >
          <iframe
            src={getYoutubeEmbedUrl(resource.url) || resource.url}
            className="w-full h-full"
            title={resource.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    return null;
  };

  const renderContent = () => {
    if (viewMode === "list") {
      return (
        <div
          className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap cursor-pointer hover:bg-accent/50 rounded-lg px-2 sm:px-3 py-2 transition-colors"
          onClick={() => {
            if (resource.type === "pdf" || resource.type === "youtube") {
              setShowViewDialog(true);
            } else if (resource.type === "link") {
              window.open(resource.url, "_blank");
            }
          }}
        >
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <Badge className={getTypeColor()}>
              {getIcon()}
              <span className="ml-1 uppercase text-xs">{resource.type}</span>
            </Badge>
            {isEditingTitle ? (
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRename();
                  } else if (e.key === 'Escape') {
                    setIsEditingTitle(false);
                    setEditedTitle(resource.title);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="h-8 text-sm flex-1"
                autoFocus
                disabled={isUpdating}
              />
            ) : (
              <>
                <span className="font-medium truncate text-sm sm:text-base">{resource.title}</span>
                {canDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingTitle(true);
                    }}
                    className="h-8 w-8 p-0 shrink-0"
                    title="Rename resource"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
              </>
            )}
          </div>
          <div
            className="flex gap-1 sm:gap-2 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {(resource.type === "pdf" || resource.type === "youtube") && (
              <Button size="sm" variant="ghost" onClick={() => setShowViewDialog(true)}>
                <Eye className="w-4 h-4" />
              </Button>
            )}
            {resource.type === "link" && (
              <Button size="sm" asChild>
                <a href={resource.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Open</span>
                </a>
              </Button>
            )}
            {canDelete && (
              <Button size="sm" variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      );
    }

    return (
      <>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base sm:text-lg break-words">{resource.title}</CardTitle>
            <div className="flex gap-2 shrink-0">
              <Badge className={getTypeColor()}>
                {getIcon()}
                <span className="ml-1 uppercase text-xs">{resource.type}</span>
              </Badge>
              {canDelete && (
                <Button size="sm" variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderResourceContent()}
          {resource.type === "link" && (
            <Button asChild className="w-full">
              <a href={resource.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Resource
              </a>
            </Button>
          )}
        </CardContent>
      </>
    );
  };

  return (
    <>
      <Card className="shadow-card hover:shadow-hover transition-all border-border/50">
        {viewMode === "list" ? <CardContent className="py-4">{renderContent()}</CardContent> : renderContent()}
      </Card>

      <Dialog
        open={showViewDialog}
        onOpenChange={(open) => {
          if (!open && document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          }
          setShowViewDialog(open);
        }}
      >
        <DialogContent
          ref={dialogContentRef}
          className={`${
            isFullscreen
              ? "fixed inset-0 w-screen h-screen max-w-none max-h-none p-0 bg-background overflow-auto"
              : "w-[95vw] sm:w-[90vw] md:w-[80vw] max-w-4xl max-h-[85vh] p-4 rounded-xl overflow-y-auto"
          } [&>button]:left-2 [&>button]:right-auto`}
        >
          <DialogHeader className="relative">
            <DialogTitle className="text-center text-base sm:text-lg font-semibold break-words px-10">
              {resource.title}
            </DialogTitle>
            <Button variant="ghost" size="icon" className="absolute right-0 top-0" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </DialogHeader>
          <div className={`mt-4 ${isFullscreen ? "flex justify-center items-center h-[100vh]" : ""}`}>
            <div className={`${isFullscreen ? "w-full h-full overflow-auto" : ""}`}>{renderResourceContent()}</div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{resource.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}