import { CustomerPricingManagement } from "@/components/customer-pricing-management"

export const metadata = {
  title: "Customer Pricing",
  description: "Manage customer-specific pricing",
}

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function CustomerPricingPage({ searchParams }: PageProps) {
  const storeId = searchParams.storeId as string
  const customerId = searchParams.customerId as string

  if (!storeId || !customerId) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl font-bold text-red-600">Missing Parameters</h1>
        <p className="text-gray-600">Please provide storeId and customerId in the URL.</p>
        <p className="text-sm text-gray-400 mt-2">Example: /customer-pricing?storeId=...&customerId=...</p>
      </div>
    )
  }

  return <CustomerPricingManagement storeId={storeId} customerId={customerId} />
}
