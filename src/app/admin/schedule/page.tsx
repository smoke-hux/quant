"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { ScheduleGrid } from "@/components/schedule-grid";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast-provider";

interface Schedule {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "timeline">("grid");
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/schedule")
      .then((res) => res.json())
      .then((data) => {
        setSchedules(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave(updated: Schedule[]) {
    const res = await fetch("/api/schedule", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schedules: updated }),
    });

    if (res.ok) {
      setSchedules(updated);
      toast({ title: "Schedule saved successfully", variant: "success" });
    } else {
      toast({ title: "Failed to save schedule", variant: "error" });
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl page-enter">
        <div className="mb-6">
          <div className="skeleton skeleton-title w-40" />
          <div className="skeleton skeleton-text w-72" />
        </div>
        <div className="skeleton h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl page-enter">
      <PageHeader
        title="Work Schedule"
        description="Configure when users can access the system. Users cannot log in outside these hours."
        badge={{ label: "SCHEDULE", icon: Clock }}
        actions={
          <div className="inline-flex p-1 bg-gray-100 rounded-lg">
            {(["grid", "timeline"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  view === v
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {v === "grid" ? "Grid" : "Timeline"}
              </button>
            ))}
          </div>
        }
      />

      {view === "grid" ? (
        <ScheduleGrid initialSchedules={schedules} onSave={handleSave} />
      ) : (
        <Card>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Weekly Timeline</h3>
          <div className="space-y-2">
            {/* Hour headers */}
            <div className="flex items-center">
              <div className="w-12 flex-shrink-0" />
              <div className="flex-1 flex">
                {[0, 6, 12, 18, 23].map((h) => (
                  <div key={h} className="flex-1 text-[10px] text-gray-400 text-center">
                    {h.toString().padStart(2, "0")}:00
                  </div>
                ))}
              </div>
            </div>

            {/* Day rows */}
            {DAY_NAMES.map((day, i) => {
              const schedule = schedules.find((s) => s.dayOfWeek === i);
              const isActive = schedule?.isActive ?? false;
              const startHour = schedule ? parseInt(schedule.startTime.split(":")[0]) : 0;
              const endHour = schedule ? parseInt(schedule.endTime.split(":")[0]) : 0;
              const startPercent = isActive ? (startHour / 24) * 100 : 0;
              const widthPercent = isActive ? ((endHour - startHour) / 24) * 100 : 0;

              return (
                <div key={day} className="flex items-center gap-2">
                  <div className={`w-12 text-xs font-medium flex-shrink-0 ${isActive ? "text-gray-700" : "text-gray-300"}`}>
                    {day}
                  </div>
                  <div className="flex-1 h-8 bg-gray-100 rounded-md relative overflow-hidden">
                    {isActive && widthPercent > 0 && (
                      <div
                        className="absolute top-0 bottom-0 bg-blue-500 rounded-md transition-all"
                        style={{ left: `${startPercent}%`, width: `${widthPercent}%` }}
                      >
                        <div className="h-full flex items-center justify-center">
                          <span className="text-[10px] text-white font-medium">
                            {schedule?.startTime} - {schedule?.endTime}
                          </span>
                        </div>
                      </div>
                    )}
                    {!isActive && (
                      <div className="h-full flex items-center justify-center">
                        <span className="text-[10px] text-gray-400">Off</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
