import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const GetHistorySwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get transaction history',
      description: 'Returns all transactions for the authenticated user, ordered by most recent first. Supports pagination via ?page=1&limit=20 query params.',
    }),
    ApiResponse({
      status: 200,
      description: 'Transaction history',
      schema: {
        example: {
          success: true,
          data: {
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
            ],
            total: 1,
            page: 1,
            limit: 20,
          },
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Missing or invalid token' }),
    ApiResponse({ status: 403, description: 'Email not verified' }),
  );
