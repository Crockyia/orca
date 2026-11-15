import { useEffect, useRef, useState } from 'react'
import type { PluginMarketplaceHostListing } from '../../../../preload/api/plugins/plugin-host-api'
import { pluginExecutionProfile } from '../../../../shared/plugins/contributions/plugin-execution-profile'
import { isUsablePluginLanguagePack } from '../../../../shared/plugins/languages/plugin-language-pack-coverage'
import { useTranslate } from '@/i18n/use-translate'
import { useAppStore } from '@/store'
import { track } from '@/diagnostics/telemetry/telemetry'
import { onboardingLanguageMetadata } from '../onboarding/onboarding-language-telemetry'
import { usePluginLanguagePackStore } from '@/store/plugins/localization/plugin-language-packs'
import { createPluginPagePreviewCache } from '../plugins/state/use-plugin-catalog'
import { usePluginInstallAction } from '../plugins/state/use-plugin-install-action'
import type { CatalogLanguagePack } from './language-pack-options'
import { languageNames } from './language-pack-options'
import {
  selectUiLanguage,
  showLanguageChanged,
  uiLanguageSelectionRevision
} from './language-selection'

export function useLanguagePackSelection(onboarding: boolean) {
  const t = useTranslate()
  const [cache] = useState(createPluginPagePreviewCache)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const mounted = useRef(true)
  const pending = useRef<{ pack: CatalogLanguagePack; previous: string; revision: number } | null>(
    null
  )
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const action = usePluginInstallAction({
    fetchPreview: async (listing: PluginMarketplaceHostListing) => {
      const read = await cache.fetch(listing)
      if (read.ok && pluginExecutionProfile(read.preview.manifest) !== 'data') {
        return { ok: false }
      }
      return read
    },
    onInstalled: async () => {
      const request = pending.current
      const entries = await usePluginLanguagePackStore.getState().fetchEntries()
      if (
        !request ||
        !mounted.current ||
        uiLanguageSelectionRevision() !== request.revision ||
        useAppStore.getState().settings?.uiLanguage !== request.previous
      ) {
        return true
      }
      const pack = entries.find(
        (entry) => entry.id === request.pack.id && isUsablePluginLanguagePack(entry)
      )
      if (!pack) {
        setError(
          t(
            'languages.installedUnavailable',
            'Installed, but this pack is not ready to use. Review it in Plugins.'
          )
        )
        return true
      }
      try {
        if (await selectUiLanguage(pack.id, () => mounted.current && pending.current === request)) {
          if (onboarding) {
            track('onboarding_language_changed', {
              ...onboardingLanguageMetadata(),
              selected_language: pack.id
            })
          }
          showLanguageChanged(languageNames(pack.locale).native)
        }
      } catch {
        setError(
          t(
            'languages.installedSwitchFailed',
            'Installed, but could not change language. Select it again to retry.'
          )
        )
      }
      return true
    }
  })

  const install = async (pack: CatalogLanguagePack): Promise<void> => {
    if (pending.current) {
      return
    }
    pending.current = {
      pack,
      previous: useAppStore.getState().settings?.uiLanguage ?? 'system',
      revision: uiLanguageSelectionRevision()
    }
    setBusy(pack.id)
    setError(null)
    await action.install(pack.listing).finally(() => {
      pending.current = null
      if (mounted.current) {
        setBusy(null)
      }
    })
  }
  return { install, busy, error, phaseOf: action.phaseOf }
}
