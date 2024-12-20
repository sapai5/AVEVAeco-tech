import { ChangeEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface FileUploadProps {
  label: string
  onFileSelect: (file: File) => void
  accept: string
}

export default function FileUpload({ label, onFileSelect, accept }: FileUploadProps) {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
    }
  }

  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor={label}>{label}</Label>
      <Input id={label} type="file" accept={accept} onChange={handleFileChange} className="bg-input text-foreground" />
    </div>
  )
}

