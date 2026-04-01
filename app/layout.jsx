import './globals.css'

export const metadata = {
  title: 'Amped I — Interface',
  description: 'Internal interface — Amped I',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
