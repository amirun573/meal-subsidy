import { Prisma, Subsidy } from "@prisma/client";
import { prisma } from "../../../../../libs/prisma";
import {
  PrismaCondtionFetch,
  PrismaUpdate,
} from "@/_Common/interface/database.interface";

export async function GetSubsidySingle(data: PrismaCondtionFetch) {
  try {
    const { where, select } = data;

    return prisma.subsidy.findFirst({
      where,
      select,
    });
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function UpdateSubsidy(object: PrismaUpdate) {
  try {
    const { data, prismaTransaction } = object;

    const { subsidy_id, ...dataWithoutSubsidyId }: any = data;

    if (!prismaTransaction) {
      return await prisma.subsidy.update({
        data: dataWithoutSubsidyId,
        where: {
          subsidy_id,
        },
      });
    } else {
      return await prismaTransaction.subsidy.update({
        data: dataWithoutSubsidyId,
        where: {
          subsidy_id,
        },
      });
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function GetSubsidyTypeSingle(data: PrismaCondtionFetch) {
  try {
    const { where, select } = data;

    return prisma.subsidyType.findFirst({
      where,
      select,
    });
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function CreateSubsidy_4User(object: {
  data: Subsidy;
  prismaTransaction?: any;
}) {
  try {
    const { data, prismaTransaction } = object;

    if (!prismaTransaction) {
      return prisma.subsidy.create({
        data,
      });
    } else {
      return prismaTransaction.subsidy.create({
        data,
      });
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}
