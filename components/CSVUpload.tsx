import { useState } from 'react'
import Papa from 'papaparse'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CSVUploadProps {
  onUpload: (data: any[]) => void
}

export function CSVUpload({ onUpload }: CSVUploadProps) {
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = () => {
    if (file) {
      Papa.parse(file, {
        complete: (result) => {
          // Convert string values to numbers where appropriate
          const processedData = result.data.map((row: any) => ({
            ...row,
            'Sand %': parseFloat(row['Sand %']) || 0,
            'Clay %': parseFloat(row['Clay %']) || 0,
            'Silt %': parseFloat(row['Silt %']) || 0,
            'pH': parseFloat(row['pH']) || 0,
            'EC mS/cm': parseFloat(row['EC mS/cm']) || 0,
            'O.M. %': parseFloat(row['O.M. %']) || 0,
            'CACO3 %': parseFloat(row['CACO3 %']) || 0,
            'N_NO3 ppm': parseFloat(row['N_NO3 ppm']) || 0,
            'P ppm': parseFloat(row['P ppm']) || 0,
            'K ppm': parseFloat(row['K ppm']) || 0,
            'Mg ppm': parseFloat(row['Mg ppm']) || 0,
            'Fe ppm': parseFloat(row['Fe ppm']) || 0,
            'Zn ppm': parseFloat(row['Zn ppm']) || 0,
            'Mn ppm': parseFloat(row['Mn ppm']) || 0,
            'Cu ppm': parseFloat(row['Cu ppm']) || 0,
            'B ppm': parseFloat(row['B ppm']) || 0
          }))
          onUpload(processedData)
        },
        header: true,
        skipEmptyLines: true,
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="csv-upload">Upload Soil Data CSV</Label>
        <Input id="csv-upload" type="file" accept=".csv" onChange={handleFileChange} />
      </div>
      <Button onClick={handleUpload} disabled={!file}>
        Analyze Data
      </Button>
    </div>
  )
}

