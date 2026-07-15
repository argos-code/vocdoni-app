import { reactComponentsNamespace, reactComponentsResources } from '@vocdoni/react-components'
import { format, formatDistance, Locale } from 'date-fns'
import i18next, { i18n as I18nInstance } from 'i18next'
import BrowserLanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { ucfirst } from '~utils/strings'
import { baseLanguages } from './languages'
import { dateLocales } from './locales'

// English is the fallback language and must always be available synchronously — at
// init time, before BrowserLanguageDetector resolves, and in tests. All other locale
// files are loaded lazily on demand (see fetchLanguageData / loadLanguageInto).
import enCommon from './locales/en/common.json'
import enReactComponents from './locales/en/react-components.json'

const allLanguages = Object.keys(baseLanguages)
const DEFAULT_FALLBACK_LANGUAGE = 'en'
const defaultNamespaces = ['common', reactComponentsNamespace]
const isTestEnv = typeof process !== 'undefined' && (process.env.VITEST === 'true' || process.env.NODE_ENV === 'test')

/** Runtime-driven language configuration passed from the app's env. */
export type LanguageOptions = {
  supportedLanguages: string[]
  fallbackLanguage: string
}

const defaultLanguageOptions: LanguageOptions = {
  supportedLanguages: allLanguages,
  fallbackLanguage: DEFAULT_FALLBACK_LANGUAGE,
}

type DebugOptions = {
  isDev: boolean
  isTestEnv: boolean
  isBrowser: boolean
}

export const shouldEnableI18nDebug = ({ isDev, isTestEnv, isBrowser }: DebugOptions) => isDev && !isTestEnv && isBrowser

// Build the combined resource bundles for a single language from pre-loaded JSON data.
const buildLangResources = (lang: string, common: Record<string, unknown>, rcComponents: Record<string, unknown>) => {
  const componentResources = reactComponentsResources[lang as keyof typeof reactComponentsResources]
  return {
    common,
    [reactComponentsNamespace]: {
      ...(componentResources?.[reactComponentsNamespace] ?? {}),
      ...rcComponents,
    },
  }
}

// Glob patterns evaluated at build time by Vite — each match becomes a separate
// lazy chunk.  English is also matched but handled via the static import above,
// so its glob loader is never called (hasResourceBundle guards against it).
const commonGlob = import.meta.glob<{ default: Record<string, unknown> }>('./locales/*/common.json')
const rcGlob = import.meta.glob<{ default: Record<string, unknown> }>('./locales/*/react-components.json')

// Per-language raw-data cache so each language is fetched at most once, even if
// multiple instances request the same language concurrently.
const languageDataCache = new Map<
  string,
  Promise<{ common: Record<string, unknown>; rcComponents: Record<string, unknown> }>
>()

const fetchLanguageData = (lang: string) => {
  if (!languageDataCache.has(lang)) {
    const commonLoader = commonGlob[`./locales/${lang}/common.json`]
    const rcLoader = rcGlob[`./locales/${lang}/react-components.json`]

    if (!commonLoader || !rcLoader) {
      return Promise.reject(new Error(`[i18n] No locale files for language: ${lang}`))
    }

    languageDataCache.set(
      lang,
      Promise.all([commonLoader(), rcLoader()])
        .then(([common, rc]) => ({ common: common.default, rcComponents: rc.default }))
        .catch((err) => {
          languageDataCache.delete(lang)
          return Promise.reject(err)
        })
    )
  }
  return languageDataCache.get(lang)!
}

// Load a language into an i18n instance if it isn't already registered.
// Idempotent and safe to call concurrently — the data cache prevents duplicate fetches.
// Falls back silently on error; the fallback language remains available.
const loadLanguageInto = async (instance: I18nInstance, lang: string): Promise<void> => {
  if (instance.hasResourceBundle(lang, 'common')) return
  try {
    const { common, rcComponents } = await fetchLanguageData(lang)
    const langResources = buildLangResources(lang, common, rcComponents)
    instance.addResourceBundle(lang, 'common', langResources.common, true, true)
    instance.addResourceBundle(lang, reactComponentsNamespace, langResources[reactComponentsNamespace], true, true)
  } catch {
    console.warn(`[i18n] Failed to load locale: ${lang}`)
  }
}

const registerFormatters = (instance: I18nInstance) => {
  instance.services.formatter?.add('relative', (value: any, lng: string | undefined, options: any) => {
    const opts: { locale?: Locale } = {}
    const now = new Date()
    if (lng && lng !== 'en') {
      opts.locale = dateLocales[lng]
    }

    const relative = formatDistance(now, value, opts)

    if (!options.future && !options.past) {
      return relative
    }
    if (now < value) {
      return options.future.replace('%time', relative)
    }
    return options.past.replace('%time', relative)
  })

  instance.services.formatter?.add('duration', (value: any, lng: string | undefined) => {
    const opts: { locale?: Locale } = {}
    if (lng && lng !== 'en') {
      opts.locale = dateLocales[lng]
    }

    return formatDistance(value.begin, value.end, opts)
  })

  instance.services.formatter?.add('format', (value: any, lng: string | undefined, options: any) => {
    const opts: { locale?: Locale } = {}
    if (lng && lng !== 'en') {
      opts.locale = dateLocales[lng]
    }

    return format(value, options.format, opts)
  })

  instance.services.formatter?.add('uppercase', (value: string, lng: string | undefined) =>
    value.toLocaleUpperCase(lng)
  )
  instance.services.formatter?.add('lowercase', (value: string, lng: string | undefined) =>
    value.toLocaleLowerCase(lng)
  )
  instance.services.formatter?.add('ucfirst', (value: string, lng: string | undefined) => ucfirst(value, lng))
}

