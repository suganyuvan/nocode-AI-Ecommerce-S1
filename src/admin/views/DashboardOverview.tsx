import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { ShoppingBag, ShoppingCart, Users, Mail, TrendingUp } from 'lucide-react';

export function DashboardOverview() {
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    customers: 0,
    leads: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const [
        { count: productsCount },
        { count: ordersCount },
        { count: customersCount },
        { count: leadsCount },
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('newsletter_subscribers').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        products: productsCount || 0,
        orders: ordersCount || 0,
        customers: customersCount || 0,
        leads: leadsCount || 0,
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  const statCards = [
    { title: 'Total Products', value: stats.products, icon: ShoppingBag, color: 'bg-blue-500', path: '/admin/products' },
    { title: 'Total Orders', value: stats.orders, icon: ShoppingCart, color: 'bg-green-500', path: '/admin/orders' },
    { title: 'Customers', value: stats.customers, icon: Users, color: 'bg-purple-500', path: '/admin/customers' },
    { title: 'Newsletter Leads', value: stats.leads, icon: Mail, color: 'bg-[#fed65b]', path: '/admin/leads' },
  ];

  if (loading) {
    return <div className="text-gray-500">Loading Dashboard...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center">
            <div className={`p-4 rounded-xl text-white ${stat.color} mr-4`}>
              <stat.icon className={`w-6 h-6 ${stat.title === 'Newsletter Leads' ? 'text-[#1b1c1c]' : ''}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 font-semibold">{stat.title}</p>
              <p className="text-2xl font-bold text-[#1b1c1c]">{stat.value}</p>
              <Link to={stat.path} className="text-sm text-blue-500 hover:text-blue-700 mt-2 inline-block font-medium">View all</Link>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-gray-500" />
          Recent Activity
        </h3>
        <p className="text-gray-500">More detailed analytics coming soon...</p>
      </div>
    </div>
  );
}
