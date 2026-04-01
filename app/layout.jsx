import './globals.css'

export const metadata = {
  title: 'Amped I — Company Portal',
  description: 'Amped I Company Portal',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
