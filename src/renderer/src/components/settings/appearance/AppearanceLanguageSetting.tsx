import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { LanguagePackDiscoverySummary } from '@/components/languages/LanguagePackDiscoverySummary'
import {
  normalizeUiLanguage,
  isPluginUiLanguage,
  type UiLanguage
} from '../../../../../shared/ui-language'
import { Button } from '@/components/ui/button'
import { LanguagePickerDialog } from '@/components/languages/LanguagePickerDialog'
import { useUiLanguageSelection } from '@/components/languages/use-ui-language-selection'
import { UI_LANGUAGE_CHOICES } from '@/i18n/supported-languages'
import { useTranslate } from '@/i18n/use-translate'
import { SearchableSetting } from '../section-layout/SearchableSetting'
import { SettingsRow } from '../form-controls/SettingsFormControls'
import {
  SettingsSearchableSelect,
  type SettingsSearchableSelectOption
} from '../form-controls/SettingsSearchableSelect'
import { getLanguageEntries } from './appearance-search'
import { useUiLanguagePickerLabels } from './use-appearance-picker-labels'

type AppearanceLanguageSettingProps = {
  uiLanguage: UiLanguage
  forceVisible: boolean
}

export function AppearanceLanguageSetting({
  uiLanguage,
  forceVisible
}: AppearanceLanguageSettingProps): React.JSX.Element {
  const t = useTranslate()
  const selection = useUiLanguageSelection({
    onboarding: false,
    onClose: () => {},
    disabled: false
  })
  const [browserOpen, setBrowserOpen] = useState(false)
  const languages = useUiLanguagePickerLabels()
  const languageEntry = getLanguageEntries()[0]
  const languageTitle = t('settings.appearance.language.title', 'Language')
  const languageOptions: SettingsSearchableSelectOption[] = [
    ...UI_LANGUAGE_CHOICES.map((choice, index) => ({
      value: choice.value,
      label: languages.choices[index],
      keywords: [choice.value]
    })),
    ...languages.packs.map((pack) => ({
      value: pack.id,
      label: languages.packLabels.get(pack.id) ?? pack.locale,
      keywords: [pack.id, pack.locale]
    }))
  ]
  if (!languageOptions.some((option) => option.value === uiLanguage)) {
    languageOptions.push({
      value: uiLanguage,
      label: t(
        'auto.components.settings.AppearanceInterfaceSection.languageUnavailable',
        '{{value0}} (unavailable)',
        { value0: uiLanguage }
      ),
      disabled: true
    })
  }

  return (
    <SearchableSetting
      title={languageTitle}
      description={languageEntry?.description}
      keywords={languageEntry?.keywords ?? []}
      forceVisible={forceVisible}
      id="appearance-language"
    >
      <SettingsRow
        label={languageTitle}
        description={t(
          'languages.settingsDescription',
          'Built-in languages and community translations.'
        )}
        control={
          <SettingsSearchableSelect
            ariaLabel={languageTitle}
            value={uiLanguage}
            groups={[{ key: 'ui-languages', options: languageOptions }]}
            // Why: re-picking the saved language is the visible way to retry a catalog that failed to load.
            allowReselect
            disabled={selection.selecting !== null}
            onValueChange={(value) => {
              void selection.choose(
                normalizeUiLanguage(value),
                languageOptions.find((option) => option.value === value)?.label ?? value
              )
            }}
            searchPlaceholder={t(
              'auto.components.settings.SettingsSearchableSelect.searchLanguages',
              'Search languages…'
            )}
          />
        }
      />
      <div className="flex flex-wrap items-center gap-2 pb-3">
        <LanguagePackDiscoverySummary onExplore={() => setBrowserOpen(true)} />
        {isPluginUiLanguage(uiLanguage) && (
          <Button
            variant="ghost"
            size="sm"
            lang="en"
            disabled={selection.selecting !== null}
            onClick={() => void selection.restore()}
          >
            <ArrowLeft />
            Switch back
          </Button>
        )}
      </div>
      {selection.error && (
        <p role="alert" className="text-sm text-destructive">
          {selection.error}
        </p>
      )}
      <LanguagePickerDialog open={browserOpen} onOpenChange={setBrowserOpen} />
    </SearchableSetting>
  )
}
