/* eslint-disable @typescript-eslint/no-empty-object-type */
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

declare global {
  interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
    readonly VITE_SUPABASE_PROJECT_ID: string;
    [key: string]: string | undefined;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};
