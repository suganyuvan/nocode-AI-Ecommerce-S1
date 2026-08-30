import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { adminSupabase } from '../utils/supabaseClient';
import { AdminLayout } from './components/AdminLayout';
import { AdminLogin } from './AdminLogin';

// Placeholder Views
import { DashboardOverview } from './views/DashboardOverview';
import { ProductsManager } from './views/ProductsManager';
import { OrdersManager } from './views/OrdersManager';
import { CustomersManager } from './views/CustomersManager';
import { LeadsManager } from './views/LeadsManager';
import { WebhookLogsManager } from './views/WebhookLogsManager';
import { ShippingManager } from './views/ShippingManager';
import { StoreSettingsManager } from './views/StoreSettingsManager';
import { CouponsManager } from './views/CouponsManager';
import { PromoBannersManager } from './views/PromoBannersManager';
import { PageBuilderManager } from './views/PageBuilderManager';
import { ShippingLabelManager } from './views/ShippingLabelManager';
import { SalesAnalyticsManager } from './views/SalesAnalyticsManager';
import { SupportTicketsManager } from './views/SupportTicketsManager';
import { WebhooksManager } from './views/WebhooksManager';

export function AdminApp() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    adminSupabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (!session) {
        navigate('/admin/login');
      }
    });

    const {
      data: { subscription },
    } = adminSupabase.auth.onAuthStateChange((_event, session) => {
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

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<DashboardOverview />} />
        <Route path="page-builder" element={<PageBuilderManager />} />
        <Route path="sales-analytics" element={<SalesAnalyticsManager />} />
        <Route path="products" element={<ProductsManager />} />


        <Route path="orders" element={<OrdersManager />} />
        <Route path="customers" element={<CustomersManager />} />
        <Route path="support-tickets" element={<SupportTicketsManager />} />
        <Route path="leads" element={<LeadsManager />} />
        <Route path="coupons" element={<CouponsManager />} />
        <Route path="promotions" element={<StoreSettingsManager />} />
        <Route path="promotional-banners" element={<PromoBannersManager />} />
        <Route path="payment-logs" element={<WebhookLogsManager />} />
        <Route path="webhook-logs" element={<WebhookLogsManager />} />
        <Route path="webhooks" element={<WebhooksManager />} />
        <Route path="shipping" element={<ShippingManager />} />
        <Route path="shipping-labels" element={<ShippingLabelManager />} />
        <Route path="settings" element={<StoreSettingsManager />} />

      </Route>
    </Routes>
  );
}

