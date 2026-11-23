"use client";

import React, { useEffect, useState } from "react";
import { Lalezar, Jost } from "next/font/google";
import MiniCalendar from "../components/MiniCalendar";
import { apiFetch } from "../../../lib/api";

const lalezar = Lalezar({ weight: "400", subsets: ["latin"] });
const jost = Jost({ subsets: ["latin"] });

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const DAYS_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const formatDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(null);
  const [viewMode, setViewMode] = useState("week");
  const [events, setEvents] = useState([]);
  const [eventsError, setEventsError] = useState("");

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadEvents = async () => {
      const response = await apiFetch("/api/calendar");

      if (!isActive) return;

      if (!response.success) {
        setEventsError(response.error || "No se pudieron cargar los eventos.");
        return;
      }

      if (!Array.isArray(response.data)) {
        setEventsError("La respuesta de eventos no tiene un formato válido.");
        return;
      }

      const loadedEvents = response.data.map((event) => {
        if (!event) return null;
        const startDate = new Date(event.eventStartDate);
        if (
          !event.id ||
          !event.title ||
          !event.eventStartDate ||
          Number.isNaN(startDate.getTime())
        ) {
          return null;
        }

        return {
          id: event.id,
          title: event.title,
          date: formatDateKey(startDate),
          hour: startDate.getHours(),
        };
      });

      if (loadedEvents.some((event) => event === null)) {
        setEventsError("Uno o más eventos tienen datos inválidos.");
        return;
      }

      setEventsError("");
      setEvents(loadedEvents);
    };

    loadEvents();
    return () => {
      isActive = false;
    };
  }, []);

  if (!currentDate) {
    return (
      <main
        className={`${jost.className} box-border flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_center,#111184_0%,#070738_70%,#010736_100%)] p-5 text-white`}
      >
        <p className="text-lg">Cargando...</p>
      </main>
    );
  }

  const getWeekDays = (baseDate) => {
    const dayOfWeek = (baseDate.getDay() + 6) % 7;
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() - dayOfWeek);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  const getMonthCells = (baseDate) => {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;

    const cells = Array(firstDayIndex).fill(null);
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push(new Date(year, month, i));
    }
    return cells;
  };

  const changeMonth = (offset) => {
    const next = new Date(currentDate);
    next.setMonth(currentDate.getMonth() + offset);
    setCurrentDate(next);
  };

  const changePeriod = (offset) => {
    const next = new Date(currentDate);
    if (viewMode === "day") next.setDate(currentDate.getDate() + offset);
    if (viewMode === "week") next.setDate(currentDate.getDate() + offset * 7);
    if (viewMode === "month") next.setMonth(currentDate.getMonth() + offset);
    setCurrentDate(next);
  };

  const selectCalendarDay = (date) => {
    setCurrentDate(date);
    setViewMode("day");
  };

  const START_HOUR = 7;
  const END_HOUR = 22;
  const hours = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, i) => START_HOUR + i
  );

  const formatHour = (h) => {
    if (h === 0) return "12:00 AM";
    if (h < 12) return `${h}:00 AM`;
    if (h === 12) return "12:00 PM";
    return `${h - 12}:00 PM`;
  };

  const visibleDays = viewMode === "day" ? [currentDate] : getWeekDays(currentDate);

  return (
    <main className={`${jost.className} box-border flex min-h-screen gap-6 bg-[radial-gradient(circle_at_center,#111184_0%,#070738_70%,#010736_100%)] p-5 text-white`}>
      <aside className="shrink-0">
        <MiniCalendar events={events} onDateSelect={selectCalendarDay} />
      </aside>

      <section className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className={`${lalezar.className} m-0 flex items-center gap-4 text-[32px] text-white`}>
            <button
              className="cursor-pointer rounded-lg border-0 bg-transparent px-[10px] py-1 text-2xl text-white transition-colors duration-200 hover:bg-[rgba(87,35,100,0.3)]"
              onClick={() => changeMonth(-1)}
            >
              &lt;
            </button>
            <span>{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
            <button
              className="cursor-pointer rounded-lg border-0 bg-transparent px-[10px] py-1 text-2xl text-white transition-colors duration-200 hover:bg-[rgba(87,35,100,0.3)]"
              onClick={() => changeMonth(1)}
            >
              &gt;
            </button>
          </div>

          <div className="flex overflow-hidden rounded-2xl border border-white/[0.18] bg-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-[14px]">
            {["day", "week", "month"].map((mode) => (
              <button
                key={mode}
                className={`cursor-pointer border-0 px-4 py-2 text-[13px] font-bold transition-all ${
                  viewMode === mode
                    ? "bg-[#9FA1FF] text-white"
                    : "bg-transparent text-[#9FA1FF] hover:bg-[rgba(87,35,100,0.3)]"
                }`}
                onClick={() => setViewMode(mode)}
              >
                {mode === "day" ? "Día" : mode === "week" ? "Semana" : "Mes"}
              </button>
            ))}
          </div>
        </div>

        {eventsError && (
          <p role="alert" className="m-0 text-[#ffb4b4]">
            {eventsError}
          </p>
        )}

        {(viewMode === "week" || viewMode === "day") && (
          <>
            <div className="flex items-center gap-2">
              <div className="shrink-0 rotate-180 rounded-[14px] bg-[#9FA1FF] px-[6px] py-[10px] text-center text-[11px] font-bold text-white [writing-mode:vertical-rl]">
                GMT
              </div>

              <button
                className="cursor-pointer rounded-lg border-0 bg-transparent px-[10px] py-1 text-2xl text-white transition-colors duration-200 hover:bg-[rgba(87,35,100,0.3)]"
                onClick={() => changePeriod(-1)}
              >
                &lt;
              </button>

              <div
                className={`grid flex-1 gap-2 ${viewMode === "day" ? "grid-cols-1" : "grid-cols-7"}`}
              >
                {visibleDays.map((date) => {
                  const dateKey = formatDateKey(date);
                  const isSelected = dateKey === formatDateKey(currentDate);
                  const dayName = DAYS_NAMES[(date.getDay() + 6) % 7];
                  return (
                    <div
                      key={dateKey}
                      onClick={() => setCurrentDate(date)}
                      className={`cursor-pointer rounded-xl border p-2 text-center text-[13px] text-white backdrop-blur-[10px] transition-all duration-200 ${
                        isSelected
                          ? "border-white/[0.45] bg-[rgba(159,161,255,0.55)]"
                          : "border-white/[0.18] bg-white/[0.06] hover:border-white/[0.32] hover:bg-[rgba(87,35,100,0.45)]"
                      }`}
                    >
                      <div className="font-bold">{dayName}</div>
                      <div>{date.getDate()}</div>
                    </div>
                  );
                })}
              </div>

              <button
                className="cursor-pointer rounded-lg border-0 bg-transparent px-[10px] py-1 text-2xl text-white transition-colors duration-200 hover:bg-[rgba(87,35,100,0.3)]"
                onClick={() => changePeriod(1)}
              >
                &gt;
              </button>
            </div>

            <div className="max-h-[65vh] flex-1 overflow-y-auto rounded-2xl border border-white/[0.18] bg-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-[14px]">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className={`grid min-h-16 border-b border-[rgba(159,161,255,0.5)] ${
                    viewMode === "day"
                      ? "grid-cols-[82px_minmax(0,1fr)]"
                      : "grid-cols-[82px_repeat(7,minmax(0,1fr))]"
                  }`}
                >
                  <div className="flex items-center justify-end border-r border-[rgba(159,161,255,0.5)] py-2 pl-2 pr-3 text-right text-xs text-[#d8bfd8]">
                    {formatHour(hour)}
                  </div>

                  {visibleDays.map((date) => {
                    const dateKey = formatDateKey(date);
                    const cellKey = `cell-${dateKey}-${hour}`;
                    const cellEvents = events.filter(
                      (ev) => ev.date === dateKey && ev.hour === hour
                    );

                    return (
                      <div
                        key={cellKey}
                        className="flex flex-col gap-1 border-r border-[rgba(159,161,255,0.5)] p-1 transition-colors duration-150 hover:bg-[rgba(87,35,100,0.3)]"
                      >
                        {cellEvents.map((ev) => {
                          return (
                            <div
                              key={ev.id}
                              className="cursor-pointer truncate rounded-full bg-[linear-gradient(90deg,#8b5cf6_0%,#9FA1FF_100%)] px-[10px] py-[3px] text-[11px] font-bold text-white transition-colors duration-200 hover:bg-none hover:bg-[#9FA1FF]"
                            >
                              {ev.title}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </>
        )}

        {viewMode === "month" && (
          <div className="rounded-2xl border border-white/[0.18] bg-white/[0.06] p-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-[14px]">
            <div className="grid grid-cols-7 border-b border-[rgba(159,161,255,0.3)] pb-[10px] text-center font-bold text-white">
              {DAYS_NAMES.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            <div className="mt-[10px] grid grid-cols-7 gap-[6px]">
              {getMonthCells(currentDate).map((date, idx) => {
                if (!date) return <div key={`empty-${idx}`} className="min-h-[85px]" />;
                const dateKey = formatDateKey(date);
                const dayEvents = events.filter((ev) => ev.date === dateKey);

                return (
                  <div
                    key={dateKey}
                    onClick={() => {
                      setCurrentDate(date);
                      setViewMode("day");
                    }}
                    className="flex min-h-[85px] cursor-pointer flex-col gap-1 rounded-[10px] border border-[rgba(159,161,255,0.3)] p-[6px] transition-colors duration-150 hover:bg-[rgba(87,35,100,0.3)]"
                  >
                    <span className="text-[13px] font-bold text-white">
                      {date.getDate()}
                    </span>

                    {dayEvents.map((ev) => {
                      return (
                        <div
                          key={ev.id}
                          className="cursor-pointer truncate rounded-full bg-[linear-gradient(90deg,#8b5cf6_0%,#9FA1FF_100%)] px-2 py-0.5 text-[10px] font-bold text-white transition-colors duration-150 hover:bg-none hover:bg-[#9FA1FF]"
                        >
                          {ev.title}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}