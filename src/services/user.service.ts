import { SupabaseClient } from "@supabase/supabase-js";
import {
  UserInput,
  UserUpdateInput,
} from "../types/crud.types";
import { UserRepository } from "../repositories/user.repository";
import { UserRepositoryPort } from "../interfaces/user.repository.port";

export class UserService {
  // R-06 (H-07): los métodos dependen del puerto; UserRepository es solo el valor por defecto.
  static repository: UserRepositoryPort = UserRepository;

  static async create(
    db: SupabaseClient,
    input: UserInput
  ) {
    if (
      !input.name.trim() ||
      !input.username.trim() ||
      !input.email.trim()
    ) {
      throw new Error(
        "Name, username and email are required."
      );
    }

    return UserService.repository.create(db, {
      id: input.id ?? crypto.randomUUID(),
      name: input.name.trim(),
      username: input.username.trim(),
      email: input.email.trim().toLowerCase(),
      externalAuthProvider: input.externalAuthProvider,
      type: input.type,
      notificationsEnabled: input.notificationsEnabled ?? false,
      seed: input.seed?.trim() || input.username.trim(),
    });
  }

  static async findById(
    db: SupabaseClient,
    userId: string
  ) {
    return UserService.repository.findById(db, userId);
  }

  static async update(
    db: SupabaseClient,
    userId: string,
    changes: UserUpdateInput
  ) {
    if (
      changes.username !== undefined &&
      !changes.username.trim()
    ) {
      throw new Error("Username cannot be empty.");
    }

    return UserService.repository.update(db, userId, {
      ...changes,
      username: changes.username?.trim(),
    });
  }

  static async delete(
    db: SupabaseClient,
    userId: string
  ) {
    return UserService.repository.delete(db, userId);
  }
}