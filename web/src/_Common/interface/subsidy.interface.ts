import { StatusAPICode } from "../enum/status-api-code.enum";

export interface SubsidyEmployeeUpdate {
  uuid: string;
  applicable: boolean;
  [StatusAPICode.code]: StatusAPICode;
  subsidy_uuid: string;
}

export interface SubsidySubmitPrice {
  totalPrice: number;
  price: number;
  availableCredit: number;
  discount: number;
  employee_id: string;
  [StatusAPICode.code]: StatusAPICode;
  subsidyCreditUUID: string;
}

export interface SubsidyTransactionPaginationRequest {
  page: number;
  filter: string | null;
  startDate: string | null;
  endDate: string | null;

}
