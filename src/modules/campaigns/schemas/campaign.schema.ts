import { z } from 'zod';

const phoneRegex = /^55\d{10,11}$/;

export const campaignFormSchema = z.object({
  name: z
    .string()
    .min(3, 'Nome deve ter ao menos 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),

  description: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional(),

  instanceId: z
    .string()
    .min(1, 'Selecione uma instância WhatsApp'),

  templateText: z
    .string()
    .min(20, 'Mensagem deve ter ao menos 20 caracteres')
    .max(1000, 'Mensagem deve ter no máximo 1000 caracteres')
    .refine(
      (text) => /\{\{nome\}\}/i.test(text) || /\{\{nome_completo\}\}/i.test(text),
      'A mensagem deve conter {{nome}} ou {{nome_completo}} para personalização'
    ),

  delayMinMs: z
    .number()
    .min(30000, 'Intervalo mínimo: 30 segundos')
    .default(45000),

  delayMaxMs: z
    .number()
    .max(600000, 'Intervalo máximo: 10 minutos')
    .default(180000),

  batchSize: z
    .number()
    .min(1, 'Mínimo: 1 por lote')
    .max(25, 'Máximo: 25 por lote')
    .default(20),

  scheduledAt: z.date().nullable().optional(),
});

export const contactImportSchema = z.object({
  phone: z
    .string()
    .transform(v => v.replace(/\D/g, ''))
    .pipe(
      z.string().regex(phoneRegex, 'Telefone deve estar no formato: 55 + DDD + número')
    ),
  name: z.string().min(2, 'Nome obrigatório'),
  company: z.string().optional(),
  city: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  taxRegime: z.string().optional(),
  socialCapital: z.string().optional(),
});

export type CampaignFormValues = z.infer<typeof campaignFormSchema>;
export type ContactImportValues = z.infer<typeof contactImportSchema>;
