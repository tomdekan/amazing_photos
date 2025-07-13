import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface GeneratedImage {
  id: string
  prompt: string
  imageUrl: string
  createdAt: Date
}

interface TrainingCompletionEmailProps {
  userName: string
  generatedImages: GeneratedImage[]
  loginUrl: string
}

export const TrainingCompletionEmail = ({
  userName,
  generatedImages,
  loginUrl,
}: TrainingCompletionEmailProps) => {
  const previewText = `Your AI model is ready! Check out your sample images.`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>🎉 Congratulations!</Heading>
            <Text style={subtitle}>Your AI model has finished training</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={paragraph}>Hi {userName},</Text>
            
            <Text style={paragraph}>
              Great news! Your personalized AI model has finished training and is now ready for you to use.
            </Text>
            
            <Text style={paragraph}>
              We&apos;ve already generated some amazing sample images to get you started.
            </Text>

            <Text style={paragraph}>
              Check them all out, and start generating your own, in your dashboard.
            </Text>
          </Section>

    {/* Call to Action */}
          <Section style={cta}>
            <Text style={paragraph}>
              Ready to start generating images with your model?
            </Text>
            
            <Button style={button} href={loginUrl}>
              Go to your dashboard to start generating images
            </Button>
          </Section>

          {/* Generated Images Gallery */}
          <Section style={gallery}>
            <Section style={imageGrid}>
              {generatedImages.slice(0, 5).map((image) => (
                <Section key={image.id} style={imageItem}>
                  <Img
                    src={image.imageUrl}
                    alt={image.prompt}
                    style={imageStyle}
                  />
                  <Text style={imageCaption}></Text>
                </Section>
              ))}
            </Section>
          </Section>

      

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              Happy creating!<br />
              The Amazing Photos Team
            </Text>
          </Section>
        </Container>
        
        {/* Footer outside container */}
        <Section style={outerFooter}>
          <Text style={outerFooterText}>
            This email was sent because your AI model training completed.
          </Text>
        </Section>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: '#f9f9f9',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '40px',
  margin: '20px auto',
  maxWidth: '600px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
}

const header = {
  textAlign: 'center' as const,
  marginBottom: '30px',
}

const h1 = {
  color: '#2563eb',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 10px 0',
}

const subtitle = {
  fontSize: '18px',
  color: '#666',
  margin: '0',
}

const content = {
  marginBottom: '30px',
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#333',
  margin: '0 0 20px 0',
}

const gallery = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '30px',
}


const imageGrid = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: '10px',
  justifyContent: 'center',
}

const imageItem = {
  textAlign: 'center' as const,
  marginBottom: '15px',
}

const imageStyle = {
  maxWidth: '160px',
  height: 'auto',
  borderRadius: '8px',
  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  marginBottom: '8px',
}

const imageCaption = {
  fontSize: '11px',
  color: '#666',
  fontStyle: 'italic',
  maxWidth: '160px',
  margin: '0 auto',
  lineHeight: '1.3',
}

const cta = {
  textAlign: 'center' as const,
  marginBottom: '30px',
}

const button = {
  backgroundColor: '#667eea',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '15px 30px',
  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '20px 0',
}

const footer = {
  textAlign: 'center' as const,
}

const footerText = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0',
  lineHeight: '1.4',
}

const outerFooter = {
  textAlign: 'center' as const,
  marginTop: '20px',
}

const outerFooterText = {
  fontSize: '12px',
  color: '#9ca3af',
  margin: '0',
}

export default TrainingCompletionEmail 