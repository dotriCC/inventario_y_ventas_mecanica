import { Layout } from "@/components/Layout";
import { useTransactions } from "@/hooks/use-transactions";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, ArrowDown, ArrowUp } from "lucide-react";
import { useState } from "react";

export default function History() {
  const { data: transactions, isLoading } = useTransactions();
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display text-slate-900">Transaction History</h1>
          <p className="text-slate-500 mt-1">View all past sales and inventory entries.</p>
        </div>

        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">Loading history...</div>
          ) : transactions?.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No transactions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Customer / Supplier</th>
                    <th className="px-6 py-4">Items</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Total</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions?.sort((a,b) => new Date(b.date || "").getTime() - new Date(a.date || "").getTime()).map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-slate-600">
                        {tx.date ? format(new Date(tx.date), "MMM d, yyyy h:mm a") : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={tx.type === 'sale' ? "bg-green-50 text-green-700 border-green-200" : "bg-blue-50 text-blue-700 border-blue-200"}>
                          {tx.type === 'sale' ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                          {tx.type === 'sale' ? 'Sale' : 'Purchase'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {tx.customerName}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {tx.items?.length || 0} items
                      </td>
                      <td className="px-6 py-4">
                        <span className={tx.paymentStatus === 'paid' ? "text-green-600 font-medium" : "text-amber-600 font-bold"}>
                          {tx.paymentStatus?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900">
                        ${Number(tx.totalAmount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedTransaction(tx)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-xl">
                            <DialogHeader>
                              <DialogTitle className="flex items-center justify-between">
                                <span>Transaction #{tx.id}</span>
                                <Badge className={tx.paymentStatus === 'paid' ? 'bg-green-600' : 'bg-amber-600'}>
                                  {tx.paymentStatus}
                                </Badge>
                              </DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                              <div className="flex justify-between text-sm mb-6 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <div>
                                  <p className="text-slate-500">Customer</p>
                                  <p className="font-bold">{tx.customerName}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-slate-500">Date</p>
                                  <p className="font-bold">{tx.date ? format(new Date(tx.date), "MMM d, yyyy") : "-"}</p>
                                </div>
                              </div>
                              
                              <table className="w-full text-sm">
                                <thead className="text-slate-500 border-b">
                                  <tr>
                                    <th className="text-left pb-2">Description</th>
                                    <th className="text-center pb-2">Qty</th>
                                    <th className="text-right pb-2">Price</th>
                                    <th className="text-right pb-2">Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y">
                                  {tx.items?.map((item, i) => (
                                    <tr key={i}>
                                      <td className="py-3">
                                        {item.description}
                                        {item.isService && <Badge variant="secondary" className="ml-2 text-[10px]">Service</Badge>}
                                      </td>
                                      <td className="py-3 text-center">{item.quantity}</td>
                                      <td className="py-3 text-right">${Number(item.unitPrice).toFixed(2)}</td>
                                      <td className="py-3 text-right font-medium">${Number(item.subtotal).toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot className="border-t">
                                  <tr>
                                    <td colSpan={3} className="pt-4 text-right font-bold text-lg">Total</td>
                                    <td className="pt-4 text-right font-bold text-lg text-primary">${Number(tx.totalAmount).toFixed(2)}</td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
