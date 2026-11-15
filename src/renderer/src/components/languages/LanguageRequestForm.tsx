import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTranslate } from '@/i18n/use-translate'
import { track } from '@/diagnostics/telemetry/telemetry'
import { onboardingLanguageMetadata } from '../onboarding/onboarding-language-telemetry'

export function LanguageRequestForm({
  onBack,
  onboarding
}: {
  onBack: () => void
  onboarding: boolean
}): React.JSX.Element {
  const t = useTranslate()
  const [draft, setDraft] = useState('')
  const [status, setStatus] = useState<'idle' | 'pending' | 'error' | 'success'>('idle')
  const pending = useRef(false)
  const submit = async (): Promise<void> => {
    const request = draft.trim()
    if (!request || pending.current) {
      return
    }
    pending.current = true
    setStatus('pending')
    try {
      const result = await window.api.feedback.submit({
        feedback: `Language request: ${request}`,
        submitAnonymously: true,
        githubLogin: null,
        githubEmail: null
      })
      setStatus(result.ok ? 'success' : 'error')
      if (result.ok && onboarding) {
        track('onboarding_language_requested', onboardingLanguageMetadata())
      }
    } catch {
      setStatus('error')
    }
    pending.current = false
  }
  return (
    <form
      className="scrollbar-sleek min-h-0 space-y-4 overflow-y-auto py-4"
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <Label htmlFor="language-request">
        {t('onboarding.language.requestPrompt', 'Which language would you like Orca to support?')}
      </Label>
      <Input
        id="language-request"
        autoFocus
        maxLength={80}
        value={draft}
        disabled={status === 'pending' || status === 'success'}
        onChange={(event) => {
          setDraft(event.target.value)
          setStatus('idle')
        }}
      />
      {status === 'success' && (
        <p role="status" className="text-sm text-muted-foreground">
          {t('languages.requestRecorded', 'Language request recorded.')}
        </p>
      )}
      {status === 'error' && (
        <p role="alert" className="text-sm text-destructive">
          {t('onboarding.language.requestError', 'Could not record your request. Try again.')}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onBack}>
          {t('onboarding.language.back', 'Languages')}
        </Button>
        {status !== 'success' && (
          <Button type="submit" disabled={!draft.trim() || status === 'pending'}>
            {t('onboarding.language.requestAction', 'Request language')}
          </Button>
        )}
      </div>
    </form>
  )
}
