import { User, UserDetails } from "@prisma/client";
import { PrismaCondtionFetch } from "@/_Common/interface/database.interface";
import { prisma } from "../../../../../libs/prisma";
import { PaginationData } from "@/_Common/interface/pagination.interface";

export async function GetUserSingle(
  data: PrismaCondtionFetch
): Promise<Partial<User> | null> {
  try {
    const { where, select } = data;

    return prisma.user.findFirst({
      where,
      select,
    });
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function GetTotalUser(data: PrismaCondtionFetch) {
  try {
    const { where } = data;

    return prisma.user.count({
      where,
    });
  } catch (error) {
    console.error(error);
    return 0;
  }
}

export async function GetUserPagination(options: {
  paginate: PaginationData;
  select?: any;
  where: any;
  orderBy?: { field: string; direction: "asc" | "desc" };
}) : Promise<any>{
  try {
    const { paginate, select, where, orderBy } = options;

    const limit = 10;
    const skip = (paginate.page - 1) * limit;

    return await prisma.user.findMany({
      skip: skip >= paginate.totalItems ? 0 : skip,
      take: Math.min(limit, paginate.totalItems - skip),
      where,
      select,
      orderBy: orderBy ? { [orderBy.field]: orderBy.direction } : undefined,
    });

    //const page = data.get("page");
  } catch (error) {
    return null;
  }
}
