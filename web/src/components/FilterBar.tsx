import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRelationOptions, type Option, type RelationKind } from '@/api/hooks'
import { cn } from '@/lib/utils'

export const ALL = '__all__'

export interface FilterDef {
  name: string
  label: string
  type: 'select' | 'date' | 'relation'
  options?: Option[]
  relation?: RelationKind
}

interface FilterBarProps {
  filters: FilterDef[]
  values: Record<string, string>
  onChange: (name: string, value: string) => void
  searchPlaceholder?: string
  className?: string
}

function RelationSelect({
  relation,
  value,
  onChange,
  placeholder,
}: {
  relation: RelationKind
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  const options = useRelationOptions(relation)
  return <FilterSelect options={options} value={value} onChange={onChange} placeholder={placeholder} />
}

function FilterSelect({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <Select value={value || ALL} onValueChange={onChange}>
      <SelectTrigger className="w-full" aria-label={placeholder}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>Todos</SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function FilterBar({ filters, values, onChange, searchPlaceholder, className }: FilterBarProps) {
  const [search, setSearch] = useState(values.search ?? '')

  useEffect(() => {
    setSearch(values.search ?? '')
  }, [values.search])

  useEffect(() => {
    const timer = setTimeout(() => onChange('search', search), 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  return (
    <div className={cn('flex flex-wrap items-end gap-3', className)}>
      <div className="flex w-full flex-col gap-1 sm:w-64">
        <span className="text-[11px] font-medium text-muted-foreground">Buscar</span>
        <Input
          placeholder={searchPlaceholder ?? 'Buscar...'}
          aria-label={searchPlaceholder ?? 'Buscar'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {filters.map((filter) => {
        const props = {
          value: values[filter.name] ?? '',
          onChange: (value: string) => onChange(filter.name, value === ALL ? '' : value),
          placeholder: filter.label,
        }

        return (
          <div key={filter.name} className="flex w-full flex-col gap-1 sm:w-52">
            <span className="text-[11px] font-medium text-muted-foreground">{filter.label}</span>
            {filter.type === 'date' ? (
              <Input
                type="date"
                aria-label={filter.label}
                value={values[filter.name] ?? ''}
                onChange={(e) => onChange(filter.name, e.target.value)}
              />
            ) : filter.type === 'relation' && filter.relation ? (
              <RelationSelect relation={filter.relation} {...props} />
            ) : (
              <FilterSelect options={filter.options ?? []} {...props} />
            )}
          </div>
        )
      })}
    </div>
  )
}
