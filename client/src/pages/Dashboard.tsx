import { Layout } from "@/components/Layout";
import { useStats, useTransactions, useCreateTransaction } from "@/hooks/use-transactions";
import { useProducts } from "@/hooks/use-products";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  Package, 
  ArrowRight,
  Plus
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: lowStockProducts } = useProducts({ lowStock: 'true' });
  const { data: recentTransactions } = useTransactions();
  
  // Filter only recent sales (last 5)
  const recentSales = recentTransactions
    ?.filter(t => t.type === 'sale')
    .slice(0, 5) || [];

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display text-slate-900">Dashboard</h1>
            <p className="text-slate-500 mt-1">Overview of your mechanic shop performance today.</p>
          </div>
          <Link href="/pos">
            <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5">
              <Plus className="mr-2 h-5 w-5" />
              New Sale
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Daily Sales Card */}
          <div className="stat-card border-l-4 border-l-primary">
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Daily Sales</p>
                <h3 className="text-3xl font-bold mt-2 text-slate-900">
                  ${stats?.dailySales.toFixed(2) || "0.00"}
                </h3>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg text-primary">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-green-600 font-medium relative z-10">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>Today's revenue</span>
            </div>
          </div>

          {/* Low Stock Card */}
          <div className="stat-card border-l-4 border-l-destructive">
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Critical Stock</p>
                <h3 className="text-3xl font-bold mt-2 text-slate-900">
                  {stats?.lowStockCount || 0}
                </h3>
              </div>
              <div className="p-3 bg-destructive/10 rounded-lg text-destructive">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-destructive font-medium relative z-10">
              <Package className="h-4 w-4 mr-1" />
              <span>Items below minimum</span>
            </div>
          </div>

          {/* Pending Services Card */}
          <div className="stat-card border-l-4 border-l-amber-500">
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Pending Payments</p>
                <h3 className="text-3xl font-bold mt-2 text-slate-900">
                  {stats?.pendingServices || 0}
                </h3>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-lg text-amber-600">
                <Clock className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-amber-600 font-medium relative z-10">
              <Clock className="h-4 w-4 mr-1" />
              <span>Unpaid invoices</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Low Stock Alert Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold font-display flex items-center gap-2">
                <AlertTriangle className="text-destructive h-5 w-5" />
                Low Stock Alerts
              </h2>
              <Link href="/inventory">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                  View Inventory <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
              {lowStockProducts?.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>Inventory levels are healthy.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3">Product Name</th>
                        <th className="px-6 py-3">Category</th>
                        <th className="px-6 py-3 text-right">Current Stock</th>
                        <th className="px-6 py-3 text-right">Min Stock</th>
                        <th className="px-6 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lowStockProducts?.slice(0, 5).map((product) => (
                        <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-3 font-medium text-slate-900">{product.name}</td>
                          <td className="px-6 py-3 text-slate-500">
                            <span className="bg-slate-100 px-2 py-1 rounded text-xs">{product.category}</span>
                          </td>
                          <td className="px-6 py-3 text-right font-bold text-destructive">{product.stock}</td>
                          <td className="px-6 py-3 text-right text-slate-500">{product.minStock}</td>
                          <td className="px-6 py-3 text-right">
                            <Link href="/inventory">
                              <span className="text-primary hover:underline cursor-pointer font-medium text-xs">Restock</span>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold font-display">Recent Sales</h2>
            <div className="space-y-3">
              {recentSales.map((sale) => (
                <div key={sale.id} className="bg-white p-4 rounded-xl border border-border shadow-sm hover:shadow-md transition-all flex justify-between items-center group">
                  <div>
                    <p className="font-bold text-slate-900">{sale.customerName}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {sale.date ? format(new Date(sale.date), "MMM d, h:mm a") : "-"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary text-lg">
                      ${Number(sale.totalAmount).toFixed(2)}
                    </p>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full capitalize",
                      sale.paymentStatus === 'paid' 
                        ? "bg-green-100 text-green-700" 
                        : "bg-amber-100 text-amber-700"
                    )}>
                      {sale.paymentStatus}
                    </span>
                  </div>
                </div>
              ))}
              
              {recentSales.length === 0 && (
                <div className="text-center p-8 bg-white border border-dashed border-slate-200 rounded-xl">
                  <p className="text-slate-400">No recent sales found</p>
                </div>
              )}

              <Link href="/history">
                <Button variant="outline" className="w-full mt-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900">
                  View All History
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
