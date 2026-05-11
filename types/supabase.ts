/**
 * Auto-generate this file from your Supabase project after running the schema.
 *
 * Run this command (replace YOUR_PROJECT_ID):
 *   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts
 *
 * Or from the Supabase dashboard:
 *   Project Settings → API → TypeScript types → Download
 *
 * For now this is a placeholder so the project compiles.
 */

export type Database = {
  public: {
    Tables: Record<string, any>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
