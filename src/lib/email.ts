import { render } from '@react-email/render'
import { Resend } from 'resend'
import TrainingCompletionEmail from '../components/emails/TrainingCompletionEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

interface GeneratedImage {
  id: string
  prompt: string
  imageUrl: string
  createdAt: Date
}

interface TrainingCompletionEmailData {
  userEmail: string
  userName?: string
  modelName: string
  generatedImages: GeneratedImage[]
  loginUrl: string
}

export async function sendTrainingCompletionEmail({
  userEmail,
  userName,
  generatedImages,
  loginUrl
}: Omit<TrainingCompletionEmailData, 'modelName'>) {
  try {
    console.log('📧 Sending training completion email to:', userEmail)
    
    // Render the React email component to HTML
    const emailHtml = await render(
      TrainingCompletionEmail({
        userName: userName || userEmail.split('@')[0],
        generatedImages,
        loginUrl
      })
    )

    const { data, error } = await resend.emails.send({
      from: 'Amazing Photos <noreply@mail.amazing.photos>',
      to: [userEmail],
      subject: '🎉 Your AI Model is Ready!',
      html: emailHtml
    })

    if (error) {
      console.error('❌ Failed to send email:', error)
      throw new Error(`Email sending failed: ${error.message}`)
    }

    console.log('✅ Training completion email sent successfully:', data?.id)
    return data

  } catch (error) {
    console.error('❌ Error sending training completion email:', error)
    throw error
  }
} 