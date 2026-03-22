const { z } = require('zod');
const { BaseValidationSchema } = require('./base');

const { number, date } = BaseValidationSchema;

/**
 * Схемы валидации для бронирований
 */

const createBookingSchema = z.object({
  body: z.object({
    master_id: number,
    service_id: number,
    start_time: z.string().datetime('Время начала должно быть в формате ISO'),
    end_time: z.string().datetime('Время окончания должно быть в формате ISO'),
    comment: z.string().max(500).optional(),
  }),
});

const updateBookingSchema = z.object({
  body: z.object({
    status: z.enum(['confirmed', 'cancelled', 'completed']).optional(),
    comment: z.string().max(500).optional(),
    master_comment: z.string().max(500).optional(),
  }),
});

const getBookingsQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).default('1'),
    limit: z.string().regex(/^\d+$/).default('20'),
    status: z.enum(['confirmed', 'cancelled', 'completed']).optional(),
    date_from: z.string().date().optional(),
    date_to: z.string().date().optional(),
  }),
});

const setAvailabilitySchema = z.object({
  body: z.object({
    master_id: number,
    date: date,
    start_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Время должно быть в формате HH:MM:SS'),
    end_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Время должно быть в формате HH:MM:SS'),
    slot_duration: z.number().int().positive().default(60),
    service_id: number.optional(),
  }),
});

const updateAvailabilitySchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID должен быть числом'),
  }),
  body: z.object({
    start_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/).optional(),
    end_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/).optional(),
    slot_duration: z.number().int().positive().optional(),
    is_available: z.boolean().optional(),
  }),
});

const createTimeSlotSchema = z.object({
  body: z.object({
    master_id: number,
    start_time: z.string().datetime(),
    end_time: z.string().datetime(),
    service_id: number.optional(),
    status: z.enum(['free', 'booked', 'blocked']).optional().default('free'),
  }),
});

const updateTimeSlotSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID должен быть числом'),
  }),
  body: z.object({
    start_time: z.string().datetime().optional(),
    end_time: z.string().datetime().optional(),
    status: z.enum(['free', 'booked', 'blocked']).optional(),
  }),
});

module.exports = {
  createBookingSchema,
  updateBookingSchema,
  getBookingsQuerySchema,
  setAvailabilitySchema,
  updateAvailabilitySchema,
  createTimeSlotSchema,
  updateTimeSlotSchema,
};
