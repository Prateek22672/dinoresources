import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import {
  Save,
  Edit2,
  Calculator,
  AlertCircle,
} from "lucide-react";

/* ------------------ Types ------------------ */

interface Timetable {
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
}

/* ------------------ Semester Config ------------------ */

const SEMESTER_START = new Date(2025, 11, 1); // Dec 1, 2025
const SEMESTER_END = new Date(2026, 3, 15);  // Apr 15, 2026
const SESSION_1_END = new Date(2026, 1, 3);   // Feb 3, 2026 (end of Session 1)

const HOLIDAYS: Record<string, number[]> = {
  "2025-12": [6, 7, 13, 14, 20, 21, 22, 23, 24, 26, 25, 27, 28],
  "2026-01": [3, 4, 10, 11, 12, 13, 14, 15, 16, 17, 18, 24, 25, 26, 31],
  "2026-02": [1, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 21, 22, 28],
  "2026-03": [1, 7, 8, 14, 15, 19, 20, 21, 22, 28, 29],
  "2026-04": [3, 4, 5, 11, 12, 14],
};

/* ------------------ Date Helpers ------------------ */

const isWorkingDay = (date: Date): boolean => {
  if (date < SEMESTER_START || date > SEMESTER_END) return false;

  const day = date.getDay();
  if (day === 0 || day === 6) return false; // Sunday / Saturday

  const monthKey = `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;

  const holidays = HOLIDAYS[monthKey] || [];
  return !holidays.includes(date.getDate());
};

const getDayKey = (date: Date): keyof Timetable | null => {
  const map: (keyof Timetable | null)[] = [
    null,
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    null,
  ];
  return map[date.getDay()];
};

const getClassesForDay = (date: Date, timetable: Timetable): number => {
  if (!isWorkingDay(date)) return 0;
  const dayKey = getDayKey(date);
  return dayKey ? timetable[dayKey] : 0;
};

// NEW: Helper to calculate classes conducted between two dates
const calculateConductedBetween = (
  startDate: Date,
  endDate: Date,
  timetable: Timetable
): number => {
  let total = 0;
  const cursor = new Date(startDate);

  while (cursor <= endDate && cursor <= SEMESTER_END) {
    total += getClassesForDay(cursor, timetable);
    cursor.setDate(cursor.getDate() + 1);
  }
  return total;
};

const calculateConductedTill = (
  endDate: Date,
  timetable: Timetable
): number => {
  return calculateConductedBetween(SEMESTER_START, endDate, timetable);
};

const calculateRemaining = (
  fromDate: Date,
  timetable: Timetable
): number => {
  let total = 0;
  const cursor = new Date(fromDate);
  cursor.setDate(cursor.getDate() + 1); // Start from next day

  while (cursor <= SEMESTER_END) {
    total += getClassesForDay(cursor, timetable);
    cursor.setDate(cursor.getDate() + 1);
  }
  return total;
};

/* ------------------ Component ------------------ */

export default function AttendanceCalculator() {
  const [timetable, setTimetable] = useState<Timetable>({
    monday: 0,
    tuesday: 0,
    wednesday: 0,
    thursday: 0,
    friday: 0,
  });

  const [savedTimetable, setSavedTimetable] = useState<Timetable | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [attendanceInput, setAttendanceInput] = useState("");
  const [attendedToday, setAttendedToday] = useState<"yes" | "no">("no");
  const [classesConductedToday, setClassesConductedToday] = useState("");
  const [classesAttendedToday, setClassesAttendedToday] = useState("");

  const [result, setResult] = useState<null | {
    remaining: number;
    mustAttend: number;
    canBunk: number;
    session1Needed: number;
    session1Remaining: number;
    session2Needed: number;
    session2Remaining: number;
    isOverallPossible: boolean;
    isSession1Possible: boolean;
    isSession2Possible: boolean;
  }>(null);

  /* ------------------ Load Timetable ------------------ */

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) return;

      const { data: table } = await supabase
        .from("user_timetables")
        .select("*")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (table) {
        const loaded: Timetable = {
          monday: table.monday,
          tuesday: table.tuesday,
          wednesday: table.wednesday,
          thursday: table.thursday,
          friday: table.friday,
        };
        setTimetable(loaded);
        setSavedTimetable(loaded);
      }
      setLoading(false);
    };

    load();
  }, []);

  /* ------------------ Today Context ------------------ */

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const classesToday = useMemo(() => {
    if (!savedTimetable) return 0;
    return isWorkingDay(today)
      ? getClassesForDay(today, savedTimetable)
      : 0;
  }, [today, savedTimetable]);

  const shouldAskToday = classesToday > 0;

  /* ------------------ Save Timetable ------------------ */

  const saveTimetable = async () => {
    setIsSaving(true);
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return;

    const { error } = await supabase.from("user_timetables").upsert(
      {
        user_id: data.user.id,
        ...timetable,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) toast.error("Failed to save timetable");
    else {
      setSavedTimetable(timetable);
      setIsEditing(false);
      toast.success("Timetable saved");
    }
    setIsSaving(false);
  };

  /* ------------------ FIXED: Calculate Attendance ------------------ */

  const calculateAttendance = () => {
    if (!savedTimetable) return;

    const percent = parseFloat(attendanceInput);
    if (isNaN(percent) || percent < 0 || percent > 100) {
      toast.error("Invalid attendance percentage");
      return;
    }

     const ct = parseInt(classesConductedToday) || 0;
      const at = parseInt(classesAttendedToday) || 0;
    
    let conductedSoFar: number;
    let attendedSoFar: number;
    let remaining: number;

    if (shouldAskToday && attendedToday === "yes") {
      // Today's attendance IS reflected in the portal
      conductedSoFar = calculateConductedTill(today, savedTimetable);

      if (at > ct) {
        toast.error("Attended classes cannot exceed conducted classes");
        return;
      }
      
      if (ct > classesToday) {
        toast.error(`Only ${classesToday} classes scheduled today`);
        return;
      }

      const totalAttendedTillNow = Math.round((percent / 100) * conductedSoFar);
      attendedSoFar = totalAttendedTillNow;
      
      const conductedTillYesterday = conductedSoFar - ct;
      const attendedTillYesterday = totalAttendedTillNow - at;
      
      if (attendedTillYesterday < 0 || attendedTillYesterday > conductedTillYesterday) {
        toast.error("Invalid data: Check your inputs");
        return;
      }

      // Remaining is from tomorrow (since today is already counted)
      // remaining = calculateRemaining(today, savedTimetable);

      const remainingToday = Math.max(0, classesToday - ct);

        // Remaining = remaining classes today + all future classes
        remaining = remainingToday + calculateRemaining(today, savedTimetable);

      
    } else {
      // Today's attendance is NOT yet reflected
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      conductedSoFar = calculateConductedTill(yesterday, savedTimetable);
      attendedSoFar = Math.round((percent / 100) * conductedSoFar);

      // FIXED: Remaining includes today + future days
      // Use calculateConductedBetween for today, then add calculateRemaining
      remaining = getClassesForDay(today, savedTimetable) + calculateRemaining(today, savedTimetable);
    }

    // Calculate for end of semester (Session 2)
    const totalBySemesterEnd = conductedSoFar + remaining;
    const requiredFor75 = Math.ceil(totalBySemesterEnd * 0.75);
    const mustAttend = Math.max(0, requiredFor75 - attendedSoFar);
    const canBunk = Math.max(0, remaining - mustAttend);
    


    // Calculate for Session 1 (Feb 3, 2026)
    let session1Needed = 0;
    let session1Remaining = 0;
    
    if (today <= SESSION_1_END) {
      let totalBySession1: number;
      
  
      if (shouldAskToday && attendedToday === "yes") {
            const remainingToday = Math.max(0, classesToday - ct);
          
            const futureUntilSession1 = calculateConductedBetween(
              new Date(today.getTime() + 86400000), // tomorrow
              SESSION_1_END,
              savedTimetable
            );
          
            session1Remaining = remainingToday + futureUntilSession1;
          
            totalBySession1 = conductedSoFar + session1Remaining;
          }

      
      else {
        // Today is not counted yet - include it
        totalBySession1 = conductedSoFar + calculateConductedBetween(
          today,
          SESSION_1_END,
          savedTimetable
        );
        session1Remaining = calculateConductedBetween(
          today,
          SESSION_1_END,
          savedTimetable
        );
      }
      
      const requiredForSession1 = Math.ceil(totalBySession1 * 0.75);
      session1Needed = Math.max(0, requiredForSession1 - attendedSoFar);
    }

    // Session 2 is same as semester end
    const session2Needed = mustAttend;
    const session2Remaining = remaining;
    const isOverallPossible = mustAttend <= remaining;
    const isSession1Possible = session1Needed <= session1Remaining;
    const isSession2Possible = session2Needed <= session2Remaining;

    setResult({
      remaining,
      mustAttend,
      canBunk,
      session1Needed,
      session1Remaining,
      session2Needed,
      session2Remaining,
      isOverallPossible,
      isSession1Possible,
      isSession2Possible,
    });
  };
  
  if (loading) return null;

  /* ------------------ UI ------------------ */

  return (
    <div className="space-y-6">
      {/* Timetable */}
      <Card>
        <CardHeader>
          <CardTitle>Your Weekly Timetable</CardTitle>
          <CardDescription>Same throughout the semester</CardDescription>
        </CardHeader>
        <CardContent>
          {(isEditing || !savedTimetable) && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-center">
                {Object.keys(timetable).map((day) => (
                  <div key={day}>
                    <Label className="capitalize text-sm mb-2 block">{day}</Label>
                    <Input
                      type="number"
                      min={0}
                      max={8}
                      value={timetable[day as keyof Timetable]}
                      onChange={(e) =>
                        setTimetable({
                          ...timetable,
                          [day]: Math.min(8, Math.max(0, +e.target.value)),
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isEditing && savedTimetable && (
            <div className="grid grid-cols-5 gap-4 text-center">
              {Object.entries(savedTimetable).map(([d, v]) => (
                <div key={d}>
                  <p className="capitalize text-sm mb-2">{d}</p>
                  <p className="text-2xl font-bold">{v}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            {(isEditing || !savedTimetable) && (
              <Button onClick={saveTimetable} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" /> Save
              </Button>
            )}
            {savedTimetable && !isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit2 className="w-4 h-4 mr-2" /> Edit
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attendance */}
      {savedTimetable && (
        <Card>
          <CardHeader>
            <CardTitle>Calculate Attendance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block">Current Attendance %</Label>
              <Input
                placeholder="Attendance % (e.g. 74.84)"
                value={attendanceInput}
                onChange={(e) => setAttendanceInput(e.target.value)}
              />
            </div>

            {shouldAskToday && (
              <div className="space-y-4 bg-muted/50 p-4 rounded-lg border">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  <Label className="font-semibold">
                    Is today's attendance already reflected in the portal?
                  </Label>
                </div>
                <RadioGroup
                  value={attendedToday}
                  onValueChange={(v) =>
                    setAttendedToday(v as "yes" | "no")
                  }
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="no" />
                    <Label htmlFor="no" className="cursor-pointer">No</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="yes" />
                    <Label htmlFor="yes" className="cursor-pointer">Yes</Label>
                  </div>
                </RadioGroup>

                {attendedToday === "yes" && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label className="mb-2 block">Classes conducted today</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 5"
                        value={classesConductedToday}
                        onChange={(e) =>
                          setClassesConductedToday(e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">Classes attended today</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 4"
                        value={classesAttendedToday}
                        onChange={(e) =>
                          setClassesAttendedToday(e.target.value)
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <Button onClick={calculateAttendance} className="w-full">
              <Calculator className="w-4 h-4 mr-2" /> Calculate
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {/* Overall Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Attendance (Until Semester End)</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-blue-600">{result.remaining}</p>
                <p className="text-sm text-muted-foreground mt-1">Classes Remaining</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-amber-600">
                  {result.mustAttend}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Must Attend</p>
              
                {!result.isOverallPossible && (
                  <p className="mt-1 text-xs font-semibold text-red-500">
                    Almost Not Possible
                  </p>
                )}
              </div>

              <div>
                <p className="text-3xl font-bold text-green-600">{result.canBunk}</p>
                <p className="text-sm text-muted-foreground mt-1">Can Skip</p>
              </div>
            </CardContent>
          </Card>

          {/* Session Targets */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Session 1 */}
            {today <= SESSION_1_END && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Session 1 Target</CardTitle>
                  <CardDescription>75% by Feb 3, 2026 (Mid-term)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Classes remaining:</span>
                    <span className="text-xl font-bold">{result.session1Remaining}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Must attend:</span>
                    <div className="text-right">
                      <span className="text-xl font-bold text-amber-600">
                        {result.session1Needed}
                      </span>
                    
                      {!result.isSession1Possible && (
                        <p className="text-xs font-semibold text-red-500">
                          Almost Not Possible
                        </p>
                      )}
                    </div>

                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Can Skip:</span>
                    <span className="text-xl font-bold text-green-600">
                      {Math.max(0, result.session1Remaining - result.session1Needed)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Session 2 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Session 2 Target</CardTitle>
                <CardDescription>75% by Apr 15, 2026 (Finals)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Classes remaining:</span>
                  <span className="text-xl font-bold">{result.session2Remaining}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Must attend:</span>
                 <div className="text-right">
                    <span className="text-xl font-bold text-amber-600">
                      {result.session2Needed}
                    </span>
                  
                    {!result.isSession2Possible && (
                      <p className="text-xs font-semibold text-red-500">
                        Not Possible
                      </p>
                    )}
                  </div>

                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Can Skip:</span>
                  <span className="text-xl font-bold text-green-600">
                    {Math.max(0, result.session2Remaining - result.session2Needed)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
