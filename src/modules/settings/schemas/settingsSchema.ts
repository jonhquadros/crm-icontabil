import { z } from 'zod';

export const companyProfileSchema = z.object({
  name: z.string().min(2, 'O nome do escritório deve ter pelo menos 2 caracteres'),
  cnpj: z.string().optional(),
  email: z.string().email('E-mail corporativo inválido').or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url('URL do website inválida').or(z.literal('')).optional(),
  logoUrl: z.string().url('URL do logotipo inválida').or(z.literal('')).optional(),
});

export const securitySettingsSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres').optional().or(z.literal('')),
  confirmPassword: z.string().optional(),
  twoFactor: z.boolean(),
  sessionTimeout: z.string(),
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: 'A nova senha e a confirmação não coincidem',
  path: ['confirmPassword'],
});

export const whatsAppIntegrationSchema = z.object({
  enabled: z.boolean(),
  apiUrl: z.string().url('URL da API do WhatsApp inválida').or(z.literal('')),
  apiKey: z.string().min(1, 'Chave de API do WhatsApp é obrigatória se ativado').or(z.literal('')),
  instanceName: z.string().optional(),
});

export const webhookIntegrationSchema = z.object({
  enabled: z.boolean(),
  endpointUrl: z.string().url('URL do Webhook inválida').or(z.literal('')),
  secretKey: z.string().optional(),
});

export const smtpIntegrationSchema = z.object({
  enabled: z.boolean(),
  host: z.string().min(1, 'Host SMTP é obrigatório').or(z.literal('')),
  port: z.number().int().positive('Porta SMTP inválida'),
  username: z.string().optional(),
  secure: z.boolean(),
  senderEmail: z.string().email('E-mail do remetente inválido').or(z.literal('')),
});

export type CompanyProfileSchemaType = z.infer<typeof companyProfileSchema>;
export type SecuritySettingsSchemaType = z.infer<typeof securitySettingsSchema>;
export type WhatsAppIntegrationSchemaType = z.infer<typeof whatsAppIntegrationSchema>;
