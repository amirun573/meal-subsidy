import * as yup from "yup";
import { SubsidyEmployeeUpdate } from "../interface/subsidy.interface";

const UserUpdateSubsidyValidation = yup.object().shape({
  uuid: yup.string().required("UUID Required"),
  applicable: yup.boolean().required("Applicable Required"),
  code: yup.number().required("Code Required"),
  subsidy_uuid: yup.string().required("Subsidy UUID Required"),
});

export function EmployeeUpdateSubsidyValidation(data: SubsidyEmployeeUpdate) {
  return UserUpdateSubsidyValidation.validate(data);
}
