import { Check, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useTranslate } from '@/i18n/use-translate'
import { languageNames } from './language-pack-options'
import { isUsablePluginLanguagePack } from '../../../../shared/plugins/languages/plugin-language-pack-coverage'

export function LanguagePackRow({
  locale,
  publisher,
  coverage,
  selected,
  recommended,
  available,
  busy,
  disabled,
  error,
  onSelect
}: {
  locale: string
  publisher?: string
  coverage?: number
  selected: boolean
  recommended?: boolean
  available?: boolean
  busy?: boolean
  disabled?: boolean
  error?: string
  onSelect: () => void
}): React.JSX.Element {
  const t = useTranslate()
  const names = languageNames(locale)
  const incomplete = coverage !== undefined && !isUsablePluginLanguagePack({ coverage })
  const action = busy
    ? available
      ? t('languages.installing', 'Installing…')
      : t('languages.changing', 'Changing…')
    : selected
      ? t('languages.current', 'Current')
      : incomplete
        ? t('languages.incomplete', 'Incomplete')
        : available
          ? t('languages.installAndUse', 'Install and use')
          : t('languages.use', 'Use')
  return (
    <li className="space-y-2 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium" lang={locale}>
              {names.native}
            </span>
            {recommended && (
              <Badge variant="secondary">
                {t('languages.deviceMatch', 'Your device language')}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {names.english}
            {publisher ? ` · ${publisher}` : ` · ${t('languages.builtIn', 'Built in')}`}
            {coverage !== undefined
              ? ` · ${t('languages.coverage', '{{percent}}% translated', { percent: coverage })}`
              : null}
          </p>
        </div>
        <Button
          size="sm"
          variant={recommended && !selected ? 'default' : 'outline'}
          disabled={disabled || busy || selected || incomplete}
          aria-label={`${action} ${names.native}`}
          aria-busy={busy}
          onClick={onSelect}
          className="shrink-0"
        >
          {busy ? (
            <LoadingSpinner className="size-4" />
          ) : selected ? (
            <Check />
          ) : available ? (
            <Download />
          ) : null}
          {action}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </li>
  )
}
