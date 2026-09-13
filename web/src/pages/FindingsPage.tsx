import { useState } from 'react'
import { z } from 'zod'
import { Download, Eye, FileText, History, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import {
  ResourcePage,
  enumOptions,
  optionalDate,
  requiredText,
} from '@/components/ResourcePage'
import { StatusBadge } from '@/components/StatusBadge'
import type { FieldDef } from '@/components/EntityFormDialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FINDING_STATUSES, PRIORITIES, type Finding } from '@/api/types'
import { FINDING_STATUS_LABELS, PRIORITY_LABELS } from '@/lib/labels'
import { formatDate } from '@/lib/utils'
import { getApiBase, getToken } from '@/api/client'
import { FindingCollaborationDialog } from '@/components/FindingCollaborationDialog'
import { useAuth } from '@/auth/AuthContext'

const statusOptions = enumOptions(FINDING_STATUSES, FINDING_STATUS_LABELS)
const priorityOptions = enumOptions(PRIORITIES, PRIORITY_LABELS)

const fields: FieldDef[] = [
  { name: 'title', label: 'Título', type: 'text', required: true },
  { name: 'priority', label: 'Prioridad', type: 'select', options: priorityOptions, required: true },
  { name: 'status', label: 'Estado', type: 'select', options: statusOptions, required: true },
  { name: 'departmentId', label: 'Departamento', type: 'relation', relation: 'departments', required: true },
  { name: 'processName', label: 'Proceso', type: 'text', required: true, placeholder: 'Nombre del proceso' },
  { name: 'dueDate', label: 'Fecha compromiso', type: 'date' },
]

const schema = z.object({
  title: requiredText('El título es obligatorio'),
  priority: requiredText('Seleccione una prioridad'),
  status: requiredText('Seleccione un estado'),
  departmentId: requiredText('Seleccione un departamento'),
  processName: requiredText('Ingrese el nombre del proceso'),
  dueDate: optionalDate(),
})

function toFormValues(item: Finding): Record<string, string> {
  return {
    title: item.title,
    priority: item.priority,
    status: item.status,
    departmentId: item.process?.departmentId ?? '',
    processName: item.process?.name ?? '',
    dueDate: item.dueDate ? item.dueDate.slice(0, 10) : '',
  }
}

function FileUploadButton({ findingId, onUploaded }: { findingId: string; onUploaded: () => void }) {
  const [uploading, setUploading] = useState(false)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const token = getToken()
      const res = await fetch(`${getApiBase()}/files/upload/finding/${findingId}`, {
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
  findingId,
  file,
  onDelete,
  canDelete,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  findingId: string
  file: { filename: string; mimetype: string; size: number }
  onDelete: () => void
  canDelete: boolean
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
              src={`${getApiBase()}/files/view/finding/${findingId}?token=${token}`}
              alt={file.filename}
              className="max-w-full h-auto rounded"
            />
          )}
          {isPdf && (
            <iframe
              src={`${getApiBase()}/files/view/finding/${findingId}?token=${token}`}
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
           {canDelete && (
             <Button
               variant="destructive"
               size="sm"
               onClick={onDelete}
             >
               <Trash2 className="h-4 w-4 mr-2" />
               Eliminar
             </Button>
           )}
          <Button
            onClick={() => {
              window.open(`${getApiBase()}/files/download/finding/${findingId}?token=${token}`, '_blank')
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

function FileButtons({ finding }: { finding: Finding }) {
  const { user } = useAuth()
  const canMutate = user?.role !== 'VIEWER'
  const [viewerOpen, setViewerOpen] = useState(false)

  if (!finding.file) {
    if (!canMutate) return <span className="text-xs text-muted-foreground italic">Sin archivo</span>
    return <FileUploadButton findingId={finding.id} onUploaded={() => window.location.reload()} />
  }

  function handleDownload() {
    const token = getToken()
    const link = document.createElement('a')
    link.href = `${getApiBase()}/files/download/finding/${finding.id}?token=${token}`
    link.download = finding.file!.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  async function handleDelete() {
    try {
      const token = getToken()
      const res = await fetch(`${getApiBase()}/files/finding/${finding.id}`, {
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
        findingId={finding.id}
        file={finding.file}
        onDelete={handleDelete}
        canDelete={canMutate}
      />
    </>
  )
}

function FindingCollaborationButton({ finding }: { finding: Finding }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const showCommentAlert = user?.role === 'ADMIN' && Boolean(finding.comments?.length)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={showCommentAlert ? 'Hay comentarios nuevos en este hallazgo' : 'Ver avances y comentarios'}
        title={showCommentAlert ? 'Hay comentarios nuevos en este hallazgo' : 'Ver avances y comentarios'}
        className={showCommentAlert ? 'relative text-amber-600 hover:text-amber-700' : undefined}
        onClick={() => setOpen(true)}
      >
        <History className="h-4 w-4" />
        {showCommentAlert && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-card" />}
      </Button>
      {open && <FindingCollaborationDialog finding={finding} open={open} onOpenChange={setOpen} />}
    </>
  )
}

export function FindingsPage() {
  return (
    <ResourcePage<Finding>
      resource="findings"
      title="Hallazgos"
      description="Hallazgos de auditoría y levantamiento. El código se asigna automáticamente."
      createLabel="Nuevo hallazgo"
      entityLabel="hallazgo"
      emptyMessage="No hay hallazgos registrados"
       searchPlaceholder="Buscar por código, título o departamento..."
      fields={fields}
      schema={schema}
      defaultValues={{
        title: '',
        priority: 'MEDIUM',
        status: 'OPEN',
        departmentId: '',
        processName: '',
        dueDate: '',
      }}
      toFormValues={toFormValues}
      rowActions={(finding) => <FindingCollaborationButton finding={finding} />}
      filters={[
        { name: 'status', label: 'Filtrar por estado', type: 'select', options: statusOptions },
        { name: 'priority', label: 'Filtrar por prioridad', type: 'select', options: priorityOptions },
        { name: 'from', label: 'Desde', type: 'date' },
        { name: 'to', label: 'Hasta', type: 'date' },
      ]}
      columns={[
         { header: 'Código', cell: (f) => f.code ?? '—' },
         { header: 'Título', cell: (f) => <span className="font-medium">{f.title}</span> },
         { header: 'Departamento', cell: (f) => f.process?.department?.name ?? '—' },
         { header: 'Creación', cell: (f) => formatDate(f.createdAt) },
         { header: 'Compromiso', cell: (f) => formatDate(f.dueDate) },
         { header: 'Archivo', cell: (f) => f.file ? (
          <span className="text-xs text-muted-foreground">{f.file.filename}</span>
        ) : (
          <span className="text-xs text-muted-foreground italic">Sin archivo</span>
         )},
         { header: 'Prioridad', cell: (f) => <StatusBadge value={f.priority} /> },
         { header: 'Estado', cell: (f) => <StatusBadge value={f.status} /> },
         { header: '', className: 'w-24', cell: (f) => <FileButtons finding={f} /> },
      ]}
    />
  )
}
