import { authenticator } from 'otplib';
import { generate, validate } from '../src/totpUtility';

describe('TOTP utility test suite', () => {
  const randomSecret = () => (Math.random() + 1).toString(36).substring(2);
  test('It should validate a secret', () => {
    const secret = randomSecret();
    const authenticatorToken = generate(secret);
    const { isValid, hasError, error } = validate({
      secret,
      token: authenticatorToken,
    });
    expect(isValid).toBeTruthy();
    expect(hasError).toBeFalsy();
    expect(error).toBeUndefined();
  });

  test('It should not be valid when the secret is invalid', () => {
    const validSecret = randomSecret();
    const invalidSecret = randomSecret();
    const authenticatorToken = generate(validSecret);
    const { isValid, hasError, error } = validate({
      secret: invalidSecret,
      token: authenticatorToken,
    });
    expect(isValid).toBeFalsy();
    expect(hasError).toBeFalsy();
    expect(error).toBeUndefined();
  });

  test('It should fail when the secret check fails', () => {
    const secret = randomSecret();
    const mockCheck = jest.fn();
    const validationError = 'validation failed';
    mockCheck.mockImplementation(() => {
      throw new Error(validationError);
    });
    jest.spyOn(authenticator, 'check').mockImplementation(mockCheck);

    const authenticatorToken = generate('test');
    const { isValid, hasError, error } = validate({
      secret,
      token: authenticatorToken,
    });
    expect(isValid).toBeFalsy();
    expect(hasError).toBeTruthy();
    expect(error).toBe(validationError);
    expect(authenticator.check).toThrow(validationError);
  });
});
