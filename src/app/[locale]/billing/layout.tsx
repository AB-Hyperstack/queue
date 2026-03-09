import Image from 'next/image';

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 px-6 py-12">
      <div className="mb-8 text-center">
        <Image
          src="/carelabs-logo.svg"
          alt="CareLabs"
          width={160}
          height={26}
          className="mx-auto"
        />
        <p className="mt-2 text-xs text-gray-400">QueueFlow</p>
      </div>
      {children}
    </div>
  );
}
