import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const formData = await request.formData()
  const name = formData.get('name')
  const email = formData.get('email')
  const message = formData.get('message')

  // Here you would typically send an email or store the message in a database
  // For this example, we'll just log it
  console.log('Received message:', { name, email, message })

  // In a real application, you'd use a service like SendGrid, AWS SES, or similar to send an email
  // await sendEmail({ name, email, message })

  return NextResponse.json({ success: true })
}

