import Link from "next/link";

export function SpaceBanner({
  isOwnSpace,
  ownerName,
}: {
  isOwnSpace: boolean;
  ownerName: string;
}) {
  if (isOwnSpace) return null;
  return (
    <div className="mb-4 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-950">
      Vous consultez l&apos;espace de <strong>{ownerName}</strong>.{" "}
      <Link href="/settings/sharing" className="font-medium underline">
        Changer d&apos;espace
      </Link>
    </div>
  );
}
