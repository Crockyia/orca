import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslate } from '@/i18n/use-translate'
import { useLanguageReadiness } from '@/i18n/language-readiness'
import { useLanguagePackCatalog } from './use-language-pack-catalog'
import { languageNames, recommendedLanguagePack } from './language-pack-options'

export function LanguagePackDiscoverySummary({
  onExplore
}: {
  onExplore: () => void
}): React.JSX.Element {
  const t = useTranslate()
  const detection = useLanguageReadiness((state) => state.detection)
  const catalog = useLanguagePackCatalog()
  const recommendation =
    detection?.status === 'unsupported'
      ? recommendedLanguagePack(catalog.packs, detection.detectedTag)
      : undefined
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="outline" size="sm" onClick={onExplore}>
        <Globe />
        {t('languages.browse', 'Explore languages')}
      </Button>
      {recommendation && (
        <span className="text-settings-detail text-muted-foreground">
          {t('languages.availableForDevice', '{{language}} is available from the community.', {
            language: languageNames(recommendation.locale).native
          })}
        </span>
      )}
    </div>
  )
}
