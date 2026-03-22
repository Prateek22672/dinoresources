import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { User, LogOut, Upload, BookPlus } from "lucide-react";
import UploadResourceDialog from "./UploadResourceDialog";
import SubjectDrawer from "./SubjectDrawer";
import AddSubjectDialog from "./AddSubjectDialog";
import { useUserRole } from "@/hooks/useUserRole";
import { AnnouncementsSection } from "./AnnouncementsSection";
import { SupportSection } from "./SupportSection";
import AttendanceCalculator from "./AttendanceCalculator";
import SGPACalculator from "./SGPACalculator";
import dinoLogo from "@/assets/dino-logo.png";

interface Profile {
  department: string;
  semester: number;
}

interface Subject {
  id: string;
  name: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { isContributor, userId, role, isLoading: roleLoading } = useUserRole();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isAddSubjectDialogOpen, setIsAddSubjectDialogOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"subjects" | "attendance" | "sgpa" | "announcements" | "support">("subjects");

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (profile) {
      loadSubjects();
    }
  }, [profile]);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();

    if (!profileData?.department || !profileData?.semester) {
      navigate("/setup");
      return;
    }

    setProfile({
      department: profileData.department,
      semester: profileData.semester,
    });

    setIsLoading(false);
  };

  const loadSubjects = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .eq("department", profile.department)
      .eq("semester", profile.semester)
      .order("order_index", { ascending: true });

    if (error) {
      toast.error("Failed to load subjects");
      return;
    }

    setSubjects(data || []);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleSubjectClick = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsDrawerOpen(true);
  };

  if (isLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-background flex items-center justify-center shadow-card mx-auto animate-pulse">
            <img src={dinoLogo} alt="Team Dino Logo" className="w-12 h-12" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-subtle">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center shadow-card">
                <img src={dinoLogo} alt="Team Dino Logo" className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Team Dino</h1>
                {profile && (
                  <p className="text-sm text-muted-foreground">
                    {profile.department} • Sem {profile.semester}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {/* <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex"
                onClick={() => navigate("/setup?edit=true")}
              >
                Edit Profile
              </Button> */}
              <Button
                variant="outline"
                size="sm"
                className="flex items-center justify-center"
                onClick={() => navigate("/setup?edit=true")}
              >
                {/* Icon visible only on mobile */}
                <span className="sm:hidden">
                  <User className="w-4 h-4" />
                </span>

                {/* Text visible only on larger screens */}
                <span className="hidden sm:inline">Edit Profile</span>
              </Button>

              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Tab Navigation with horizontal scroll */}
          <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            <div className="flex gap-2 sm:gap-4 min-w-max">
              <Card
                className={`shadow-card border-border/50 cursor-pointer transition-all flex-shrink-0 ${
                  activeTab === "subjects" ? "ring-2 ring-primary bg-primary/5" : "hover:shadow-lg"
                }`}
                onClick={() => setActiveTab("subjects")}
              >
                <CardContent className="p-3 sm:p-4 text-center">
                  <h3 className="font-semibold text-sm sm:text-base whitespace-nowrap">Your Subjects</h3>
                </CardContent>
              </Card>

              <Card
                className={`shadow-card border-border/50 cursor-pointer transition-all flex-shrink-0 ${
                  activeTab === "attendance" ? "ring-2 ring-primary bg-primary/5" : "hover:shadow-lg"
                }`}
                onClick={() => setActiveTab("attendance")}
              >
                <CardContent className="p-3 sm:p-4 text-center">
                  <h3 className="font-semibold text-sm sm:text-base whitespace-nowrap">Attendance Calculator</h3>
                </CardContent>
              </Card>

              <Card
                className={`shadow-card border-border/50 cursor-pointer transition-all flex-shrink-0 ${
                  activeTab === "sgpa" ? "ring-2 ring-primary bg-primary/5" : "hover:shadow-lg"
                }`}
                onClick={() => setActiveTab("sgpa")}
              >
                <CardContent className="p-3 sm:p-4 text-center">
                  <h3 className="font-semibold text-sm sm:text-base whitespace-nowrap">SGPA Calculator</h3>
                </CardContent>
              </Card>

              <Card
                className={`shadow-card border-border/50 cursor-pointer transition-all flex-shrink-0 ${
                  activeTab === "announcements" ? "ring-2 ring-primary bg-primary/5" : "hover:shadow-lg"
                }`}
                onClick={() => setActiveTab("announcements")}
              >
                <CardContent className="p-3 sm:p-4 text-center">
                  <h3 className="font-semibold text-sm sm:text-base whitespace-nowrap">Announcements & Feedback</h3>
                </CardContent>
              </Card>

              <Card
                className={`shadow-card border-border/50 cursor-pointer transition-all flex-shrink-0 ${
                  activeTab === "support" ? "ring-2 ring-primary bg-primary/5" : "hover:shadow-lg"
                }`}
                onClick={() => setActiveTab("support")}
              >
                <CardContent className="p-3 sm:p-4 text-center">
                  <h3 className="font-semibold text-sm sm:text-base whitespace-nowrap">Buy me a coffee ☕</h3>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Subjects View */}
          {activeTab === "subjects" && (
            <div className="animate-fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">Your Subjects</h2>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Click on a subject to view organized resources
                  </p>
                </div>
                {isContributor && (
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button onClick={() => setIsAddSubjectDialogOpen(true)} size="sm" variant="outline" className="w-full sm:w-auto">
                      <BookPlus className="w-4 h-4 mr-2" />
                      Add Subject
                    </Button>
                    <Button onClick={() => setIsUploadDialogOpen(true)} size="sm" className="w-full sm:w-auto">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Resource
                    </Button>
                  </div>
                )}
              </div>

              {subjects.length === 0 ? (
                <Card className="shadow-card border-border/50">
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                      No subjects found for your course. Contact your administrator.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subjects.map((subject) => (
                    <Card
                      key={subject.id}
                      className="shadow-card border-border/50 hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => handleSubjectClick(subject)}
                    >
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold">{subject.name}</h3>
                        <p className="text-sm text-muted-foreground mt-2">Click to view resources</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Attendance Calculator View */}
          {activeTab === "attendance" && (
            <div className="animate-fade-in max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Only for 2,3rd Year Students</h2>
              <AttendanceCalculator />
            </div>
          )}

          {/* SGPA Calculator View */}
          {activeTab === "sgpa" && (
            <div className="animate-fade-in max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">SGPA Calculator</h2>
              <SGPACalculator />
            </div>
          )}

          {/* Announcements View */}
          {activeTab === "announcements" && (
            <div className="animate-fade-in max-w-4xl mx-auto">
              <AnnouncementsSection isAdmin={role === "admin"} />
            </div>
          )}

          {/* Support Team Dino View */}
          {activeTab === "support" && (
            <div className="animate-fade-in max-w-4xl mx-auto">
              {/* <h2 className="text-2xl font-bold mb-6 text-center">Buy me a coffee ☕</h2> */}
              <SupportSection />
            </div>
          )}
        </div>
      </main>

      {selectedSubject && (
        <SubjectDrawer
          open={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          subjectId={selectedSubject.id}
          subjectName={selectedSubject.name}
          userRole={role}
          userId={userId}
        />
      )}

      {isContributor && subjects.length > 0 && (
        <UploadResourceDialog
          open={isUploadDialogOpen}
          onOpenChange={setIsUploadDialogOpen}
          subjects={subjects}
          onResourceUploaded={() => {
            // Drawer will reload its own resources
            setIsUploadDialogOpen(false);
          }}
        />
      )}

      {isContributor && profile && (
        <AddSubjectDialog
          open={isAddSubjectDialogOpen}
          onOpenChange={setIsAddSubjectDialogOpen}
          currentDepartment={profile.department}
          currentSemester={profile.semester}
          onSubjectAdded={loadSubjects}
        />
      )}
    </div>
  );
}
