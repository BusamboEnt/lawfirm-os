import { InvoiceForm } from "../invoice-form";

export default function NewInvoicePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Generate Invoice</h1>
      <p className="mt-1 text-sm text-gray-500">
        Select a matter to pull its unbilled billable time entries into a new
        invoice.
      </p>
      <div className="mt-6 max-w-3xl rounded-lg bg-white p-6 shadow-sm">
        <InvoiceForm />
      </div>
    </div>
  );
}