// Only the fallback language (English) is included in the initial bundle; all others
// are loaded on demand.  partialBundledLanguages tells i18next not to error when a
// supported language isn't in the initial resources object.
const fallbackResources = {
  [DEFAULT_FALLBACK_LANGUAGE]: buildLangResources(
    DEFAULT_FALLBACK_LANGUAGE,
    enCommon as Record<string, unknown>,
    enReactComponents as Record<string, unknown>
  ),
}

const getI18nOptions = ({
  language,
  isBrowser,
  supportedLanguages,
  fallbackLanguage,
}: { language?: string; isBrowser: boolean } & LanguageOptions) => ({
  lng: language,
  fallbackLng: fallbackLanguage,
  supportedLngs: supportedLanguages,
  lowerCaseLng: true,
  debug: shouldEnableI18nDebug({ isDev: import.meta.env.DEV, isTestEnv, isBrowser }),
  ns: defaultNamespaces,
  defaultNS: 'common',
  resources: fallbackResources,
  partialBundledLanguages: true,
  showSupportNotice: false,
  interpolation: {
    escapeValue: false,
  },
  returnEmptyString: false,
  initAsync: false,
})

const initializeInstance = ({
  instance,
  language,
  useBrowserLanguageDetector,
  languageOptions = defaultLanguageOptions,
}: {
  instance: I18nInstance
  language?: string
  useBrowserLanguageDetector: boolean
  languageOptions?: LanguageOptions
}) => {
  if (useBrowserLanguageDetector) {
    instance.use(BrowserLanguageDetector)
  }

  instance.use(initReactI18next)
  instance.init(
    getI18nOptions({
      language,
      isBrowser: typeof window !== 'undefined',
      ...languageOptions,
    }),
    (err) => {
      if (err) {
        console.error('i18next init error:', err)
        return
      }

      if (useBrowserLanguageDetector && instance.resolvedLanguage !== instance.language) {
        instance.changeLanguage(instance.resolvedLanguage)
      }

      // Trigger an immediate load for the language resolved after init (e.g. by
      // BrowserLanguageDetector).  This is fire-and-forget — the fallback language
      // is always available while the load is in flight.
      const activeLang = instance.resolvedLanguage ?? instance.language
      if (activeLang && activeLang !== DEFAULT_FALLBACK_LANGUAGE) {
        void loadLanguageInto(instance, activeLang)
      }
    }
  )
  registerFormatters(instance)

  // Lazily load resources for any language the user switches to after init.
  instance.on('languageChanged', (lang: string) => {
    if (lang && lang !== DEFAULT_FALLBACK_LANGUAGE) {
      void loadLanguageInto(instance, lang)
    }
  })
}

// Applies runtime LANGUAGES (supported set + fallback) to an already-initialized
// instance. i18next caches supportedLngs inside languageUtils at init time, so we
// update both the options and that cache, then re-resolve the active language
// against the new supported set.
const applyRuntimeLanguageOptions = (
  instance: I18nInstance,
  { supportedLanguages, fallbackLanguage }: LanguageOptions
) => {
  instance.options.supportedLngs = supportedLanguages
  instance.options.fallbackLng = fallbackLanguage

  const languageUtils = instance.services?.languageUtils as { supportedLngs?: string[] } | undefined
  if (languageUtils) {
    languageUtils.supportedLngs = supportedLanguages
  }

  if (instance.language) {
    instance.changeLanguage(instance.language)
  }
}

let baseI18nInstance: I18nInstance | null = null
let baseI18nHasRuntimeOptions = false

export const getBaseI18n = (languageOptions?: LanguageOptions) => {
  if (baseI18nInstance) {
    // The base instance is created eagerly at import time (see the default export
    // below) with default options, before AppProviders can supply the runtime
    // LANGUAGES slice. Apply those options the first time they arrive so the
    // configured supported languages and fallback actually take effect.
    if (languageOptions && !baseI18nHasRuntimeOptions) {
      applyRuntimeLanguageOptions(baseI18nInstance, languageOptions)
      baseI18nHasRuntimeOptions = true
    }
    return baseI18nInstance
  }

  baseI18nInstance = i18next.createInstance()
  baseI18nHasRuntimeOptions = Boolean(languageOptions)
  initializeInstance({
    instance: baseI18nInstance,
    useBrowserLanguageDetector: true,
    languageOptions,
  })

  return baseI18nInstance
}

export const createPageI18nInstance = (language: string, languageOptions?: LanguageOptions) => {
  const instance = i18next.createInstance()
  initializeInstance({
    instance,
    language,
    useBrowserLanguageDetector: false,
    languageOptions,
  })
  // Pre-fetch the language's resources immediately so they're available as soon
  // as possible.  The languageChanged listener in initializeInstance will also
  // pick up any subsequent switches.
  if (language !== DEFAULT_FALLBACK_LANGUAGE) {
    void loadLanguageInto(instance, language)
  }
  return instance
}

export default getBaseI18n()
