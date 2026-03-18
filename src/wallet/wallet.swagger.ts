import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

const walletExample = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  userId: 'u1b2c3d4-e5f6-7890-abcd-ef1234567890',
  currency: 'NGN',
  balance: '49000.000000',
  updatedAt: '2026-03-18T10:00:00.000Z',
};

export const GetBalancesSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get all wallet balances',
      description: 'Returns one entry per currency the user holds.',
    }),
    ApiResponse({
      status: 200,
      description: 'List of wallet balances',
      schema: {
        example: {
          success: true,
          data: [
            { ...walletExample, currency: 'NGN', balance: '49000.000000' },
            { ...walletExample, currency: 'USD', balance: '31.250000' },
          ],
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Missing or invalid token' }),
    ApiResponse({ status: 403, description: 'Email not verified' }),
  );

export const FundWalletSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Fund NGN wallet',
      description:
        'Credits NGN to the user wallet. All funding is in NGN — use convert/trade to acquire other currencies.',
    }),
    ApiResponse({
      status: 201,
      description: 'Wallet funded',
      schema: {
        example: {
          success: true,
          data: { ...walletExample, currency: 'NGN', balance: '51000.000000' },
        },
      },
    }),
    ApiResponse({
      status: 409,
      description: 'Duplicate idempotency key',
      schema: { example: { statusCode: 409, message: 'Duplicate request — transaction already processed' } },
    }),
    ApiResponse({ status: 401, description: 'Missing or invalid token' }),
  );

export const ConvertSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Convert between any two currencies',
      description:
        'Deducts fromCurrency and credits toCurrency using real-time FX rates. NGN does not need to be involved.',
    }),
    ApiResponse({
      status: 201,
      description: 'Conversion successful — returns the credited (to) wallet',
      schema: {
        example: {
          success: true,
          data: { ...walletExample, currency: 'USD', balance: '31.250000' },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Insufficient balance or same currency pair',
      schema: { example: { statusCode: 400, message: 'Insufficient NGN balance' } },
    }),
    ApiResponse({
      status: 404,
      description: 'Source wallet not found',
      schema: { example: { statusCode: 404, message: 'No NGN wallet found' } },
    }),
    ApiResponse({
      status: 503,
      description: 'FX rates unavailable',
      schema: { example: { statusCode: 503, message: 'FX rates unavailable' } },
    }),
  );

export const TradeSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Trade NGN ↔ foreign currency',
      description:
        'Same as convert but restricted to pairs involving NGN. Used for explicit NGN trading flows.',
    }),
    ApiResponse({
      status: 201,
      description: 'Trade successful — returns the credited (to) wallet',
      schema: {
        example: {
          success: true,
          data: { ...walletExample, currency: 'USD', balance: '62.500000' },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Trade pair does not include NGN, or insufficient balance',
      schema: { example: { statusCode: 400, message: 'Trade must involve NGN on one side' } },
    }),
    ApiResponse({ status: 503, description: 'FX rates unavailable' }),
  );
