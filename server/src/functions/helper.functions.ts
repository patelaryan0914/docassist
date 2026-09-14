export const isMobileNumber = (mobileNumber: string): boolean => {
  const mobileNumberPattern = /^[6-9]\d{9}$/;
  return mobileNumberPattern.test(mobileNumber);
};

export const isEmail = (email: string): boolean => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
};
