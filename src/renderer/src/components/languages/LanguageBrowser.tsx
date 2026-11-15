import { useState } from 'react'
import { ArrowLeft, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useTranslate } from '@/i18n/use-translate'
import { useLanguageReadiness } from '@/i18n/language-readiness'
import { useAppStore } from '@/store'
import { usePluginLanguagePackStore } from '@/store/plugins/localization/plugin-language-packs'
import { getRendererLanguageDetection, SUPPORTED_UI_LOCALES } from '../../../../shared/ui-locale'
import { isPluginUiLanguage } from '../../../../shared/ui-language'
import { isUsablePluginLanguagePack } from '../../../../shared/plugins/languages/plugin-language-pack-coverage'
import { requestPluginBrowse } from '@/store/plugins/navigation/plugin-preview-request'
import { isWebClientLocation } from '@/app-shell/platform/web-client-location'
import { LanguagePackRow } from './LanguagePackRow'
import { LanguageRequestForm } from './LanguageRequestForm'
import {
  languageMatchesDevice,
  languageNames,
  packPublisher,
  recommendedLanguagePack
} from './language-pack-options'
import { useUiLanguageSelection } from './use-ui-language-selection'
import { useLanguagePackCatalog } from './use-language-pack-catalog'
import { useLanguagePackSelection } from './use-language-pack-selection'

