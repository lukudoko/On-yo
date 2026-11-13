"use client";

import { useState, useEffect } from "react";
import { BiRadioCircle } from "react-icons/bi";

export default function StreakHeader({ studyDates = [] }) {
  const [mounted, setMounted] = useState(false);
  const [weekDates, setWeekDates] = useState([]);
  const [todayStr, setTodayStr] = useState("");

  useEffect(() => {
    setMounted(true);
    
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setTodayStr(today);
    
    const [year, month, day] = today.split('-').map(Number);
    const todayDate = new Date(year, month - 1, day);
    const dayOfWeek = todayDate.getDay(); 
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; 

    const monday = new Date(todayDate);
    monday.setDate(todayDate.getDate() - diff);

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const curr = new Date(monday);
      curr.setDate(monday.getDate() + i);
      dates.push(`${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}-${String(curr.getDate()).padStart(2, '0')}`);
    }
    
    setWeekDates(dates);
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">This week</span>
          <span className="text-xs text-gray-400">0/7 days</span>
        </div>
        <div className="flex justify-between gap-1.5">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <div className="w-full aspect-square rounded-md flex items-center justify-center text-lg leading-none bg-default-100 text-transparent">
                <BiRadioCircle className="w-5 h-5" />
              </div>
              <span className="text-[10px] text-gray-400">{d}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const daysStudied = weekDates.filter(date => studyDates.includes(date)).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">This week</span>
        <span className="text-xs text-gray-400">
          {daysStudied}/7 days
        </span>
      </div>
      <div className="flex justify-between gap-1.5">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => {
          const dateStr = weekDates[i];
          const isStudied = studyDates.includes(dateStr);

          let circleClasses = "";
          if (isStudied) {
            circleClasses = "bg-[#26A68210] text-[#26A682]"; 
          } else if (dateStr <= todayStr) {
            circleClasses = "bg-default-100 text-transparent"; 
          } else {
            circleClasses = "bg-[#6A7FDB60] text-transparent"; 
          }

          return (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <div
                className={`w-full aspect-square rounded-md flex items-center justify-center text-lg leading-none transition-colors ${circleClasses}`}
              >
                <BiRadioCircle className="w-5 h-5" />
              </div>
              <span className="text-[10px] text-gray-400">{d}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}