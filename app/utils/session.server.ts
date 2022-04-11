import { createCookieSessionStorage, redirect } from "remix";
import bcrypt from "bcrypt";

import { db } from "./prisma.server";
import { encrypt } from "./encryption.server";

type LoginForm = {
  username: string;
  password: string;
};

type RegisterForm = {
  username: string;
  password: string;
  token: string;
};

type UpdateForm = {
  userId: string;
  username: string;
  password: string;
  token: string;
};

export async function register({ username, password, token }: RegisterForm) {
  const passwordHash = await bcrypt.hash(password, 10);
  const githubToken = encrypt(token);
  const user = await db.user.create({
    data: { username, githubToken, passwordHash },
  });
  return user;
}

export async function update({
  userId,
  username,
  password,
  token,
}: UpdateForm) {
  await db.user.update({
    where: { id: userId },
    data: {
      username: username ? username : undefined,
      githubToken: token ? encrypt(token) : undefined,
      passwordHash: password ? await bcrypt.hash(password, 10) : undefined,
    },
  });
  throw redirect("/logout");
}

export async function login({ username, password }: LoginForm) {
  const user = await db.user.findUnique({ where: { username } });
  if (!user) return null;
  const isCorrectPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isCorrectPassword) return null;
  return user;
}

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set");
}

// eslint-disable-next-line @typescript-eslint/unbound-method
const { getSession, commitSession, destroySession } =
  createCookieSessionStorage({
    cookie: {
      name: "RJ_session",
      // Replace with true if run with https
      secure: false,
      secrets: [sessionSecret],
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
    },
  });

export function getUserSession(request: Request) {
  return getSession(request.headers.get("Cookie"));
}

export async function getUserId(request: Request) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") return null;
  return userId;
}

export async function requireUserId(request: Request) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") throw redirect("/login");
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw redirect("/login");
  return userId;
}

export async function requireUser(request: Request) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") throw redirect("/login");
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw redirect("/login");
  return user;
}

export async function requireAdminId(request: Request) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") throw redirect("", 404);
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.status != "admin") throw redirect("", 404);
  return userId;
}

export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (typeof userId !== "string") return null;

  try {
    const user = await db.user.findUnique({ where: { id: userId } });
    return user;
  } catch {
    throw logout(request);
  }
}

export async function logout(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  return redirect("/login", {
    headers: { "Set-Cookie": await destroySession(session) },
  });
}

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await getSession();
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: { "Set-Cookie": await commitSession(session) },
  });
}
