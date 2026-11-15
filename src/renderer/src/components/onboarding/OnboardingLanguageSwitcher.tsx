import { Globe, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LanguagePickerDialog } from '@/components/languages/LanguagePickerDialog'

export function OnboardingLanguageSwitcher({
  open,
  onOpenChange
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}): React.JSX.Element {
  return (
    <>
      <Button variant="ghost" size="sm" lang="en" onClick={() => onOpenChange(true)}>
        <Globe />
        Switch language
        <ChevronDown className="size-3" />
      </Button>
      <LanguagePickerDialog open={open} onOpenChange={onOpenChange} onboarding />
    </>
  )
}
