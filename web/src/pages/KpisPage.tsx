import { BonusKpiSection } from '@/components/BonusKpiSection'
import { BonusConfigPanel } from '@/pages/BonusKpiPage'

export function KpisPage() {
  return (
    <div className="space-y-5">
      <BonusConfigPanel />
      <BonusKpiSection />
    </div>
  )
}
