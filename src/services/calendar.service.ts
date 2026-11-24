import { SupabaseClient } from "@supabase/supabase-js";
import { CalendarInput } from "../types/crud.types";
import { CalendarRepository } from "../repositories/calendar.repository";
import { CalendarRepositoryPort } from "../interfaces/calendar.repository.port";
import { BlogService } from "./blog.service";
import { EventDisplayPort } from "../interfaces/event.display.port";

export class CalendarService {
  // R-06 (H-07): los métodos dependen del puerto; CalendarRepository es solo el valor por defecto.
  static repository: CalendarRepositoryPort = CalendarRepository;
  static events: EventDisplayPort = BlogService;

  static async create(
    db: SupabaseClient,
    input: CalendarInput
  ) {
    if (
      !input.semesterStartDate ||
      !input.semesterEndDate
    ) {
      throw new Error(
        "Semester dates are required."
      );
    }

    return CalendarService.repository.create(db, {
      id: input.id ?? crypto.randomUUID(),
      semesterStartDate: input.semesterStartDate,
      semesterEndDate: input.semesterEndDate,
    });
  }

  static async findById(
    db: SupabaseClient,
    calendarId: string
  ) {
    return CalendarService.repository.findById(db, calendarId);
  }

  static async update(
    db: SupabaseClient,
    calendarId: string,
    changes: Partial<CalendarInput>
  ) {
    return CalendarService.repository.update(
      db,
      calendarId,
      changes
    );
  }

  static async delete(
    db: SupabaseClient,
    calendarId: string
  ) {
    return CalendarService.repository.delete(db, calendarId);
  }

  static async displayEvents(
    db: SupabaseClient
  ) {
    return CalendarService.events.displayEvents(db);
  }
}