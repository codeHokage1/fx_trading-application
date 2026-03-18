import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const GetAnalyticsSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Platform analytics overview',
      description: 'Admin only. Returns user counts, transaction volumes by type, wallet balances by currency, and top active users.',
    }),
    ApiResponse({
      status: 200,
      description: 'Analytics data',
      schema: {
        example: {
          success: true,
          data: {
            users: { total: 120, verified: 98, unverified: 22 },
            transactions: [
              { type: 'fund', count: 300, totalVolume: '15000000.00' },
              { type: 'trade', count: 450, totalVolume: '8500000.00' },
              { type: 'convert', count: 210, totalVolume: '3200000.00' },
            ],
            wallets: [
              { currency: 'NGN', totalBalance: '12500000.00', walletCount: 120 },
              { currency: 'USD', totalBalance: '8200.50', walletCount: 75 },
            ],
            topActiveUsers: [
              { userId: 'uuid-here', transactionCount: 42 },
            ],
          },
        },
      },
    }),
    ApiResponse({ status: 403, description: 'Admin access required' }),
  );

export const GetAllUsersSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'List all users (paginated)', description: 'Admin only.' }),
    ApiResponse({
      status: 200,
      schema: {
        example: {
          success: true,
          data: {
            data: [{ id: 'uuid', email: 'user@example.com', isVerified: true, role: 'user', createdAt: '2026-03-18T10:00:00Z' }],
            total: 120,
            page: 1,
            limit: 20,
          },
        },
      },
    }),
  );

export const GetAllTransactionsSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'List all transactions (paginated, filterable)', description: 'Admin only. Filter by type with ?type=fund|convert|trade' }),
    ApiResponse({
      status: 200,
      schema: {
        example: {
          success: true,
          data: { data: [], total: 960, page: 1, limit: 20 },
        },
      },
    }),
  );
