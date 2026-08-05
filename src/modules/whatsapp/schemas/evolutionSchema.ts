import { z } from 'zod';

export const evolutionConfigSchema = z.object({
  apiUrl: z
    .string()
    .min(1, 'A URL da Evolution API é obrigatória')
    .url('Informe uma URL válida (ex: https://api.suaevolution.com)'),
  apiKey: z
    .string()
    .min(1, 'A API Key é obrigatória'),
  instanceName: z
    .string()
    .min(1, 'O nome da instância é obrigatório'),
  webhookUrl: z
    .string()
    .url('URL do Webhook inválida')
    .or(z.literal(''))
    .optional(),
  connectedPhone: z
    .string()
    .min(10, 'Informe um número de telefone válido'),
});

export type EvolutionConfigSchemaType = z.infer<typeof evolutionConfigSchema>;
