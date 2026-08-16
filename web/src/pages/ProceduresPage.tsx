import { useState } from 'react'
import { z } from 'zod'
import { Download, Eye, FileText, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import {
  ResourcePage,
  enumOptions,
  optionalText,
  requiredText,
} from '@/components/ResourcePage'
import { StatusBadge } from '@/components/StatusBadge'
import { NONE, type FieldDef } from '@/components/EntityFormDialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PROCEDURE_STATUSES, type Procedure } from '@/api/types'
import { PROCEDURE_STATUS_LABELS } from '@/lib/labels'
import { getToken } from '@/api/client'

const statusOptions = enumOptions(PROCEDURE_STATUSES, PROCEDURE_STATUS_LABELS)

const fields: FieldDef[] = [
  { name: 'code', label: 'Código', type: 'text', placeholder: 'PR-001' },
  { name: 'title', label: 'Título', type: 'text', required: true },
  { name: 'version', label: 'Versión', type: 'text' },
  { name: 'status', label: 'Estado', type: 'select', options: statusOptions, required: true },
  { name: 'departmentId', label: 'Departamento', type: 'relation', relation: 'departments', required: true },
  { name: 'processName', label: 'Proceso', type: 'text', required: true, placeholder: 'Nombre del proceso' },
  { name: 'content', label: 'Contenido', type: 'textarea' },
]

const schema = z.object({
  code: optionalText(),
  title: requiredText('El título es obligatorio'),
  version: optionalText(),
  status: requiredText('Seleccione un estado'),
  departmentId: requiredText('Seleccione un departamento'),
  processName: requiredText('Ingrese el nombre del proceso'),
  content: optionalText(),
})

function toFormValues(item: Procedure): Record<string, string> {
  return {
    code: item.code ?? '',
    title: item.title,
    version: item.version,
    status: item.status,
    departmentId: item.process?.departmentId ?? NONE,
    processName: item.process?.name ?? '',
    content: item.content ?? '',
  }
}

function FileUploadButton({ procedureId, onUploaded }: { procedureId: string; onUploaded: () => void }) {
  const [uploading, setUploading] = useState(false)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const token = getToken()
      const res = await fetch(`/api/files/upload/${procedureId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!res.ok) throw new Error('Error al subir archivo')
      toast.success('Archivo subido correctamente')
      onUploaded()
    } catch {
      toast.error('Error al subir archivo')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <label>
      <input
        type="file"
        className="hidden"
        onChange={handleUpload}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
      />
      <Button variant="ghost" size="icon" asChild disabled={uploading}>
        <span title="Subir archivo">
          <Upload className="h-4 w-4" />
        </span>
      </Button>
    </label>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(filename: string) {
  if (/\.(pdf)$/i.test(filename)) return '📄'
  if (/\.(doc|docx)$/i.test(filename)) return '📝'
  if (/\.(xls|xlsx)$/i.test(filename)) return '📊'
  if (/\.(png|jpg|jpeg|gif|webp)$/i.test(filename)) return '🖼️'
  return '📎'
}

function FileViewerModal({
  open,
  onOpenChange,
  procedureId,
  file,
  onDelete,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  procedureId: string
  file: { filename: string; mimetype: string; size: number }
  onDelete: () => void
}) {
  const isImage = /\.(png|jpg|jpeg|gif|webp)$/i.test(file.filename)
  const isPdf = /\.pdf$/i.test(file.filename)
  const token = getToken()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {file.filename}
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-auto">
          {isImage && (
            <img
              src={`/api/files/view/${procedureId}?token=${token}`}
              alt={file.filename}
              className="max-w-full h-auto rounded"
            />
          )}
          {isPdf && (
            <iframe
              src={`/api/files/view/${procedureId}?token=${token}`}
              className="w-full h-[60vh] border rounded"
              title={file.filename}
            />
          )}
          {!isImage && !isPdf && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <span className="text-6xl mb-4">{getFileIcon(file.filename)}</span>
              <p className="text-lg font-medium">{file.filename}</p>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span>{file.mimetype}</span>
                <span>•</span>
                <span>{formatFileSize(file.size)}</span>
              </div>
              <p className="text-sm mt-2">La vista previa no está disponible para este tipo de archivo</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t pt-4">
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
          <Button
            onClick={() => {
              window.open(`/api/files/download/${procedureId}?token=${token}`, '_blank')
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Descargar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function FileButtons({ procedure }: { procedure: Procedure }) {
  const [viewerOpen, setViewerOpen] = useState(false)

  if (!procedure.file) {
    return <FileUploadButton procedureId={procedure.id} onUploaded={() => window.location.reload()} />
  }

  function handleDownload() {
    const token = getToken()
    const link = document.createElement('a')
    link.href = `/api/files/download/${procedure.id}?token=${token}`
    link.download = procedure.file!.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  async function handleDelete() {
    try {
      const token = getToken()
      const res = await fetch(`/api/files/${procedure.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Error al eliminar')
      toast.success('Archivo eliminado')
      window.location.reload()
    } catch {
      toast.error('Error al eliminar archivo')
    }
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => setViewerOpen(true)} title="Ver archivo">
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleDownload} title="Descargar archivo">
          <Download className="h-4 w-4" />
        </Button>
      </div>
      <FileViewerModal
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        procedureId={procedure.id}
        file={procedure.file}
        onDelete={handleDelete}
      />
    </>
  )
}

export function ProceduresPage() {
  return (
    <ResourcePage<Procedure>
      resource="procedures"
      title="Procedimientos"
      description="Información documentada de los procesos"
      createLabel="Nuevo procedimiento"
      entityLabel="procedimiento"
      emptyMessage="No hay procedimientos registrados"
      searchPlaceholder="Buscar por código, título, departamento o proceso..."
      fields={fields}
      schema={schema}
      defaultValues={{ code: '', title: '', version: '1.0', status: 'DRAFT', departmentId: NONE, processName: '', content: '' }}
      toFormValues={toFormValues}
      filters={[
        { name: 'status', label: 'Filtrar por estado', type: 'select', options: statusOptions },
      ]}
      columns={[
        { header: 'Código', cell: (p) => p.code ?? '—' },
        { header: 'Título', cell: (p) => <span className="font-medium">{p.title}</span> },
        { header: 'Departamento', cell: (p) => p.process?.department?.name ?? '—' },
        { header: 'Proceso', cell: (p) => p.process?.name ?? '—' },
        { header: 'Archivo', cell: (p) => p.file ? (
          <span className="text-xs text-muted-foreground">{p.file.filename}</span>
        ) : (
          <span className="text-xs text-muted-foreground italic">Sin archivo</span>
        )},
        { header: 'Estado', cell: (p) => <StatusBadge value={p.status} /> },
        { header: '', className: 'w-24', cell: (p) => <FileButtons procedure={p} /> },
      ]}
    />
  )
}
