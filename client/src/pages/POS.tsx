import { Layout } from "@/components/Layout";
import { useProducts } from "@/hooks/use-products";
import { useCreateTransaction } from "@/hooks/use-transactions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Trash2, ShoppingCart, User, Wrench, CreditCard } from "lucide-react";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type CartItem = {
  productId?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  isService?: boolean;
  maxStock?: number;
};

export default function POS() {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState("Cliente General");
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "pending">("paid");
  
  const { data: products } = useProducts({ search });
  const createTransaction = useCreateTransaction();

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        // Don't add if exceeding stock
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        description: product.name,
        quantity: 1,
        unitPrice: Number(product.priceSell),
        maxStock: product.stock
      }];
    });
  };

  const addManualService = () => {
    setCart(prev => [...prev, {
      description: "Mano de Obra / Servicio",
      quantity: 1,
      unitPrice: 50.00,
      isService: true
    }]);
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => {
      const item = prev[index];
      const newQty = Math.max(1, item.quantity + delta);
      
      if (!item.isService && item.maxStock && newQty > item.maxStock) return prev;

      const newCart = [...prev];
      newCart[index] = { ...item, quantity: newQty };
      return newCart;
    });
  };

  const updatePrice = (index: number, newPrice: number) => {
    setCart(prev => {
      const newCart = [...prev];
      newCart[index] = { ...prev[index], unitPrice: newPrice };
      return newCart;
    });
  };

  const removeItem = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  }, [cart]);

  const handleCheckout = () => {
    createTransaction.mutate({
      type: 'sale',
      customerName,
      paymentStatus,
      items: cart
    }, {
      onSuccess: () => {
        setCart([]);
        setCheckoutOpen(false);
        setCustomerName("Cliente General");
      }
    });
  };

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] lg:h-[calc(100vh-100px)] gap-6">
        
        {/* Left Side: Product Selector */}
        <div className="flex-1 flex flex-col bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search products..." 
                className="pl-9 bg-slate-50" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={addManualService} className="border-dashed border-slate-300">
              <Wrench className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {products?.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  className="flex flex-col text-left p-4 rounded-lg border border-slate-100 bg-slate-50 hover:border-primary hover:bg-primary/5 hover:shadow-md transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex justify-between w-full mb-1">
                    <span className="font-bold text-slate-800 line-clamp-1">{product.name}</span>
                  </div>
                  <div className="text-xs text-slate-500 mb-2">{product.category}</div>
                  <div className="mt-auto flex justify-between items-end w-full">
                    <span className="font-bold text-primary">${Number(product.priceSell).toFixed(2)}</span>
                    <Badge variant="outline" className={cn(
                      "text-[10px]",
                      product.stock === 0 ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-white"
                    )}>
                      {product.stock} in stock
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Cart */}
        <div className="w-full lg:w-[400px] flex flex-col bg-white rounded-xl border border-border shadow-lg">
          <div className="p-4 border-b border-border bg-slate-50/50">
            <h2 className="font-display font-bold text-lg flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Current Sale
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                <ShoppingCart className="h-12 w-12 opacity-20" />
                <p>Cart is empty</p>
              </div>
            ) : (
              cart.map((item, index) => (
                <div key={index} className="flex flex-col p-3 rounded-lg border border-slate-100 bg-slate-50/50 group hover:border-slate-200 hover:shadow-sm transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-medium text-slate-900 block">
                        {item.description}
                      </span>
                      {item.isService && <Badge variant="secondary" className="text-[10px] h-4 px-1 mt-1">Service</Badge>}
                    </div>
                    <button 
                      onClick={() => removeItem(index)}
                      className="text-slate-400 hover:text-destructive p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2 bg-white rounded-md border border-slate-200 p-0.5">
                      <button 
                        onClick={() => updateQuantity(index, -1)}
                        className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 rounded text-slate-600"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(index, 1)}
                        className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 rounded text-slate-600"
                      >
                        +
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">@</span>
                      <Input
                        type="number"
                        className="w-20 h-7 text-right p-1"
                        value={item.unitPrice}
                        onChange={(e) => updatePrice(index, parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  <div className="text-right mt-2 text-sm font-bold text-slate-700">
                    ${(item.quantity * item.unitPrice).toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-border bg-slate-50 space-y-4">
            <div className="flex justify-between items-center text-slate-500">
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-xl font-bold text-slate-900">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <Button 
              className="w-full h-12 text-lg bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" 
              disabled={cart.length === 0}
              onClick={() => setCheckoutOpen(true)}
            >
              Checkout
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Customer Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  className="pl-9" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Payment Status</Label>
              <Select value={paymentStatus} onValueChange={(v: any) => setPaymentStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid (Complete)</SelectItem>
                  <SelectItem value="pending">Pending (Credit)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between font-bold text-lg">
                <span>Total Amount:</span>
                <span className="text-primary">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutOpen(false)}>Cancel</Button>
            <Button onClick={handleCheckout} disabled={createTransaction.isPending}>
              {createTransaction.isPending ? "Processing..." : "Confirm Sale"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
