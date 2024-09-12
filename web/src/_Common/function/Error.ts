export function DisplayAlert(error: any) {
  alert(
    error?.response?.data?.message || error?.message || "Something Goes Wrong"
  );
}
