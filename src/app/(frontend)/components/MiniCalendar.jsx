"use client";

import React, { Suspense, useState, useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;
const formatDateKey = (year, month, day) =>
  `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

function MiniCalendarContent({
  events = [],
  onDateSelect,
  selectedDate,
}) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  );
  const [displayDate, setDisplayDate] = useState(null);

  if (!isClient) {
    return (
      <section className="m-[10px] box-border flex h-auto w-[250px] flex-col items-center justify-center rounded-2xl border border-white/[0.18] bg-white/[0.06] p-[15px] font-sans text-xs text-white shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-[14px]">
        <p>Cargando...</p>
      </section>
    );
  }

  const activeDate = selectedDate ?? new Date();
  const activeDateKey = formatDateKey(
    activeDate.getFullYear(),
    activeDate.getMonth(),
    activeDate.getDate()
  );
  const currentDate =
    displayDate?.activeDateKey === activeDateKey
      ? displayDate.date
      : activeDate;
  const eventDates = new Set(events.map((event) => event.date));
  const daysOfWeek = ["L", "M", "M", "J", "V", "S", "D"];
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const selectedDay = activeDateKey;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;

  const calendarCells = [
    ...Array(firstDayIndex).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ];

  const getDayClass = (day) => {
    const dateKey = day ? formatDateKey(year, month, day) : null;
    const isSelected = dateKey === selectedDay;

    return `mx-auto flex h-6 w-6 items-center justify-center rounded-full text-white transition-colors duration-200 ${
      day ? "cursor-pointer" : "cursor-default"
    } ${
      isSelected
        ? "bg-[#9FA1FF]"
        : "bg-transparent hover:bg-[rgba(87,35,100,0.3)]"
    } ${eventDates.has(dateKey) ? "relative" : ""}`;
  };

  const changeMonth = (offset) => {
    setDisplayDate({
      activeDateKey,
      date: new Date(year, month + offset, 1),
    });
  };

  const handleDayClick = (day) => {
    if (!day) return;
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

        {calendarCells.map((day, index) => {
          if (!day) return <div key={`day-${index}`} aria-hidden="true" />;

          const dateKey = formatDateKey(year, month, day);
          return (
            <button
              key={`day-${index}`}
              type="button"
              aria-pressed={dateKey === selectedDay}
              className={getDayClass(day)}
              onClick={() => handleDayClick(day)}
            >
              {day}
              {eventDates.has(dateKey) && (
                <span
                  aria-label="Hay un evento"
                  className="absolute bottom-0.5 h-1 w-1 rounded-full bg-[#F4C95D]"
                />
              )}
            </button>
          );
        })}
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