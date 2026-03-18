import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const RegisterSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Register a new user',
      description: 'Creates an account and sends a 6-digit OTP to the provided email.',
    }),
    ApiResponse({
      status: 201,
      description: 'Registration successful',
      schema: {
        example: {
          success: true,
          data: { message: 'Registration successful. Check your email for the OTP.' },
        },
      },
    }),
    ApiResponse({
      status: 409,
      description: 'Email already registered',
      schema: { example: { statusCode: 409, message: 'Email already registered', error: 'Conflict' } },
    }),
    ApiResponse({
      status: 400,
      description: 'Validation error',
      schema: {
        example: {
          statusCode: 400,
          message: ['email must be an email', 'password must be longer than or equal to 8 characters'],
          error: 'Bad Request',
        },
      },
    }),
  );

export const VerifyOtpSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Verify OTP to activate account',
      description: 'Submit the 6-digit OTP received by email. OTP expires in 10 minutes.',
    }),
    ApiResponse({
      status: 200,
      description: 'Account verified',
      schema: { example: { success: true, data: { message: 'Email verified successfully' } } },
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid or expired OTP',
      schema: { example: { statusCode: 400, message: 'OTP expired', error: 'Bad Request' } },
    }),
  );

export const LoginSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Login and receive JWT',
      description: 'Returns a Bearer token to use on all protected endpoints.',
    }),
    ApiResponse({
      status: 200,
      description: 'Login successful',
      schema: {
        example: {
          success: true,
          data: { accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Invalid credentials or unverified account',
      schema: { example: { statusCode: 401, message: 'Invalid credentials', error: 'Unauthorized' } },
    }),
  );

export const ResendOtpSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Resend OTP',
      description: 'Request a fresh OTP if the previous one expired. Rate-limited to 5 requests per minute.',
    }),
    ApiResponse({
      status: 200,
      description: 'OTP resent',
      schema: { example: { success: true, data: { message: 'OTP resent. Check your email.' } } },
    }),
    ApiResponse({ status: 400, description: 'Account already verified' }),
    ApiResponse({ status: 404, description: 'User not found' }),
    ApiResponse({ status: 429, description: 'Too many requests', schema: { example: { statusCode: 429, message: 'ThrottlerException: Too Many Requests' } } }),
  );
