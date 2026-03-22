import { cookies } from "next/headers";
import { Decrypt } from "@/lib/utils";
import { NextRequest } from "next/server";

function checkToken(token?: string) {
  const password = process.env.PASSWORD;
  if (!password || !token) return false;
  try {
    const plain = Decrypt(token, password);
    return plain === password;
  } catch {
    return false;
  }
}

export function isAuthorizedByCookie() {
  const token = cookies().get("accessToken")?.value;
  return checkToken(token);
}

export function isAuthorizedRequest(req: NextRequest) {
  const token = req.cookies.get("accessToken")?.value;
  return checkToken(token);
}
