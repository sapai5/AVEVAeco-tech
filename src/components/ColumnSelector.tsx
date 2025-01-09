import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface ColumnSelectorProps {
  columns: string[]
  onSubmit: (column: string) => void
}

const ColumnSelector: React.FC<ColumnSelectorProps> = ({ columns, onSubmit }) => {
  const [selectedColumn, setSelectedColumn] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(selectedColumn)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Column</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="text"
            value={selectedColumn}
            onChange={(e) => setSelectedColumn(e.target.value)}
            placeholder="Enter column name"
            className="flex-grow"
          />
          <Button type="submit">Submit</Button>
        </form>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground">
          Available columns: {columns.join(', ')}
        </p>
      </CardFooter>
    </Card>
  )
}

export default ColumnSelector

