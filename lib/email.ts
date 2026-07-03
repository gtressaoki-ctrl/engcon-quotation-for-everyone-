import { Resend } from 'resend';

const NOTIFY_TO = 'g.tres.saoki@gmail.com';
const FROM = 'engcon見積システム <onboarding@resend.dev>';

export async function sendDealerQuoteNotification(params: {
  quoteNumber: string;
  creatorCompany: string;
  creatorName: string;
  clientName: string;
  total: number;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set; skipping quote notification email');
    return;
  }

  const resend = new Resend(apiKey);
  const { quoteNumber, creatorCompany, creatorName, clientName, total } = params;

  // 送信元ドメインが未検証のResend環境では、社外アドレスをCC/Toに含めると
  // 送信ごと失敗し得る。通知はResendアカウント登録済みのG.TRES宛(To)のみに送り、
  // 確実に届くようにする（ディーラーへの控えはアプリ側で見返せる想定）。
  await resend.emails.send({
    from: FROM,
    to: NOTIFY_TO,
    subject: `【見積作成通知】${creatorCompany} - ${quoteNumber}`,
    text: [
      'ディーラーによる見積が作成されました。',
      '',
      `見積番号：${quoteNumber}`,
      `作成会社：${creatorCompany}`,
      `担当者名：${creatorName}`,
      `見積先：${clientName}`,
      `合計金額：¥${total.toLocaleString()}`,
    ].join('\n'),
  });
}
