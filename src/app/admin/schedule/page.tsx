"use client";

import { useEffect, useState } from "react";
import { ScheduleGrid } from "@/components/schedule-grid";

interface Schedule {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

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
      setMessage("Schedule saved successfully");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading schedule...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Work Schedule</h2>
        <p className="text-gray-600 mt-1">
          Configure when users can access the system. Users cannot log in
          outside these hours.
        </p>
      </div>

      {message && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          {message}
        </div>
      )}

      <ScheduleGrid initialSchedules={schedules} onSave={handleSave} />
    </div>
  );
}
