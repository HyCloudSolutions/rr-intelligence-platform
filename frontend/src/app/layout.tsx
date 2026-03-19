import './globals.css';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/Providers';
import { AppShell } from '@/components/AppShell';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'RestaurantRisk Intelligence Platform',
  description: 'Predictive food safety inspection prioritization powered by machine learning',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} font-sans antialiased`}>
        <Providers>
          <AppShell>
            {children}
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}
