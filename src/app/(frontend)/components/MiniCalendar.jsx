"use client";

import React, { Suspense, useState, useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function MiniCalendarContent({
  events = [],
  onDateSelect,
}) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  );
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  if (!isClient) {
    return (
      <section className="m-[10px] box-border flex h-auto w-[250px] flex-col items-center justify-center rounded-2xl border border-white/[0.18] bg-white/[0.06] p-[15px] font-sans text-xs text-white shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-[14px]">
        <p>Cargando...</p>
      </section>
    );
  }

  const currentDate = selectedDate ?? new Date();
  const eventDates = new Set(events.map((event) => event.date));
  const daysOfWeek = ["L", "M", "M", "J", "V", "S", "D"];
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;

  const calendarCells = [
    ...Array(firstDayIndex).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ];

  const getDayClass = (day) => {
    const dateKey = day
      ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      : null;
    const isSelected =
      dateKey !== null &&
      (eventDates.has(dateKey) || selectedDays.includes(dateKey));

    return `mx-auto flex h-6 w-6 items-center justify-center rounded-full text-white transition-colors duration-200 ${
      day ? "cursor-pointer" : "cursor-default"
    } ${
      isSelected
        ? "bg-[#9FA1FF]"
        : "bg-transparent hover:bg-[rgba(87,35,100,0.3)]"
    }`;
  };

  const toggleDay = (day) => {
    if (!day) return;
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDays((prev) =>
      prev.includes(dateKey)
        ? prev.filter((selectedDay) => selectedDay !== dateKey)
        : [...prev, dateKey]
    );
  };

  const changeMonth = (offset) => {
    setSelectedDate(new Date(year, month + offset, 1));
  };

  const handleDayClick = (day) => {
    if (!day) return;
    toggleDay(day);
    onDateSelect?.(new Date(year, month, day));
  };

  return (
    <section className="m-[10px] box-border flex h-auto w-[250px] flex-col gap-3 rounded-2xl border border-white/[0.18] bg-white/[0.06] p-[15px] font-sans text-white shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-[14px]">
      <div className="flex justify-end gap-[15px] pr-[5px]">
        <button
          className="cursor-pointer border-0 bg-transparent px-[6px] py-0.5 text-base text-white transition-colors hover:text-[#9FA1FF]"
          onClick={() => changeMonth(-1)}
        >
          &lt;
        </button>
        <button
          className="cursor-pointer border-0 bg-transparent px-[6px] py-0.5 text-base text-white transition-colors hover:text-[#9FA1FF]"
          onClick={() => changeMonth(1)}
        >
          &gt;
        </button>
      </div>

      <div className="grid grid-cols-7 items-center gap-y-2 text-center text-xs">
        {daysOfWeek.map((day, index) => (
          <div key={`header-${index}`} className="mb-1 font-bold text-[#ABA7B4]">
            {day}
          </div>
        ))}

        {calendarCells.map((day, index) => (
          <div
            key={`day-${index}`}
            className={getDayClass(day)}
            onClick={() => handleDayClick(day)}
          >
            {day}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function MiniCalendar(props) {
  return (
    <Suspense
      fallback={
        <section className="m-[10px] box-border flex h-auto w-[250px] flex-col items-center justify-center rounded-2xl border border-white/[0.18] bg-white/[0.06] p-[15px] font-sans text-xs text-white shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-[14px]">
          <p>Cargando...</p>
        </section>
      }
    >
      <MiniCalendarContent {...props} />
    </Suspense>
  );
}