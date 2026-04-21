/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteName, siteUrl, confirmationUrl }: InviteEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Você foi convidado para o {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandSection}><Text style={brand}>{siteName}</Text></Section>
        <Heading style={h1}>Você foi convidado</Heading>
        <Text style={text}>
          Você recebeu um convite para participar do{' '}
          <Link href={siteUrl} style={link}><strong>{siteName}</strong></Link>.
          Clique no botão abaixo para aceitar e criar sua conta.
        </Text>
        <Section style={btnWrap}>
          <Button style={button} href={confirmationUrl}>Aceitar convite</Button>
        </Section>
        <Text style={smallText}>
          Se você não esperava este convite, pode ignorar este e-mail com segurança.
        </Text>
        <Text style={footer}>© {new Date().getFullYear()} {siteName}. Todos os direitos reservados.</Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const brandSection = { borderBottom: '1px solid #e5e5e5', paddingBottom: '16px', marginBottom: '32px' }
const brand = { fontSize: '16px', fontWeight: 600, color: '#0a0a0a', margin: 0, letterSpacing: '-0.01em' }
const h1 = { fontSize: '24px', fontWeight: 600, color: '#0a0a0a', margin: '0 0 16px', letterSpacing: '-0.02em' }
const text = { fontSize: '15px', color: '#404040', lineHeight: '1.6', margin: '0 0 20px' }
const smallText = { fontSize: '13px', color: '#737373', lineHeight: '1.6', margin: '24px 0 0' }
const link = { color: '#0a0a0a', textDecoration: 'underline' }
const btnWrap = { textAlign: 'center' as const, margin: '32px 0' }
const button = { backgroundColor: '#0a0a0a', color: '#ffffff', fontSize: '14px', fontWeight: 500, borderRadius: '8px', padding: '12px 24px', textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '12px', color: '#a3a3a3', margin: '40px 0 0', borderTop: '1px solid #e5e5e5', paddingTop: '20px' }
