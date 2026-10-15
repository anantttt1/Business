/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BRAND_NAME: string
  readonly VITE_WHATSAPP_NUMBER: string
  readonly VITE_CONTACT_EMAIL: string
  readonly VITE_GOOGLE_FORM_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.css' {
  const css: string
  export default css
}
