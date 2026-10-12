import { ListingDetailView } from '@/features/listing/listing-detail-view';

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ListingDetailView id={id} />;
}
