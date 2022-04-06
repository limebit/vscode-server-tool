import { LoaderFunction, redirect } from "remix";
import { db } from "../utils/prisma.server";
import { getUserId } from "../utils/session.server";

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);

  if (request.headers.get("x-forwarded-prefix") == null) {
    return redirect("", 404);
  }

  const containerId = request.headers.get("x-forwarded-prefix")?.substring(1);

  const container = await db.repository.findFirst({
    where: { id: containerId },
  });

  if (!container) {
    return redirect("", 404);
  }

  return container.userId == userId ? redirect("", 200) : redirect("", 401);
};
