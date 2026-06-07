import { NextRequest, NextResponse } from 'next/server';
import { generateQuoteNumber } from '@/lib/quoteNumber';
import { createServiceClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const quoteNumber = await generateQuoteNumber();
    const supabase = createServiceClient();

    const { data: quoteRecord } = await supabase
      .from('quotes')
      .insert({
        quote_number:     quoteNumber,
        creator_type:     body.creator_type,
        creator_company:  body.creator_company,
        creator_name:     body.creator_name,
        client_type:      body.client_type,
        client_name:      body.client_name,
        machine_condition: body.machine_condition,
        machine_maker:    body.machine_maker,
        machine_model:    body.machine_model,
        machine_year:     body.machine_year || null,
        mount_type:       body.mount_type,
        s_standard:       body.s_standard,
        ec_model:         body.ec_model,
        dc_system:        body.dc_system,
        has_ict:          body.has_ict,
        ict_maker:        body.ict_maker || null,
        ict_model:        body.ict_model || null,
        ict_note:         body.ict_note || null,
        pallet_count:     body.pallet_count,
        freight_cost:     body.pallet_count * 35000,
        install_cost:     body.install_cost,
        hose_parts_cost:  body.hose_parts_cost,
        travel_cost:      body.travel_unit_cost,
        travel_count:     body.travel_count,
        guidance_cost:    body.guidance_unit_cost,
        guidance_count:   body.guidance_count,
        delivery_location: body.delivery_location || null,
        delivery_date:    body.delivery_date || null,
        delivery_terms:   body.delivery_terms,
        payment_terms:    body.payment_terms,
        note:             body.note || null,
        subtotal:         body.subtotal,
        tax:              body.tax,
        total:            body.total,
        pdf_path:         null,
        price_type:       body.price_type,
      })
      .select('id')
      .single();

    if (quoteRecord) {
      const itemInserts = (body.items ?? []).map((item: any, i: number) => ({
        quote_id:   quoteRecord.id,
        sort_order: i + 1,
        item_no:    item.item_no || null,
        name_ja:    item.name_ja,
        list_price: item.list_price || null,
        qty:        item.qty,
        unit_price: item.unit_price || null,
        amount:     item.amount || null,
        is_custom:  item.is_custom,
      }));
      await supabase.from('quote_items').insert(itemInserts);
    }

    return NextResponse.json({
      quoteNumber,
      quoteId: quoteRecord?.id,
    });
  } catch (err) {
    console.error('Quote save error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
