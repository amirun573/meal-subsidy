import { prisma } from "../../../libs/prisma";

export async function LogApplicationError(source: string, error: unknown): Promise<void> {
  const issue = error instanceof Error ? error : new Error(String(error));
  try {
    await prisma.applicationLog.create({
      data: {
        level: "ERROR",
        source,
        message: issue.message,
        detail: issue.stack || null,
      },
    });
  } catch (logError) {
    // Logging must not replace the original API error.
    console.error("Unable to persist application log", logError);
  }
}
