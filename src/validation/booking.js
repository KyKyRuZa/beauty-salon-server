const { z } = require('zod');
const { BaseValidationSchema } = require('./base');

// Схема валидации для временного слота
const timeSlotValidationSchema = z.object({
  master_id: BaseValidationSchema.number,
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  status: z.enum(['free', 'booked', 'blocked']).default('free'),
}).refine((data) => new Date(data.end_time) > new Date(data.start_time), {
  message: 'Время окончания должно быть позже времени начала',
});

// Схема валидации для бронирования
const bookingValidationSchema = z.object({
  user_id: BaseValidationSchema.number,
  service_template_id: BaseValidationSchema.number,
  master_id: BaseValidationSchema.number,
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).default('confirmed'),
}).refine((data) => new Date(data.end_time) > new Date(data.start_time), {
  message: 'Время окончания должно быть позже времени начала',
});

// Схема валидации для заказа
const orderValidationSchema = z.object({
  user_id: BaseValidationSchema.number,
  service_template_id: BaseValidationSchema.number,
  booking_id: BaseValidationSchema.number.optional(),
  total_amount: z.number().min(0),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'refunded']).default('pending'),
});

// Схема валидации для доступности мастера
const masterAvailabilityValidationSchema = z.object({
  master_id: BaseValidationSchema.number,
  service_template_id: BaseValidationSchema.number,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Дата должна быть в формате YYYY-MM-DD'),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Время должно быть в формате HH:MM'),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Время должно быть в формате HH:MM'),
  is_available: z.boolean().default(true),
}).refine((data) => {
  // Проверка, что end_time позже start_time
  const [startHours, startMinutes] = data.start_time.split(':').map(Number);
  const [endHours, endMinutes] = data.end_time.split(':').map(Number);
  
  return (endHours * 60 + endMinutes) > (startHours * 60 + startMinutes);
}, {
  message: 'Время окончания должно быть позже времени начала',
});

module.exports = {
  timeSlotValidationSchema,
  bookingValidationSchema,
  orderValidationSchema,
  masterAvailabilityValidationSchema,
};