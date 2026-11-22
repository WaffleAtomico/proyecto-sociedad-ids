import { describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import {
  extractToken,
  generateJWT,
  verifyToken,
} from "../../src/utils/jwt_generator";
import { UserType } from "../../src/types/enums";

const payload = {
  id: "user-1",
  email: "user@iteso.mx",
  name: "User",
  role: UserType.REGULAR_USER,
};

describe("jwt_generator", () => {
  it("generates and verifies a token", () => {
    const token = generateJWT(payload);
    const decoded = verifyToken(token);

    expect(decoded).toMatchObject(payload);
  });

  it("accepts a Bearer-prefixed token", () => {
    const token = generateJWT(payload);

    expect(verifyToken(`Bearer ${token}`)).toMatchObject(payload);
  });

  it("rejects invalid tokens", () => {
    expect(verifyToken(null)).toBeNull();
    expect(verifyToken("invalid")).toBeNull();
    expect(verifyToken(jwt.sign({ id: "1" }, "wrong-secret"))).toBeNull();
    expect(
      verifyToken(
        jwt.sign(
          { id: "1", email: "a@b.c", name: "A", role: "UNKNOWN" },
          process.env.SECRET!
        )
      )
    ).toBeNull();
  });

  it("extracts tokens from headers, query and cookies", () => {
    expect(
      extractToken({ headers: { authorization: "Bearer abc" } })
    ).toBe("abc");
    expect(extractToken({ headers: { authorization: "Basic abc" } })).toBeNull();
    expect(extractToken({ query: { token: "query-token" } })).toBe(
      "query-token"
    );
    expect(extractToken({ cookies: { token: "cookie-token" } })).toBe(
      "cookie-token"
    );
    expect(extractToken({})).toBeNull();
  });
});
