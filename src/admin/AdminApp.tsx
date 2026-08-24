import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { AdminLayout } from './components/AdminLayout';
import { AdminLogin } from './AdminLogin';

// Placeholder Views
import { DashboardOverview } from './views/DashboardOverview';
import { ProductsManager } from './views/ProductsManager';
import { OrdersManager } from './views/OrdersManager';
import { CustomersManager } from './views/CustomersManager';
import { LeadsManager } from './views/LeadsManager';
import { WebhookLogsManager } from './views/WebhookLogsManager';

export function AdminApp() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (!session) {
        navigate('/admin/login');
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate('/admin/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbf9f8] text-[#1b1c1c]">
        <div className="w-12 h-12 border-4 border-[#fed65b] border-t-[#1c1b1b] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return <Routes><Route path="login" element={<AdminLogin />} /></Routes>;
  }

  if (session.user?.email !== 'admin@irisjev.com') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fbf9f8] text-[#1b1c1c] p-4 text-center space-y-4">
        <h1 className="text-3xl font-bold text-red-600">Unauthorized Access</h1>
        <p className="text-gray-600">This dashboard is restricted to the super admin.</p>
        <button 
          onClick={async () => {
            await supabase.auth.signOut();
            navigate('/admin/login');
          }}
          className="bg-[#1b1c1c] text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<DashboardOverview />} />
        <Route path="products" element={<ProductsManager />} />
        <Route path="orders" element={<OrdersManager />} />
        <Route path="customers" element={<CustomersManager />} />
        <Route path="leads" element={<LeadsManager />} />
        <Route path="payment-logs" element={<WebhookLogsManager />} />
        <Route path="webhook-logs" element={<WebhookLogsManager />} />
      </Route>
    </Routes>
  );
}
