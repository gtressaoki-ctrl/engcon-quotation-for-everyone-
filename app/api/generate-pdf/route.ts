import { NextRequest, NextResponse } from 'next/server';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { QuoteTemplate } from '@/components/pdf/QuoteTemplate';
import { generateQuoteNumber } from '@/lib/quoteNumber';
import { uploadPdf } from '@/lib/pdfStorage';
import { createServiceClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const now = new Date();
    const quoteNumber = await generateQuoteNumber();
    const createdAt = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;

    const html = renderToStaticMarkup(
      createElement(QuoteTemplate, { state: body, quoteNumber, createdAt })
    );

    let chromium: typeof import('@sparticuz/chromium');
    let puppeteer: typeof import('puppeteer-core');

    if (process.env.NODE_ENV === 'production') {
      chromium = (await import('@sparticuz/chromium')).default as typeof import('@sparticuz/chromium');
      puppeteer = (await import('puppeteer-core')).default as typeof import('puppeteer-core');
    } else {
      const localPuppeteer = await import('puppeteer-core');
      puppeteer = localPuppeteer.default as typeof import('puppeteer-core');
      chromium = (await import('@sparticuz/chromium')).default as typeof import('@sparticuz/chromium');
    }

    const browser = await (puppeteer as any).launch({
      args: (chromium as any).args,
      defaultViewport: (chromium as any).defaultViewport,
      executablePath:
        process.env.NODE_ENV === 'production'
          ? await (chromium as any).executablePath()
          : process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(`<!DOCTYPE html>${html}`, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    const supabase = createServiceClient();
    let pdfPath: string | undefined;
    try {
      pdfPath = await uploadPdf(
        Buffer.from(pdfBuffer),
        quoteNumber,
        body.creator_company,
        body.creator_name,
        body.client_name
      );
    } catch {
      // Storage upload failure is non-fatal
    }

    const { data: quoteRecord } = await supabase
      .from('quotes')
      .insert({
        quote_number: quoteNumber,
        creator_type: body.creator_type,
        creator_company: body.creator_company,
        creator_name: body.creator_name,
        client_type: body.client_type,
        client_name: body.client_name,
        machine_condition: body.machine_condition,
        machine_maker: body.machine_maker,
        machine_model: body.machine_model,
        machine_year: body.machine_year || null,
        mount_type: body.mount_type,
        s_standard: body.s_standard,
        ec_model: body.ec_model,
        dc_system: body.dc_system,
        has_ict: body.has_ict,
        ict_maker: body.ict_maker || null,
        ict_model: body.ict_model || null,
        ict_note: body.ict_note || null,
        pallet_count: body.pallet_count,
        freight_cost: body.pallet_count * 35000,
        install_cost: body.install_cost,
        hose_parts_cost: body.hose_parts_cost,
        travel_cost: body.travel_unit_cost,
        travel_count: body.travel_count,
        guidance_cost: body.guidance_unit_cost,
        guidance_count: body.guidance_count,
        delivery_location: body.delivery_location || null,
        delivery_date: body.delivery_date || null,
        delivery_terms: body.delivery_terms,
        payment_terms: body.payment_terms,
        note: body.note || null,
        subtotal: body.subtotal,
        tax: body.tax,
        total: body.total,
        pdf_path: pdfPath || null,
        price_type: body.price_type,
      })
      .select('id')
      .single();

    if (quoteRecord) {
      const itemInserts = body.items.map((item: any, i: number) => ({
        quote_id: quoteRecord.id,
        sort_order: i + 1,
        item_no: item.item_no || null,
        name_ja: item.name_ja,
        list_price: item.list_price || null,
        qty: item.qty,
        unit_price: item.unit_price || null,
        amount: item.amount || null,
        is_custom: item.is_custom,
      }));
      await supabase.from('quote_items').insert(itemInserts);
    }

    return NextResponse.json({
      quoteNumber,
      quoteId: quoteRecord?.id,
      pdf: Buffer.from(pdfBuffer).toString('base64'),
    });
  } catch (err) {
    console.error('PDF generation error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
