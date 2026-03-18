import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const GetRatesSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get current FX rates',
      description:
        'Returns live exchange rates with USD as base. Rates are cached for 5 minutes. Falls back to last known rates if the external API is unavailable.',
    }),
    ApiResponse({
      status: 200,
      description: 'Current FX rates',
      schema: {
        example: {
          success: true,
          data: {
            base: 'USD',
            fetchedAt: '2026-03-18T10:00:00.000Z',
            rates: { NGN: 1601.5, USD: 1, EUR: 0.921, GBP: 0.787, CAD: 1.358, JPY: 149.5 },
          },
        },
      },
    }),
    ApiResponse({
      status: 503,
      description: 'FX rates unavailable and no cached fallback exists',
      schema: { example: { statusCode: 503, message: 'FX rates unavailable' } },
    }),
    ApiResponse({ status: 401, description: 'Missing or invalid token' }),
  );
