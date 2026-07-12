// Bo quy tac validate dung chung cho toan bo form nhap lieu.
// Cac ham tra ve chuoi loi (tieng Viet) hoac '' neu hop le.
// Quy tac khop voi rang buoc @Valid o backend (RegisterRequest, v.v.).

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Toi thieu 1 chu thuong, 1 chu hoa, 1 chu so
export const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

/** Bat buoc nhap (khong tinh khoang trang). */
export function validateRequired(value: string, label: string): string {
  return value.trim() ? '' : `${label} không được để trống.`;
}

/** Bat buoc + gioi han do dai toi da. */
export function validateText(value: string, label: string, max?: number): string {
  const t = value.trim();
  if (!t) return `${label} không được để trống.`;
  if (max != null && value.length > max) return `${label} tối đa ${max} ký tự.`;
  return '';
}

/** Email: bat buoc, dung dinh dang, toi da 255. */
export function validateEmail(value: string): string {
  const t = value.trim();
  if (!t) return 'Email không được để trống.';
  if (value.length > 255) return 'Email tối đa 255 ký tự.';
  if (!EMAIL_RE.test(t)) return 'Email không đúng định dạng.';
  return '';
}

/** Ten hien thi (username): bat buoc, 3-50 ky tu. */
export function validateUsername(value: string): string {
  const t = value.trim();
  if (!t) return 'Tên hiển thị không được để trống.';
  if (t.length < 3 || t.length > 50) return 'Tên hiển thị phải từ 3 đến 50 ký tự.';
  return '';
}

/** Ho va ten (fullName): bat buoc, toi da 255. */
export function validateFullName(value: string): string {
  const t = value.trim();
  if (!t) return 'Họ và tên không được để trống.';
  if (value.length > 255) return 'Họ và tên tối đa 255 ký tự.';
  return '';
}

/** Mat khau moi: bat buoc, 8-12 ky tu, co chu thuong + chu hoa + so. */
export function validatePassword(value: string): string {
  if (!value) return 'Mật khẩu không được để trống.';
  if (value.length < 8 || value.length > 12) return 'Mật khẩu phải từ 8 đến 12 ký tự.';
  if (!PASSWORD_RE.test(value)) return 'Mật khẩu phải chứa chữ thường, chữ hoa và số.';
  return '';
}

/** So nguyen khong am (vd Expected ID cua model AI). */
export function validateNonNegativeInt(value: string, label: string): string {
  const t = value.trim();
  if (!t) return `${label} không được để trống.`;
  if (!/^\d+$/.test(t)) return `${label} phải là số nguyên không âm.`;
  return '';
}

/** True neu moi gia tri trong object loi deu rong (form hop le). */
export function isFormValid(errors: Record<string, string>): boolean {
  return Object.values(errors).every(e => !e);
}
