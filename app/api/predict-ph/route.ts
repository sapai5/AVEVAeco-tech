import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData()
    const file = data.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ph-prediction-'))
    const filePath = path.join(tempDir, 'data.csv')
    
    try {
      fs.writeFileSync(filePath, Buffer.from(await file.arrayBuffer()))

      return new Promise((resolve) => {
        const pythonProcess = spawn('python', ['newAI1.py', filePath])
        let result = ''
        let errorOutput = ''

        pythonProcess.stdout.on('data', (data) => {
          result += data.toString()
        })

        pythonProcess.stderr.on('data', (data) => {
          errorOutput += data.toString()
        })

        pythonProcess.on('close', (code) => {
          // Clean up temporary files
          fs.unlinkSync(filePath)
          fs.rmdirSync(tempDir)

          if (code !== 0) {
            console.error('Python script error:', errorOutput)
            resolve(NextResponse.json({ 
              error: `Prediction failed with code ${code}: ${errorOutput}` 
            }, { status: 500 }))
            return
          }

          try {
            const lines = result.trim().split('\n')
            const sequenceData = []
            
            for (let i = 0; i < 30 && i < lines.length - 2; i++) {
              const value = parseFloat(lines[i])
              if (!isNaN(value)) {
                sequenceData.push({
                  timeStep: i,
                  pH: value
                })
              }
            }

            const predictedLine = lines[lines.length - 2]
            const actualLine = lines[lines.length - 1]

            const predictedMatch = predictedLine.match(/Predicted value: (\d+\.?\d*)/)
            const actualMatch = actualLine.match(/Actual value: (\d+\.?\d*)/)

            if (!predictedMatch || !actualMatch) {
              resolve(NextResponse.json({ 
                error: 'Failed to parse prediction results' 
              }, { status: 500 }))
              return
            }

            const predictedValue = parseFloat(predictedMatch[1])
            const actualValue = parseFloat(actualMatch[1])

            resolve(NextResponse.json({
              predictedValue,
              actualValue,
              sequenceData
            }))
          } catch (error) {
            console.error('Error processing Python script output:', error)
            resolve(NextResponse.json({ 
              error: 'Error processing prediction results' 
            }, { status: 500 }))
          }
        })
      })
    } catch (error) {
      // Clean up on error
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
      if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir)
      throw error
    }
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      error: 'Prediction failed: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 })
  }
}

