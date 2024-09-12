import { StatusAPICode } from "../enum/status-api-code.enum";

export interface SubsidyEmployeeUpdate {
  uuid: string;
  applicable: boolean;
  [StatusAPICode.code]: StatusAPICode;
  subsidy_uuid: string;
}
