import type { ControllerRenderProps, UseFormReturn } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useRelationOptions, type Option, type RelationKind } from '@/api/hooks'

export const NONE = '__none__'

export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'relation'

export interface FieldDef {
  name: string
  label: string
  type: FieldType
  options?: Option[]
  relation?: RelationKind
  required?: boolean
  placeholder?: string
}

type FormValues = Record<string, string>
type RhfField = ControllerRenderProps<FormValues, string>

function RelationOptions({ relation, required }: { relation: RelationKind; required?: boolean }) {
  const options = useRelationOptions(relation)
  return (
    <>
      {!required && <SelectItem value={NONE}>— Ninguno —</SelectItem>}
      {options.map((opt) => (
        <SelectItem key={opt.value} value={opt.value}>
          {opt.label}
        </SelectItem>
      ))}
    </>
  )
}

function FieldInput({ def, field }: { def: FieldDef; field: RhfField }) {
  if (def.type === 'textarea') {
    return <Textarea placeholder={def.placeholder} {...field} />
  }
  if (def.type === 'select' || def.type === 'relation') {
    return (
      <Select value={field.value} onValueChange={field.onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Seleccione..." />
        </SelectTrigger>
        <SelectContent>
          {def.type === 'relation' && def.relation ? (
            <RelationOptions relation={def.relation} required={def.required} />
          ) : (
            (def.options ?? []).map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    )
  }
  return <Input type={def.type} placeholder={def.placeholder} {...field} />
}

interface EntityFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  fields: FieldDef[]
  form: UseFormReturn<FormValues, unknown, FormValues>
  onSubmit: (values: FormValues) => void
  isSubmitting: boolean
}

export function EntityFormDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  form,
  onSubmit,
  isSubmitting,
}: EntityFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {fields.map((def) => (
              <FormField
                key={def.name}
                control={form.control}
                name={def.name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {def.label}
                      {def.required && <span className="text-destructive"> *</span>}
                    </FormLabel>
                    <FormControl>
                      <FieldInput def={def} field={field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
