import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { useTranslate } from '@/i18n/use-translate'
import { useEffect } from 'react'
import { useAppStore } from '@/store'
import { track } from '@/diagnostics/telemetry/telemetry'
import { onboardingLanguageMetadata } from '../onboarding/onboarding-language-telemetry'
import { LanguageBrowser } from './LanguageBrowser'

export function LanguagePickerDialog({
  open,
  onOpenChange,
  onboarding = false
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onboarding?: boolean
}): React.JSX.Element {
  const t = useTranslate()
  useEffect(() => {
    if (open && onboarding) {
      track('onboarding_language_picker_opened', onboardingLanguageMetadata())
    }
    if (open && !useAppStore.getState().settings?.languagePackSuggestionShown) {
      void useAppStore
        .getState()
        .updateSettings({ languagePackSuggestionShown: true })
        .catch(() => undefined)
    }
  }, [open, onboarding])
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="z-[110] flex max-h-[calc(100dvh-3rem)] flex-col overflow-hidden sm:max-w-xl"
        overlayClassName="z-[105]"
      >
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {onboarding
              ? t('languages.title', 'Make yourself at home')
              : t('onboarding.language.title', 'Display language')}
          </DialogTitle>
          <DialogDescription>
            {t('languages.description', 'Use Orca in your language. Switch back anytime.')}
          </DialogDescription>
        </DialogHeader>
        {open && <LanguageBrowser onboarding={onboarding} onClose={() => onOpenChange(false)} />}
        <DialogFooter className="shrink-0">
          <Button variant={onboarding ? 'default' : 'ghost'} onClick={() => onOpenChange(false)}>
            {onboarding
              ? t('languages.continue', 'Continue to setup')
              : t('languages.done', 'Done')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
