"use client";

import { useState } from "react";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

interface Schedule {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface ScheduleGridProps {
  initialSchedules: Schedule[];
  onSave: (schedules: Schedule[]) => Promise<void>;
}

export function ScheduleGrid({ initialSchedules, onSave }: ScheduleGridProps) {
  const [schedules, setSchedules] = useState<Schedule[]>(() => {
    // Ensure all 7 days exist
    return DAY_NAMES.map((_, i) => {
      const existing = initialSchedules.find((s) => s.dayOfWeek === i);
      return (
        existing || {
          dayOfWeek: i,
          startTime: "09:00",
          endTime: "17:00",
          isActive: false,
        }
      );
    });
  });
  const [saving, setSaving] = useState(false);

  function updateSchedule(dayOfWeek: number, updates: Partial<Schedule>) {
    setSchedules((prev) =>
      prev.map((s) => (s.dayOfWeek === dayOfWeek ? { ...s, ...updates } : s))
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(schedules);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Day
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Active
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Start Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                End Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {schedules.map((schedule) => (
              <tr
                key={schedule.dayOfWeek}
                className={schedule.isActive ? "bg-white" : "bg-gray-50"}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {DAY_NAMES[schedule.dayOfWeek]}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() =>
                      updateSchedule(schedule.dayOfWeek, {
                        isActive: !schedule.isActive,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      schedule.isActive ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        schedule.isActive ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="time"
                    value={schedule.startTime}
                    onChange={(e) =>
                      updateSchedule(schedule.dayOfWeek, {
                        startTime: e.target.value,
                      })
                    }
                    disabled={!schedule.isActive}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:bg-gray-100"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="time"
                    value={schedule.endTime}
                    onChange={(e) =>
                      updateSchedule(schedule.dayOfWeek, {
                        endTime: e.target.value,
                      })
                    }
                    disabled={!schedule.isActive}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:bg-gray-100"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Schedule"}
        </button>
      </div>
    </div>
  );
}