export function LanguageBrowser({
  onboarding = false,
  onClose
}: {
  onboarding?: boolean
  onClose: () => void
}): React.JSX.Element {
  const t = useTranslate()
  const settings = useAppStore((state) => state.settings)
  const entries = usePluginLanguagePackStore((state) => state.entries)
  const detection =
    useLanguageReadiness((state) => state.detection) ?? getRendererLanguageDetection()
  const catalogError = useLanguageReadiness((state) => state.error)
  const catalog = useLanguagePackCatalog()
  const selection = useLanguagePackSelection(onboarding)
  const [query, setQuery] = useState('')
  const [requesting, setRequesting] = useState(false)
  const { selecting, error, choose, restore } = useUiLanguageSelection({
    onboarding,
    onClose,
    disabled: selection.busy !== null
  })
  const busy = selecting !== null || selection.busy !== null
  const installed = entries
  const available = catalog.packs.filter(
    (pack, index, packs) =>
      !entries.some((entry) => entry.id === pack.id) &&
      packs.findIndex((candidate) => candidate.id === pack.id) === index
  )
  const recommendation =
    detection.status === 'unsupported'
      ? recommendedLanguagePack(
          [...installed.filter(isUsablePluginLanguagePack), ...available],
          detection.detectedTag
        )
      : undefined
  const matches = (locale: string, publisher = ''): boolean => {
    const names = languageNames(locale)
    return `${names.native} ${names.english} ${locale} ${publisher}`
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase())
  }
  const community = [...installed, ...available]
    .filter((pack) => matches(pack.locale, packPublisher(pack)))
    .sort(
      (a, b) =>
        Number(b.id === recommendation?.id) - Number(a.id === recommendation?.id) ||
        languageNames(a.locale).native.localeCompare(languageNames(b.locale).native)
    )
  const builtIns = SUPPORTED_UI_LOCALES.filter((locale) => matches(locale))
  const previous = settings?.uiLanguageBeforePlugin
  const previousName =
    previous === 'system'
      ? t('settings.appearance.language.system', 'System')
      : languageNames(previous && !isPluginUiLanguage(previous) ? previous : 'en').native
  return (
    <>
      {requesting ? (
        <LanguageRequestForm onboarding={onboarding} onBack={() => setRequesting(false)} />
      ) : (
        <>
          {onboarding && detection.detectedTag && (
            <div className="rounded-md border border-border bg-muted/40 p-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Globe className="size-4" />
                {t('languages.detectedDevice', 'Device language: {{language}}', {
                  language: languageNames(detection.detectedTag).native
                })}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(
                  'languages.chooseOrKeep',
                  'Choose a language, or continue with English. Change it anytime in Settings.'
                )}
              </p>
            </div>
          )}
          <div className="relative">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoFocus={!onboarding}
              aria-label={t('languages.search', 'Search languages')}
              placeholder={t('languages.searchPlaceholder', 'Search by language or native name…')}
            />
          </div>
          {settings?.pluginSystemEnabled === false && (
            <p className="text-sm text-muted-foreground">
              {t(
                'languages.pluginsDisabled',
                'Plugins are turned off. Enable them in Settings → Plugins to use community languages.'
              )}
            </p>
          )}
          {catalogError && (
            <p role="alert" className="text-sm text-destructive">
              {t(
                'languages.loadFailed',
                'Your language did not load. Select it again to retry, or choose English.'
              )}
            </p>
          )}
          <div
            className="scrollbar-sleek min-h-0 max-h-[min(50vh,28rem)] flex-1 overflow-y-auto pr-1"
            aria-busy={busy}
          >
            {(community.length > 0 || !query || !catalog.loaded || catalog.error) && (
              <section aria-label={t('languages.community', 'Community language packs')}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">
                    {t('languages.community', 'Community language packs')}
                  </h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={catalog.refreshing || busy}
                    onClick={() => void catalog.refresh()}
                  >
                    {catalog.refreshing ? <LoadingSpinner className="size-4" /> : null}
                    {t('languages.refresh', 'Refresh')}
                  </Button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t(
                    'languages.communityDescription',
                    'Translations by the community. Untranslated text stays in English.'
                  )}
                </p>
                <ul className="mt-2 divide-y divide-border">
                  {community.map((pack) => {
                    const availablePack = 'listing' in pack ? pack : null
                    const phase = availablePack
                      ? selection.phaseOf(availablePack.listing.pluginKey)
                      : null
                    return (
                      <LanguagePackRow
                        key={pack.id}
                        locale={pack.locale}
                        publisher={packPublisher(pack)}
                        coverage={'coverage' in pack ? pack.coverage : undefined}
                        selected={settings?.uiLanguage === pack.id && !catalogError}
                        recommended={pack.id === recommendation?.id}
                        available={availablePack !== null}
                        busy={selection.busy === pack.id || selecting === pack.id}
                        disabled={busy || settings?.pluginSystemEnabled !== true}
                        error={phase?.kind === 'error' ? phase.message : undefined}
                        onSelect={() =>
                          availablePack
                            ? void selection.install(availablePack)
                            : void choose(pack.id, languageNames(pack.locale).native)
                        }
                      />
                    )
                  })}
                </ul>
                {!catalog.loaded && (
                  <p
                    role="status"
                    className="flex items-center gap-2 py-4 text-sm text-muted-foreground"
                  >
                    <LoadingSpinner className="size-4" />
                    {t('languages.loadingPacks', 'Looking for language packs…')}
                  </p>
                )}
                {(catalog.error || (catalog.loaded && community.length === 0 && !query)) && (
                  <div className="flex items-center justify-between gap-3 py-4">
                    <p className="text-sm text-muted-foreground">
                      {catalog.error
                        ? t('languages.catalogFailed', 'Could not load community languages.')
                        : t('languages.noPacks', 'No language packs in your catalogs yet.')}
                    </p>
                  </div>
                )}
              </section>
            )}
            {builtIns.length > 0 && (
              <section className="mt-5" aria-label={t('languages.included', 'Included with Orca')}>
                <h3 className="text-sm font-semibold">
                  {t('languages.included', 'Included with Orca')}
                </h3>
                <ul className="mt-2 divide-y divide-border">
                  {builtIns.map((locale) => (
                    <LanguagePackRow
                      key={locale}
                      locale={locale}
                      selected={settings?.uiLanguage === locale && !catalogError}
                      recommended={
                        detection.status === 'supported' &&
                        languageMatchesDevice(locale, detection.detectedTag)
                      }
                      busy={selecting === locale}
                      disabled={busy}
                      onSelect={() => void choose(locale, languageNames(locale).native)}
                    />
                  ))}
                </ul>
              </section>
            )}
            {query &&
              community.length === 0 &&
              builtIns.length === 0 &&
              catalog.loaded &&
              !catalog.error && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {t('languages.noMatches', 'No matching languages. Try another name.')}
                </p>
              )}
          </div>
          {(error || selection.error) && (
            <p role="alert" className="text-sm text-destructive">
              {error ?? selection.error}
            </p>
          )}
          {settings && isPluginUiLanguage(settings.uiLanguage) && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void restore()}
              className="justify-start"
              lang="en"
            >
              <ArrowLeft />
              Switch back · {previousName}
            </Button>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
            {!isWebClientLocation() ? (
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => setRequesting(true)}>
                {t('languages.missing', 'Missing your language?')}
              </Button>
            ) : (
              <span />
            )}
            {!onboarding && (
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => {
                  onClose()
                  requestPluginBrowse('translations')
                }}
              >
                {t('languages.managePacks', 'Manage language packs')}
              </Button>
            )}
          </div>
        </>
      )}
    </>
  )
}
