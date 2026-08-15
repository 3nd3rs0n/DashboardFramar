import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRelationOptions, type Option, type RelationKind } from '@/api/hooks'

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
      <SelectTrigger className="w-full sm:w-52">
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

export function FilterBar({ filters, values, onChange, searchPlaceholder }: FilterBarProps) {
  const [search, setSearch] = useState(values.search ?? '')

  useEffect(() => {
    const timer = setTimeout(() => onChange('search', search), 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        className="w-full sm:w-64"
        placeholder={searchPlaceholder ?? 'Buscar...'}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {filters.map((filter) => {
        if (filter.type === 'date') {
          return (
            <Input
              key={filter.name}
              type="date"
              className="w-full sm:w-40"
              aria-label={filter.label}
              value={values[filter.name] ?? ''}
              onChange={(e) => onChange(filter.name, e.target.value)}
            />
          )
        }
        const props = {
          value: values[filter.name] ?? '',
          onChange: (value: string) => onChange(filter.name, value === ALL ? '' : value),
          placeholder: filter.label,
        }
        return filter.type === 'relation' && filter.relation ? (
          <RelationSelect key={filter.name} relation={filter.relation} {...props} />
        ) : (
          <FilterSelect key={filter.name} options={filter.options ?? []} {...props} />
        )
      })}
    </div>
  )
}
