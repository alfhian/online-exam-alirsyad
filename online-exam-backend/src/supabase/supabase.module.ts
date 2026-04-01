// src/supabase/supabase.module.ts
import { Module, Global } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Global()
@Module({
  providers: [
    {
      provide: SupabaseClient,
      useFactory: () => {
        const url = process.env.SUPABASE_URL!;
        const key =
          process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY!;
        return createClient(url, key);
      },
    },
  ],
  exports: [SupabaseClient],
})
export class SupabaseModule {}
