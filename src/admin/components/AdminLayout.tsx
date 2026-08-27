import React from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  ShoppingCart, 
  Users, 
  Mail, 
  LogOut, 
  Menu, 
  X, 
  CreditCard, 
  ExternalLink,
  User,
  Settings,
  Truck,
  Gift,
  Ticket
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import irisjevLogo from '../../assets/images/irisjev_logo_1785688429320.jpg';

export function AdminLayout() {
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Page Builder', path: '/admin/page-builder', icon: Settings, badge: 'NEW' },
    { name: 'Analytics & Orders', path: '/admin/orders', icon: ShoppingCart },
    { name: 'Products & Inventory', path: '/admin/products', icon: ShoppingBag },
    { name: 'Clients & Customers', path: '/admin/customers', icon: Users },
    { name: 'Leads & Enquiries', path: '/admin/leads', icon: Mail },
    { name: 'Coupons & Discounts', path: '/admin/coupons', icon: Ticket, badge: 'PROMO' },
    { name: 'Promotional Banners', path: '/admin/promotional-banners', icon: Gift, badge: 'NEW' },
    { name: 'Payment Transactions', path: '/admin/payment-logs', icon: CreditCard },
    { name: 'Shipping & Payments', path: '/admin/shipping', icon: Truck, badge: 'NEW' },
  ];

  return (
    <div className="h-screen overflow-hidden bg-[#0d1312] flex font-sans text-[#1b1c1c] p-2 md:p-3 selection:bg-[#fed65b] selection:text-[#1b1c1c]">
      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sleek Obsidian & Royal Gold Sidebar */}
      <aside className={`fixed md:sticky top-0 left-0 z-50 h-[calc(100vh-16px)] md:h-[calc(100vh-24px)] my-auto w-64 bg-[#0d1312] text-white transition-transform duration-300 ease-in-out ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 flex flex-col justify-between px-4 py-6 select-none`}>
        
        {/* Brand Header with Real Website Logo */}
        <div>
          <div className="flex items-center justify-between px-2 mb-8">
            <Link to="/admin" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-white p-0.5 shadow-md shadow-[#fed65b]/10 group-hover:scale-105 transition-transform border border-[#fed65b]/40 shrink-0">
                <img 
                  src={irisjevLogo} 
                  alt="Irisjev Wooden Crafts Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-sm tracking-wide text-white block leading-tight truncate">
                  Irisjev <span className="text-[#fed65b]">Wooden Crafts</span>
                </span>
                <span className="text-[10px] font-label-caps uppercase tracking-wider text-[#a19f99] block">
                  Admin Dashboard
                </span>
              </div>
            </Link>
            <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setIsMobileOpen(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation Section */}
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-bold uppercase tracking-widest text-[#5c6865] mb-3 font-label-caps">
              Navigation
            </p>
            <nav className="space-y-1.5">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.path === '/admin'}
                  onClick={() => setIsMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive 
                        ? 'bg-white/12 text-white font-semibold shadow-inner border border-white/10 backdrop-blur-sm' 
                        : 'text-[#96a3a0] hover:bg-white/6 hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                        isActive ? 'bg-[#fed65b] text-[#0d1312] shadow-sm' : 'bg-transparent text-[#96a3a0]'
                      }`}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <span className="flex-1">{item.name}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#fed65b] text-[#0d1312] font-label-caps uppercase tracking-wider shadow-2xs">
                          {item.badge}
                        </span>
                      )}
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#fed65b] animate-pulse"></span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>

        {/* User Account & Bottom Actions */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <p className="px-3 text-[11px] font-bold uppercase tracking-widest text-[#5c6865] font-label-caps">
            User Account
          </p>

          <div className="bg-white/6 border border-white/10 rounded-2xl p-3 flex items-center gap-3">
            <div className="relative">
              {/* Dummy Admin Avatar Icon */}
              <div className="w-10 h-10 rounded-full bg-[#1c2422] border border-[#fed65b]/50 flex items-center justify-center text-[#fed65b] shadow-inner">
                <User className="w-5 h-5" />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0d1312]"></span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white truncate">Admin</h4>
              <p className="text-[10px] text-[#fed65b] font-mono">#admin-01</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link
              to="/"
              target="_blank"
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-[11px] font-medium bg-white/6 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
              title="Open Live Storefront"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#fed65b]" />
              <span>Storefront</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-[11px] font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#ffffff] rounded-[24px] md:rounded-[32px] border border-[#e8e4dc] shadow-2xl overflow-hidden h-full">
        
        {/* Mobile Header Bar */}
        <header className="md:hidden bg-white border-b border-[#eeebe4] px-5 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button 
              className="p-2 rounded-lg bg-[#f4f2ee] text-[#1b1c1c]" 
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <img src={irisjevLogo} alt="Logo" className="w-6 h-6 object-contain" />
              <span className="font-bold text-sm text-[#1b1c1c]">Irisjev Wooden Crafts</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#1c2422] text-[#fed65b] border border-[#fed65b]/40 font-bold flex items-center justify-center text-xs">
            <User className="w-4 h-4" />
          </div>
        </header>

        {/* Inner Page View Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 md:p-10 custom-scrollbar bg-[#fdfcfb]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
