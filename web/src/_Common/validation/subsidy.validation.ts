import * as yup from "yup";
import {
  SubsidyEmployeeUpdate,
  SubsidySubmitPrice,
} from "../interface/subsidy.interface";

const UserUpdateSubsidyValidation = yup.object().shape({
  uuid: yup.string().required("UUID Required"),
  applicable: yup.boolean().required("Applicable Required"),
  code: yup.number().required("Code Required"),
  subsidy_uuid: yup.string().required("Subsidy UUID Required"),
});

const SubsidySubmitPriceValidation = yup.object().shape({
  totalPrice: yup.number().required("Total Price Required"),
  price: yup.number().min(0.1).required("Price Required"),
  availableCredit: yup.number().min(0).required("Available Credit Required"),

  discount: yup.number().required("Discount Required"),
  code: yup.number().required("Code Required"),
  employee_id: yup.string().required("Employee ID Required"),
});

export function EmployeeUpdateSubsidyValidation(data: SubsidyEmployeeUpdate) {
  return UserUpdateSubsidyValidation.validate(data);
}

export function EmployeeSubmitPriceValidation(data: SubsidySubmitPrice) {
  return SubsidySubmitPriceValidation.validate(data);
}
