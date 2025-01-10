import React from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ColumnSelectorProps {
  columns: string[]
  onSubmit: (column: string) => void
  newConsoleOutput: string
}

const ColumnSelector: React.FC<ColumnSelectorProps> = ({ columns, onSubmit, newConsoleOutput }) => {
  const [selectedColumn, setSelectedColumn] = React.useState<string>('')

  React.useEffect(() => {
    if (newConsoleOutput) {
      window.scrollTo(0, document.body.scrollHeight)
    }
  }, [newConsoleOutput])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedColumn) {
      onSubmit(selectedColumn)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mineral Selection</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Select value={selectedColumn} onValueChange={setSelectedColumn}>
            <SelectTrigger className="flex-grow">
              <SelectValue placeholder="Select Mineral to Analyze" />
            </SelectTrigger>
            <SelectContent>
              {columns.map((column) => (
                <SelectItem key={column} value={column}>
                  {column}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit">Go</Button>
        </form>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground">
          {columns.length} columns available
        </p>
      </CardFooter>
    </Card>
  )
}

export default ColumnSelector

