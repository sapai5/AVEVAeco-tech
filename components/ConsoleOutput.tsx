import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ConsoleOutputProps {
  output: string
}

const ConsoleOutput: React.FC<ConsoleOutputProps> = ({ output }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Console Output</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="bg-muted p-2 rounded-md overflow-x-auto whitespace-pre-wrap">{output}</pre>
      </CardContent>
    </Card>
  )
}

export default ConsoleOutput

