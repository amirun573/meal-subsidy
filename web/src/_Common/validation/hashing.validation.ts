import * as yup from "yup";

const PasswordHashingValidation = yup.object().shape({
  password: yup.string().required("UUID Required"),
});

export function PasswordPassValidation(data: { password: string }) {
  return PasswordHashingValidation.validate(data);
}
