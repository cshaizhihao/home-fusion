import { cookies } from "next/headers";
import { Decrypt } from "@/lib/utils";

export function isAuthorizedByCookie() {
  const password = process.env.PASSWORD;
  if (!password) return false;

  const token = cookies().get("accessToken")?.value;
  if (!token) return false;

  try {
    const plain = Decrypt(token, password);
    return plain === password;
  } catch {
    return false;
  }
}
