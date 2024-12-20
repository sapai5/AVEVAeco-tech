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

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mining-prediction-'))
    const filePath = path.join(tempDir, file.name)

    fs.writeFileSync(filePath, Buffer.from(await file.arrayBuffer()))

    const pythonProcess = spawn('python', ['newAI1.py', filePath])

    let result = ''
    let errorOutput = ''

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString()
    })

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString()
    })

    await new Promise((resolve, reject) => {
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Python script exited with code:', code)
          console.error('Error output:', errorOutput)
          reject(new Error(`Prediction failed with code ${code}: ${errorOutput}`))
        } else {
          resolve(null)
        }
      })
    })

    // Parse the output to get the sequence data and predictions
    const lines = result.trim().split('\n')
    const predictedValue = parseFloat(lines[lines.length - 2].split(':')[1].trim())
    const actualValue = parseFloat(lines[lines.length - 1].split(':')[1].trim())

    // Create sequence data for the last 30 points
    const sequenceData = Array.from({ length: 30 }, (_, i) => ({
      timeStep: i,
      pH: parseFloat(lines[i].trim()) // Assuming the pH values are output one per line
    }))

    return NextResponse.json({
      predictedValue,
      actualValue,
      sequenceData
    })
  } catch (error) {
    console.error('Error in API route:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 })
  }
}

