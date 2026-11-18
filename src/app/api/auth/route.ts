import { NextRequest } from "next/server";
import { AuthController } from "../../../controllers/auth.controller";
import { authenticateRequest } from "../../../middlewares/auth.middleware";

export async function GET(request: NextRequest) {
  const result = authenticateRequest(request);

  if (!result.authenticated) {
    return result.response;
  }

  return AuthController.checkPermission(result.user);
}
