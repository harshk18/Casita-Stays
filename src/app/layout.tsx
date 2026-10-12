import type { Metadata } from 'next';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { Providers } from '@/components/Providers';
import './globals.css';
import { QueryProvider } from '@/lib/query/provider';

export const metadata: Metadata = {
  title: 'Casita Stays',
  description: 'Student accommodation marketplace',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider>
          <Providers>
            <QueryProvider>{children}</QueryProvider>
          </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
