import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BookPlus } from "lucide-react";

interface AddSubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDepartment: string;
  currentSemester: string;
  onSubjectAdded: () => void;
}

export default function AddSubjectDialog({
  open,
  onOpenChange,
  currentDepartment,
  currentSemester,
  onSubjectAdded,
}: AddSubjectDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [semester, setSemester] = useState<string>(
  currentSemester || "Supplementary"
);
  const academicYears = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "Supplementary"
];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subjectName.trim()) {
      toast.error("Please enter a subject name");
      return;
    }

    setIsLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Not authenticated");
      setIsLoading(false);
      return;
    }

    // Get the current max order_index for the selected semester
    const { data: existingSubjects } = await supabase
      .from("subjects")
      .select("order_index")
      .eq("department", currentDepartment)
      .eq("semester", semester)
      .order("order_index", { ascending: false })
      .limit(1);

    const nextOrderIndex = existingSubjects && existingSubjects.length > 0 
      ? (existingSubjects[0].order_index || 0) + 1 
      : 0;

    const { error } = await supabase.from("subjects").insert({
      name: subjectName.trim(),
      semester: semester,
      department: currentDepartment,
      order_index: nextOrderIndex,
    });

    setIsLoading(false);

    if (error) {
      console.error("Error adding subject:", error);
      toast.error("Failed to add subject");
    } else {
      toast.success("Subject added successfully!");
      setSubjectName("");
      setSemester(currentSemester);
      onSubjectAdded();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookPlus className="w-5 h-5" />
            Add New Subject
          </DialogTitle>
          <DialogDescription>
            Create a new subject for students to access. The subject will be added to the selected academic year.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subjectName">Subject Name</Label>
            <Input
              id="subjectName"
              placeholder="e.g., Machine Learning, Data Structures..."
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="semester">Academic Year</Label>
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger id="semester">
                <SelectValue placeholder="Academic Year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((sem) => (
                  <SelectItem key={sem} value={sem}>
                    {sem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
            <p className="text-sm text-muted-foreground">
              <strong>Department:</strong> {currentDepartment}
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Adding Subject..." : "Add Subject"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
