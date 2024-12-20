import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { Configuration, OpenAIApi } from 'openai'

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})
const openai = new OpenAIApi(configuration)

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData()
    const predictedFile = data.get('predicted') as File
    const actualFile = data.get('actual') as File

    if (!predictedFile || !actualFile) {
      return NextResponse.json({ error: 'Missing file(s)' }, { status: 400 })
    }

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mining-analysis-'))
    const predictedPath = path.join(tempDir, 'predicted.txt')
    const actualPath = path.join(tempDir, 'actual.csv')

    fs.writeFileSync(predictedPath, Buffer.from(await predictedFile.arrayBuffer()))
    fs.writeFileSync(actualPath, Buffer.from(await actualFile.arrayBuffer()))

    const pythonProcess = spawn('python', ['ARIMAmodelPrediction.py', predictedPath, actualPath])

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
          reject(new Error(`Analysis failed with code ${code}: ${errorOutput}`))
        } else {
          resolve(null)
        }
      })
    })

    const analysisResult = JSON.parse(result)

    // Use GPT-3 to make a decision
    const prompt = `Here are the predicted and actual toxic mineral percentages for Mercury and Zinc:
Predicted Mercury: ${analysisResult.mercuryPredicted}
Actual Mercury: ${analysisResult.mercuryActual}
Predicted Zinc: ${analysisResult.zincPredicted}
Actual Zinc: ${analysisResult.zincActual}
Based on this comparison, should the mining company continue mining in this location? 
Please provide a short sentence like 'Yes, you should continue mining' or 'No, you shouldn't continue mining'.`

    const gptResponse = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are an AI assistant that advises on mining decisions based on a comparison of predicted and actual toxic mineral values." },
        { role: "user", content: prompt }
      ],
    })

    const decision = gptResponse.data.choices[0].message?.content.trim()

    return NextResponse.json({
      ...analysisResult,
      decision,
    })
  } catch (error) {
    console.error('Error in API route:', error)
    return NextResponse.json({ error: 'Internal server error: ' + (error as Error).message }, { status: 500 })
  }
}

