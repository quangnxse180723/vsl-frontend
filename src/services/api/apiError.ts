// Rut message loi tu response cua BE. Uu tien message cua tung truong (loi
// validation @Valid -> errors[].message, vd "Mat khau phai tu 8 den 12 ky tu"),
// roi den message tong quat, cuoi cung la fallback mac dinh.
export function getApiErrorMessage(err: any, fallback: string): string {
  const data = err?.response?.data;
  const fieldMsg = data?.errors?.[0]?.message;
  if (typeof fieldMsg === 'string' && fieldMsg.trim()) return fieldMsg;
  const msg = data?.message;
  return typeof msg === 'string' && msg.trim() ? msg : fallback;
}

// Ma loi nghiep vu tu BE (ErrorResponse.code / .error), de phan biet loai loi.
export function getApiErrorCode(err: any): string | undefined {
  return err?.response?.data?.code || err?.response?.data?.error;
}
