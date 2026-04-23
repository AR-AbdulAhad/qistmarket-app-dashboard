
export default function OrderCustomerInfo({ customerName, whatsappNumber, address, city, area, block, houseNo, street, zone, alternateContact }: { customerName: string | null; whatsappNumber: string | null; address: string | null; city: string | null; area: string | null; block: string | null; houseNo: string | null; street: string | null; zone: string | null; alternateContact: string | null }) {

    const shouldDisplay = (value: any): boolean => {
        if (value === null || value === undefined) return false
        if (typeof value === 'string' && value.trim() === '') return false
        if (Array.isArray(value) && value.length === 0) return false
        if (typeof value === 'object' && Object.keys(value).length === 0) return false
        return true
    }

    const Field = ({ label, value, className = "" }: { label: string; value: any; className?: string }) => {
    if (!shouldDisplay(value)) return null

  const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">{label}</label>
      <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
        {displayValue}
      </div>
    </div>
  )
}
        return (
<div className="mb-12">
        <h2 className="mb-4 text-2xl font-semibold text-dark dark:text-white">
            Customer Information
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Field label="Customer Name" value={customerName} />
          <Field label="WhatsApp Number" value={whatsappNumber} />
          <Field label="Address" value={address} />
          <Field label="City" value={city} />
          <Field label="Area" value={area} />
          <Field label="Block" value={block} />
          <Field label="House Number" value={houseNo} />
          <Field label="Street" value={street} />
          <Field label="Zone" value={zone} />
          <Field label="Alternate Contact" value={alternateContact} />
        </div>
      </div>
      )}