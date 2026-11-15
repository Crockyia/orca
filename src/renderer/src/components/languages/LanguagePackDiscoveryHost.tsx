import { Suspense, useEffect, useRef, useState } from 'react'
import { toast, useSonner } from 'sonner'
import { useTranslate } from '@/i18n/use-translate'
import { useLanguageReadiness } from '@/i18n/language-readiness'
import { useAppStore } from '@/store'
import { usePluginLanguagePacks } from '@/store/plugins/localization/plugin-language-packs'
import { useNotificationCardStackOccupied } from '@/lib/notifications/notification-card-layout-vars'
import { lazyWithRetry as lazy } from '@/app-shell/startup/lazy-with-retry'
import { OverlayBoundary } from '@/app-shell/app-root-surface-boundaries'
import { languageNames, recommendedLanguagePack } from './language-pack-options'
import { useLanguagePackCatalog } from './use-language-pack-catalog'
import {
  useLanguageSuggestionSurfaceBlocked,
  isLanguageSuggestionSurfaceBlocked
} from './use-language-suggestion-surface'

const SUGGESTION_ID = 'language-pack-discovery'
let shownThisSession = false
const LanguagePickerDialog = lazy(() =>
  import('./LanguagePickerDialog').then((module) => ({ default: module.LanguagePickerDialog }))
)

export function LanguagePackDiscoveryHost({
  onboardingKnown,
  onboardingVisible
}: {
  onboardingKnown: boolean
  onboardingVisible: boolean
}): React.JSX.Element | null {
  const t = useTranslate()
  const settings = useAppStore((state) => state.settings)
  const persistedUIReady = useAppStore((state) => state.persistedUIReady)
  const activeModal = useAppStore((state) => state.activeModal)
  const activeView = useAppStore((state) => state.activeView)
  const detection = useLanguageReadiness((state) => state.detection)
  const cardsVisible = useNotificationCardStackOccupied()
  const surfaceBlocked = useLanguageSuggestionSurfaceBlocked()
  const { toasts } = useSonner()
  const installed = usePluginLanguagePacks()
  const suppressedForOnboarding = useRef(false)
  const [open, setOpen] = useState(false)
  const activeToast = useRef(false)
  const eligible =
    onboardingKnown &&
    persistedUIReady &&
    !onboardingVisible &&
    !settings?.languagePackSuggestionShown &&
    settings?.uiLanguage === 'system' &&
    settings.pluginSystemEnabled &&
    detection?.status === 'unsupported'
  const catalog = useLanguagePackCatalog(eligible)
  const recommendation = recommendedLanguagePack(
    [...installed, ...catalog.packs],
    detection?.detectedTag ?? null
  )
  const anotherToast = toasts.some((entry) => entry.id !== SUGGESTION_ID)
  const blocked =
    surfaceBlocked ||
    cardsVisible ||
    anotherToast ||
    activeModal !== 'none' ||
    activeView === 'settings' ||
    onboardingVisible

  useEffect(() => {
    if (onboardingVisible) {
      suppressedForOnboarding.current = true
    }
  }, [onboardingVisible])

  useEffect(() => {
    if (blocked && activeToast.current) {
      toast.dismiss(SUGGESTION_ID)
      activeToast.current = false
    }
    if (
      !eligible ||
      blocked ||
      !recommendation ||
      shownThisSession ||
      suppressedForOnboarding.current
    ) {
      return
    }
    const timer = window.setTimeout(() => {
      const current = useAppStore.getState()
      if (
        current.settings?.languagePackSuggestionShown ||
        current.settings?.uiLanguage !== 'system' ||
        current.activeModal !== 'none' ||
        current.activeView === 'settings' ||
        isLanguageSuggestionSurfaceBlocked() ||
        (document.querySelector('.notification-card-stack')?.childElementCount ?? 0) > 0 ||
        toast.getToasts().some((entry) => entry.id !== SUGGESTION_ID)
      ) {
        return
      }
      shownThisSession = true
      activeToast.current = true
      toast.message(
        t('languages.suggestionTitle', 'Orca in {{language}}?', {
          language: languageNames(recommendation.locale).native
        }),
        {
          id: SUGGESTION_ID,
          description: t(
            'languages.suggestionDescription',
            'A community language pack matches your device. Preview your options and switch back anytime.'
          ),
          duration: 15000,
          onDismiss: () => {
            activeToast.current = false
          },
          onAutoClose: () => {
            activeToast.current = false
          },
          action: { label: t('languages.explore', 'Explore'), onClick: () => setOpen(true) }
        }
      )
      void current.updateSettings({ languagePackSuggestionShown: true }).catch(() => undefined)
    }, 15000)
    return () => window.clearTimeout(timer)
  }, [blocked, eligible, recommendation, t])

  useEffect(
    () => () => {
      if (activeToast.current) {
        toast.dismiss(SUGGESTION_ID)
      }
    },
    []
  )
  return open ? (
    <OverlayBoundary boundaryId="overlay.language-pack-picker">
      <Suspense fallback={null}>
        <LanguagePickerDialog open={open} onOpenChange={setOpen} />
      </Suspense>
    </OverlayBoundary>
  ) : null
}
