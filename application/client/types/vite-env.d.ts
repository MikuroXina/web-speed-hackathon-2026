interface ImportMetaEnv {
  // whether the app is running in production
  readonly PROD: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
