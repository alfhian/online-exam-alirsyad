// src/supabase/supabase.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Global()
@Module({
  providers: [
    {
      provide: SupabaseClient,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>('SUPABASE_URL');
        const key =
          configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
          configService.get<string>('SUPABASE_KEY');

        if (!url || !key) {
          throw new Error('SUPABASE_URL and SUPABASE_KEY must be provided');
        }

        return createClient(url, key, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        });
      },
    },
  ],
  exports: [SupabaseClient],
})
export class SupabaseModule {}
