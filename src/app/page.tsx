import { Suspense } from 'react';
import { SearchView } from '@/features/search/search-view';

export default function Home() {
  return (
    <Suspense>
      <SearchView />
    </Suspense>
  );
}
