'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { DEALER_ROLE } from '@/lib/dealerAuth';

// 閲覧者がディーラーかどうか。ディーラー＝在庫数量は非表示、それ以外（G.TRES/管理者）＝表示。
// 判定確定までは true（安全側＝数量を出さない）で扱う。
export function useViewerIsDealer(): boolean {
  const [isDealer, setIsDealer] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const role = (session?.user?.user_metadata as { role?: string } | undefined)?.role;
      setIsDealer(role === DEALER_ROLE);
    }).catch(() => setIsDealer(true));
  }, []);
  return isDealer;
}
