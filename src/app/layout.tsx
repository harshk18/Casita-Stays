import type { Metadata } from 'next';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { Providers } from '@/components/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Casita Stays',
  description: 'Student accommodation marketplace',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider>
          <Providers>{children}</Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
