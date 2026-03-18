import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const GetHistorySwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get transaction history',
      description: 'Returns all transactions for the authenticated user, ordered by most recent first.',
    }),
    ApiResponse({
      status: 200,
      description: 'Transaction history',
      schema: {
        example: {
          success: true,
          data: [
            {
              id: 't1b2c3d4-e5f6-7890-abcd-ef1234567890',
              userId: 'u1b2c3d4-e5f6-7890-abcd-ef1234567890',
              type: 'trade',
              fromCurrency: 'NGN',
              toCurrency: 'USD',
              fromAmount: '50000.000000',
              toAmount: '31.250000',
              rate: '0.000625',
              status: 'success',
              idempotencyKey: 'trade-2026-001',
              createdAt: '2026-03-18T10:05:00.000Z',
            },
            {
              id: 't2c3d4e5-f6a7-8901-bcde-f12345678901',
              userId: 'u1b2c3d4-e5f6-7890-abcd-ef1234567890',
              type: 'fund',
              fromCurrency: 'NGN',
              toCurrency: null,
              fromAmount: '50000.000000',
              toAmount: null,
              rate: null,
              status: 'success',
              idempotencyKey: 'fund-txn-2026-001',
              createdAt: '2026-03-18T10:00:00.000Z',
            },
          ],
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Missing or invalid token' }),
    ApiResponse({ status: 403, description: 'Email not verified' }),
  );
