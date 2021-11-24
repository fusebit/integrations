import { authenticator } from 'otplib';

export interface ITOTPOptions {
  secret: string;
  token: string;
}

export interface ITOTPCheckResult {
  isValid: boolean;
  hasError: boolean;
  error?: string;
}

export const validate = (options: ITOTPOptions): ITOTPCheckResult => {
  try {
    const isValid = authenticator.check(options.token, options.secret);
    return {
      isValid,
      hasError: false,
    };
  } catch (error) {
    return {
      isValid: false,
      hasError: true,
      error: (error as Error)?.message,
    };
  }
};

export const generate = (secret: string): string => {
  return authenticator.generate(secret);
};
