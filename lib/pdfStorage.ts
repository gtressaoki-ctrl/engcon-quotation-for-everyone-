import { createServiceClient } from './supabase';

export async function uploadPdf(
  pdfBuffer: Buffer,
  quoteNumber: string,
  creatorCompany: string,
  creatorName: string,
  clientName: string
): Promise<string> {
  const supabase = createServiceClient();
  const now = new Date();
  const yyyymm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const fileName = `${quoteNumber}_${clientName}.pdf`;
  const path = `${creatorCompany}/${creatorName}/${yyyymm}/${fileName}`;

  const { error } = await supabase.storage
    .from('quotes')
    .upload(path, pdfBuffer, { contentType: 'application/pdf', upsert: true });

  if (error) throw error;
  return path;
}
