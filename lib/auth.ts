import { NextRequest } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "rahasia";

interface UserJwtPayload extends JwtPayload {
  id: number;
  username: string;
  nama: string;
  level: string;
  kelompokId?: number | null;
}

export function getUserFromRequest(
  req: Request | NextRequest
): UserJwtPayload | null {
  try {
    const authHeader = req.headers.get("authorization");

    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : req.headers.get("cookie")?.split("token=")[1]?.split(";")[0];

    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as UserJwtPayload;

    return decoded;
  } catch (error) {
    console.error("JWT Error:", error);
    return null;
  }
}