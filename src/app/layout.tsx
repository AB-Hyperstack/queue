// Root layout — serves as a pass-through.
// The actual html/body/font/intl-provider lives in [locale]/layout.tsx.
// This file only exists for API routes and the auth callback that sit outside [locale].

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
