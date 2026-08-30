import React, { useState, useEffect } from 'react';
import { Customer, Order, Currency, ActiveTab, CartItem, Product, SavedAddress, SupportTicket, TicketCategory, TicketPriority, TicketMessage } from '../types';
import { supabase } from '../utils/supabaseClient';
import { formatPrice } from '../utils/currency';
import { InvoiceModal } from '../components/InvoiceModal';
import { TrackOrderModal } from '../components/TrackOrderModal';
import { CustomerAuthCard } from '../components/CustomerAuthCard';
import { getSavedAddressList, saveAddressToBook, deleteAddressFromBook, setDefaultAddressInBook } from '../utils/addressBookManager';
import { dispatchWebhookEvent } from '../utils/webhookDispatcher';

interface MyAccountViewProps {
  customer: Customer | null;
  currency: Currency;
  cartItems: CartItem[];
  wishlist: Product[];
  products: Product[];
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  onLoginSuccess?: (customer: Customer) => void;
}

export const MyAccountView: React.FC<MyAccountViewProps> = ({
  customer,
  currency,
  cartItems,
  wishlist,
  products,
  setActiveTab,
  onOpenAuthModal,
  onLogout,
  onLoginSuccess,
}) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<any | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'address' | 'support' | 'overview'>('orders');

  // Accordion state for Order History (matching design)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Live Tracking Modal & Guest Search states
  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [selectedTrackingQuery, setSelectedTrackingQuery] = useState('');
  const [guestOrderQuery, setGuestOrderQuery] = useState('');

  // Support Tickets State
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState<TicketCategory>('Order & Shipment');
  const [ticketPriority, setTicketPriority] = useState<TicketPriority>('Medium');
  const [ticketOrderNumber, setTicketOrderNumber] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [customerReplyText, setCustomerReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Shipping & Profile Details State
  const [savedFullName, setSavedFullName] = useState(customer?.full_name || '');
  const [savedEmail, setSavedEmail] = useState(customer?.email || '');
  const [savedPhone, setSavedPhone] = useState(customer?.phone ? customer.phone.replace(/\D/g, '').slice(-10) : '');
  const [savedAddress, setSavedAddress] = useState(customer?.address || '');
  const [savedCity, setSavedCity] = useState(customer?.city || '');
  const [savedState, setSavedState] = useState(customer?.state || 'Tamil Nadu');
  const [savedPin, setSavedPin] = useState(customer?.postal_code || '');
  const [savedCountry, setSavedCountry] = useState('India');
  const [savedLabel, setSavedLabel] = useState('Home');
  const [isDefaultAddr, setIsDefaultAddr] = useState(true);

  // Multiple Addresses State
  const [addressList, setAddressList] = useState<SavedAddress[]>(() => getSavedAddressList(customer));
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);

  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [detailsSuccess, setDetailsSuccess] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Auto-sync when customer prop updates
  useEffect(() => {
    if (customer) {
      if (customer.full_name) setSavedFullName(customer.full_name);
      if (customer.email) setSavedEmail(customer.email);
      if (customer.phone) setSavedPhone(customer.phone.replace(/\D/g, '').slice(-10));
      if (customer.address) setSavedAddress(customer.address);
      if (customer.city) setSavedCity(customer.city);
      if (customer.state) setSavedState(customer.state);
      if (customer.postal_code) setSavedPin(customer.postal_code);

      const list = getSavedAddressList(customer);
      setAddressList(list);
    }
  }, [customer]);

  // Fetch customer orders from Supabase
  useEffect(() => {
    const fetchCustomerOrders = async () => {
      if (!customer) {
        setIsLoadingOrders(false);
        return;
      }

      setIsLoadingOrders(true);
      try {
        const isUuid = !!customer.id && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(customer.id);
        const cleanPhone = (customer.phone || '').replace(/\D/g, '');

        const orConditions: string[] = [];
        if (isUuid) {
          orConditions.push(`customer_id.eq.${customer.id}`);
        }
        if (cleanPhone && cleanPhone.length >= 4) {
          orConditions.push(`payment_info.ilike.%${cleanPhone}%`);
        }

        if (orConditions.length > 0) {
          const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .or(orConditions.join(','))
            .order('created_at', { ascending: false });

          if (data) {
            setOrders(data);
            // Default expand first order if available
            if (data.length > 0 && !expandedOrderId) {
              setExpandedOrderId(data[0].id);
            }
          }
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.warn('Orders fetch error:', err);
      } finally {
        setIsLoadingOrders(false);
      }
    };

    fetchCustomerOrders();
  }, [customer]);

  // Fetch customer support tickets from Supabase
  const fetchCustomerTickets = async () => {
    if (!customer?.email && !customer?.id) return;
    setIsLoadingTickets(true);
    try {
      let query = supabase.from('support_tickets').select('*');
      if (customer.id && !customer.id.startsWith('guest-') && !customer.id.startsWith('cust-')) {
        query = query.or(`customer_id.eq.${customer.id},customer_email.ilike.${customer.email}`);
      } else if (customer.email) {
        query = query.ilike('customer_email', customer.email.trim());
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (data) {
        setSupportTickets(data as SupportTicket[]);
        if (data.length > 0 && !expandedTicketId) {
          setExpandedTicketId(data[0].id || data[0].ticket_number);
        }
      }
    } catch (e) {
      console.warn('Error fetching support tickets:', e);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (customer) {
      fetchCustomerTickets();
    }
  }, [customer]);

  // Create new support ticket
  const handleCreateSupportTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    if (!ticketSubject.trim()) {
      setTicketError('Please provide a subject for your ticket.');
      return;
    }
    if (!ticketDescription.trim()) {
      setTicketError('Please describe your issue or inquiry in detail.');
      return;
    }

    setIsSubmittingTicket(true);
    setTicketError(null);

    const ticketNumber = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
    const isUuid = !!customer.id && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(customer.id);
    
    // Find matching order if selected
    const matchingOrder = orders.find(o => o.order_number === ticketOrderNumber || `#${o.id?.slice(0, 6)?.toUpperCase()}` === ticketOrderNumber);

    const newTicketPayload: any = {
      ticket_number: ticketNumber,
      customer_name: customer.full_name || 'Valued Collector',
      customer_email: customer.email,
      customer_phone: customer.phone || '',
      order_number: ticketOrderNumber || null,
      category: ticketCategory,
      subject: ticketSubject.trim(),
      description: ticketDescription.trim(),
      priority: ticketPriority,
      status: 'open',
      messages: [],
    };

    if (isUuid) {
      newTicketPayload.customer_id = customer.id;
    }
    if (matchingOrder?.id && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(matchingOrder.id)) {
      newTicketPayload.order_id = matchingOrder.id;
    }

    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert([newTicketPayload])
        .select()
        .single();

      if (error) throw error;

      const created = (data as SupportTicket) || newTicketPayload;
      setSupportTickets(prev => [created, ...prev]);
      
      // Dispatch ticket.created webhook event to external endpoints
      dispatchWebhookEvent('ticket.created', {
        ticket_id: created.id,
        ticket_number: created.ticket_number,
        customer_name: created.customer_name,
        customer_email: created.customer_email,
        customer_phone: created.customer_phone,
        order_number: created.order_number,
        category: created.category,
        priority: created.priority,
        subject: created.subject,
        description: created.description,
        status: created.status,
        created_at: created.created_at || new Date().toISOString()
      });

      setTicketSuccess(`Support ticket #${ticketNumber} created successfully! Our concierge team has been notified.`);
      setIsCreatingTicket(false);
      setTicketSubject('');
      setTicketDescription('');
      setTicketOrderNumber('');
      setExpandedTicketId(created.id || ticketNumber);
      setTimeout(() => setTicketSuccess(null), 5000);
    } catch (err: any) {
      console.error('Error creating support ticket:', err);
      setTicketError('Failed to submit ticket: ' + (err?.message || 'Database error'));
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  // Customer follow-up message reply
  const handleSendCustomerReply = async (ticket: SupportTicket) => {
    if (!customerReplyText.trim()) return;
    setIsSendingReply(true);

    try {
      const existingMessages = Array.isArray(ticket.messages) ? [...ticket.messages] : [];
      const newMsg: TicketMessage = {
        id: `msg-${Date.now()}`,
        sender: 'customer',
        sender_name: customer?.full_name || 'Customer',
        message: customerReplyText.trim(),
        created_at: new Date().toISOString()
      };
      existingMessages.push(newMsg);

      const { error } = await supabase
        .from('support_tickets')
        .update({
          messages: existingMessages,
          status: 'open',
          updated_at: new Date().toISOString()
        })
        .eq('id', ticket.id);

      if (error) throw error;

      // Dispatch ticket.responded webhook event
      dispatchWebhookEvent('ticket.responded', {
        ticket_id: ticket.id,
        ticket_number: ticket.ticket_number,
        sender: 'customer',
        sender_name: customer?.full_name || 'Customer',
        customer_email: customer?.email,
        message: customerReplyText.trim(),
        created_at: new Date().toISOString()
      });

      setSupportTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, messages: existingMessages, status: 'open' } : t));
      setCustomerReplyText('');
    } catch (e) {
      console.error('Error sending customer reply:', e);
    } finally {
      setIsSendingReply(false);
    }
  };

  // Toggle order accordion
  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId);
  };

  // Open Tax Invoice modal
  const handleOpenInvoice = (order: any) => {
    const isPaid = order.payment_status === 'paid' || order.status === 'confirmed';
    const isCOD = order.payment_method === 'cod' || order.payment_info === 'Cash on Delivery';

    setSelectedInvoiceOrder({
      items: (order.order_items || []).map((i: any) => {
        const matchedProd = products.find(p => p.id === i.product_id || p.name === i.product_name || i.product_name?.includes(p.name));
        return {
          product: {
            id: i.product_id,
            name: i.product_name,
            priceINR: i.unit_price,
            priceUSD: i.unit_price / 83,
            image: matchedProd?.image || '',
            galleryImages: matchedProd?.galleryImages || [],
            description: matchedProd?.description || '',
            dimensions: matchedProd?.dimensions || '',
            material: i.selected_timber || 'Wood',
            style: matchedProd?.style || '',
            authenticity: 'Certified',
            timberOptions: [],
            rating: 5,
            reviewCount: 1,
          },
          quantity: i.quantity,
          selectedTimber: i.selected_timber || 'Classic Teak',
        };
      }),
      customerName: customer?.full_name || order.shipping_address?.customerName || 'Valued Collector',
      address: typeof order.shipping_address === 'string' ? order.shipping_address : `${order.shipping_address?.address || customer?.address || ''}, ${order.shipping_address?.city || customer?.city || ''}`,
      subtotal: order.subtotal || order.total_amount,
      discountAmount: order.discount_amount || 0,
      shipping: order.shipping_charge || 0,
      gstAmount: order.gst_amount || 0,
      gstRate: order.gst_rate || 3,
      total: order.total_amount,
      invoiceNumber: `INV-${order.order_number?.replace(/\D/g, '') || order.id?.slice(0, 6) || '88392'}`,
      razorpayPaymentId: order.razorpay_payment_id || order.payment_info || 'COD-VERIFIED',
      paymentMethod: order.payment_method || (isCOD ? 'cod' : 'prepaid'),
      codHandlingFee: isCOD ? 150 : 0,
    });
  };

  // Start editing a saved address
  const handleEditAddress = (addr: SavedAddress) => {
    setEditingAddressId(addr.id);
    setIsAddingNewAddress(true);
    setSavedLabel(addr.label || 'Home');
    setSavedFullName(addr.fullName);
    setSavedPhone(addr.phone);
    if (addr.email) setSavedEmail(addr.email);
    setSavedAddress(addr.address);
    setSavedCity(addr.city);
    setSavedState(addr.state);
    setSavedPin(addr.postalCode);
    setSavedCountry(addr.country || 'India');
    setIsDefaultAddr(!!addr.isDefault);
  };

  // Set default address
  const handleSetDefault = (id: string) => {
    const updated = setDefaultAddressInBook(id, customer);
    setAddressList(updated);
    setDetailsSuccess('Default delivery address updated!');
    setTimeout(() => setDetailsSuccess(null), 3000);
  };

  // Delete address
  const handleDeleteAddress = (id: string) => {
    const updated = deleteAddressFromBook(id, customer);
    setAddressList(updated);
    setDetailsSuccess('Address removed from address book.');
    setTimeout(() => setDetailsSuccess(null), 3000);
  };

  // Handle Save / Add Address
  const handleSaveProfileAndDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    const errors: Record<string, string> = {};
    if (!savedFullName.trim()) {
      errors.fullName = 'Full name is required.';
    }
    if (!savedEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(savedEmail.trim())) {
      errors.email = 'Please enter a valid email address.';
    }
    if (savedPhone && !/^[6-9]\d{9}$/.test(savedPhone.replace(/\D/g, ''))) {
      errors.phone = 'Please enter a valid 10-digit mobile number.';
    }
    if (!savedAddress.trim()) {
      errors.address = 'Street address is required.';
    }
    if (!savedCity.trim()) {
      errors.city = 'City is required.';
    }
    if (!savedPin.trim() || savedPin.replace(/\D/g, '').length !== 6) {
      errors.postalCode = 'Please enter a valid 6-digit PIN code.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSavingDetails(true);

    try {
      const cleanPhone = savedPhone ? `+91 ${savedPhone.replace(/\D/g, '')}` : customer.phone || '';
      const isUuid = !!customer.id && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(customer.id);
      
      // 1. Update backend Supabase
      if (isUuid) {
        await supabase
          .from('customers')
          .update({
            full_name: savedFullName.trim(),
            email: savedEmail.trim().toLowerCase(),
            phone: cleanPhone,
            address: savedAddress.trim(),
            city: savedCity.trim(),
            state: savedState.trim(),
            postal_code: savedPin.trim(),
            country_code: '+91',
          })
          .eq('id', customer.id);
      }

      // 2. Update address book with multiple addresses
      const updatedList = saveAddressToBook({
        id: editingAddressId || undefined,
        label: savedLabel.trim() || 'Home',
        fullName: savedFullName.trim(),
        email: savedEmail.trim().toLowerCase(),
        phone: savedPhone.replace(/\D/g, ''),
        address: savedAddress.trim(),
        city: savedCity.trim(),
        state: savedState.trim(),
        postalCode: savedPin.trim(),
        country: savedCountry,
        isDefault: isDefaultAddr,
      }, customer);
      setAddressList(updatedList);

      // 3. Update active customer object
      const updatedCust: Customer = {
        ...customer,
        full_name: savedFullName.trim(),
        email: savedEmail.trim().toLowerCase(),
        phone: cleanPhone,
        address: savedAddress.trim(),
        city: savedCity.trim(),
        state: savedState.trim(),
        postal_code: savedPin.trim(),
      };
      localStorage.setItem('irisjev_customer_user', JSON.stringify(updatedCust));

      if (onLoginSuccess) {
        onLoginSuccess(updatedCust);
      }

      setIsAddingNewAddress(false);
      setEditingAddressId(null);
      setDetailsSuccess('Shipping & Profile details saved to your address book!');
      setTimeout(() => setDetailsSuccess(null), 3500);
    } catch (err) {
      console.warn('Profile and delivery update error:', err);
    } finally {
      setIsSavingDetails(false);
    }
  };

  if (!customer) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 animate-fadeIn font-body-md">
        <CustomerAuthCard
          onLoginSuccess={(newCust) => {
            if (onLoginSuccess) {
              onLoginSuccess(newCust);
            }
          }}
          onTrackOrder={(query) => {
            setSelectedTrackingQuery(query);
            setTrackModalOpen(true);
          }}
          initialTab="signin"
        />

        <TrackOrderModal
          isOpen={trackModalOpen}
          onClose={() => setTrackModalOpen(false)}
          initialQuery={selectedTrackingQuery}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fadeIn font-body-md">
      {/* Profile Header Banner */}
      <div className="bg-[#1c1b1b] text-white p-6 sm:p-8 rounded-xs border border-[#fed65b]/20 relative overflow-hidden flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>

        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#fed65b]/20 border-2 border-[#fed65b] flex items-center justify-center text-2xl font-bold font-display text-[#fed65b]">
            {customer.full_name?.charAt(0)?.toUpperCase() || 'C'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display-lg text-2xl sm:text-3xl text-white italic">{customer.full_name}</h1>
            </div>
            <p className="text-xs text-white/70 mt-1 flex flex-wrap gap-x-4 gap-y-1">
              {customer.email && <span>✉️ {customer.email}</span>}
              {customer.phone && <span>📞 {customer.phone}</span>}
            </p>
          </div>
        </div>

        <div className="relative flex items-center gap-3">
          <button
            onClick={() => setActiveTab('shop')}
            className="px-4 py-2 bg-white text-[#1c1b1b] text-xs font-label-caps uppercase tracking-wider font-bold rounded-xs hover:bg-[#fed65b] transition-colors cursor-pointer"
          >
            Browse Sculptures
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-white/10 text-white text-xs font-label-caps uppercase tracking-wider font-bold rounded-xs hover:bg-red-600 transition-colors border border-white/20 cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Account Navigation Tabs */}
      <div className="flex border-b border-[#e4e2e2] gap-6 sm:gap-8 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('orders')}
          className={`pb-3 text-xs font-label-caps uppercase tracking-wider font-bold cursor-pointer transition-colors flex items-center gap-1.5 shrink-0 ${activeSubTab === 'orders'
            ? 'text-[#1c1b1b] border-b-2 border-[#1c1b1b]'
            : 'text-[#747878] hover:text-[#1c1b1b]'
            }`}
        >
          <span className="material-symbols-outlined text-sm">local_shipping</span>
          My Orders & Invoices ({orders.length})
        </button>
        <button
          onClick={() => setActiveSubTab('address')}
          className={`pb-3 text-xs font-label-caps uppercase tracking-wider font-bold cursor-pointer transition-colors flex items-center gap-1.5 shrink-0 ${activeSubTab === 'address'
            ? 'text-[#1c1b1b] border-b-2 border-[#1c1b1b]'
            : 'text-[#747878] hover:text-[#1c1b1b]'
            }`}
        >
          <span className="material-symbols-outlined text-sm">contact_mail</span>
          Shipping & Profile Details
        </button>
        <button
          onClick={() => setActiveSubTab('support')}
          className={`pb-3 text-xs font-label-caps uppercase tracking-wider font-bold cursor-pointer transition-colors flex items-center gap-1.5 shrink-0 ${activeSubTab === 'support'
            ? 'text-[#1c1b1b] border-b-2 border-[#1c1b1b]'
            : 'text-[#747878] hover:text-[#1c1b1b]'
            }`}
        >
          <span className="material-symbols-outlined text-sm">support_agent</span>
          Customer Support ({supportTickets.length})
        </button>
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`pb-3 text-xs font-label-caps uppercase tracking-wider font-bold cursor-pointer transition-colors flex items-center gap-1.5 shrink-0 ${activeSubTab === 'overview'
            ? 'text-[#1c1b1b] border-b-2 border-[#1c1b1b]'
            : 'text-[#747878] hover:text-[#1c1b1b]'
            }`}
        >
          <span className="material-symbols-outlined text-sm">dashboard</span>
          Cart & Wishlist Overview
        </button>
      </div>

      {/* TAB 1: ORDER HISTORY & INVOICES (Matching User's Reference Layout) */}
      {activeSubTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-display-lg text-2xl sm:text-3xl text-[#1b1c1c] italic font-bold">
              Order History
            </h2>
            <span className="text-xs text-[#747878] font-label-caps uppercase">
              {orders.length} {orders.length === 1 ? 'Record Found' : 'Records Found'}
            </span>
          </div>

          {isLoadingOrders ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-8 h-8 border-2 border-[#1c1b1b] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-[#747878] font-label-caps uppercase">Loading Your Order History...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white p-12 text-center border border-[#e4e2e2] rounded-xl space-y-4 shadow-2xs">
              <span className="material-symbols-outlined text-5xl text-[#c4c7c7]">inventory_2</span>
              <h3 className="font-display-lg text-xl text-[#1b1c1c] italic">No Orders Placed Yet</h3>
              <p className="text-xs text-[#747878] max-w-sm mx-auto">
                Any orders you complete will appear right here with instant live tracking and downloadable tax invoices.
              </p>
              <button
                onClick={() => setActiveTab('shop')}
                className="px-6 py-3 bg-[#1c1b1b] text-white text-xs font-label-caps uppercase tracking-widest font-bold rounded-xs hover:bg-black transition-colors cursor-pointer"
              >
                Explore Curated Heritage Collection
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const isPaid = order.payment_status === 'paid' || order.status === 'confirmed';
                const isCOD = order.payment_method === 'cod' || order.payment_info === 'Cash on Delivery';
                const isExpanded = expandedOrderId === order.id;

                const orderNum = order.order_number || `#${order.id?.slice(0, 6)?.toUpperCase() || '11931'}`;
                const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <div
                    key={order.id}
                    className="bg-white border border-[#e4e2e2] rounded-xl overflow-hidden shadow-2xs transition-all hover:border-[#1c1b1b]/40"
                  >
                    {/* Sleek Horizontal Summary Header (Inspired by reference screenshot) */}
                    <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
                      {/* Left Info Columns */}
                      <div className="flex flex-wrap items-center gap-6 sm:gap-10 md:gap-12">
                        {/* ORDER # */}
                        <div>
                          <span className="text-[10px] font-bold font-label-caps uppercase tracking-wider text-[#747878] block">
                            ORDER #
                          </span>
                          <span className="font-mono text-xs sm:text-sm font-bold text-[#1b1c1c]">
                            {orderNum}
                          </span>
                        </div>

                        {/* PLACED ON */}
                        <div>
                          <span className="text-[10px] font-bold font-label-caps uppercase tracking-wider text-[#747878] block">
                            PLACED ON
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-[#1b1c1c]">
                            {orderDate}
                          </span>
                        </div>

                        {/* TOTAL AMOUNT */}
                        <div>
                          <span className="text-[10px] font-bold font-label-caps uppercase tracking-wider text-[#747878] block">
                            TOTAL AMOUNT
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-[#1b1c1c]">
                            {formatPrice(order.total_amount || 0, currency)}
                          </span>
                        </div>

                        {/* STATUS */}
                        <div>
                          <span className="text-[10px] font-bold font-label-caps uppercase tracking-wider text-[#747878] block">
                            STATUS
                          </span>
                          {(() => {
                            const s = (order.status || '').toLowerCase().trim();
                            let badgeLabel = 'PROCESSING & PACKING';
                            let badgeClass = 'bg-[#f7f2ea] text-[#735c00] border border-[#e5dccb]';

                            if (s === 'delivered') {
                              badgeLabel = 'DELIVERED';
                              badgeClass = 'bg-emerald-50 text-emerald-800 border border-emerald-200';
                            } else if (s === 'out_for_delivery') {
                              badgeLabel = 'OUT FOR DELIVERY';
                              badgeClass = 'bg-indigo-50 text-indigo-800 border border-indigo-200';
                            } else if (s === 'shipped' || s === 'dispatched' || s === 'in_transit') {
                              badgeLabel = 'SHIPPED / DISPATCHED';
                              badgeClass = 'bg-purple-50 text-purple-900 border border-purple-200';
                            } else if (s === 'packed') {
                              badgeLabel = 'PACKED & READY';
                              badgeClass = 'bg-blue-50 text-blue-900 border border-blue-200';
                            } else if (s === 'cancelled') {
                              badgeLabel = 'CANCELLED';
                              badgeClass = 'bg-red-50 text-red-800 border border-red-200';
                            } else if (isCOD && !isPaid) {
                              badgeLabel = 'CASH ON DELIVERY (PENDING)';
                              badgeClass = 'bg-amber-50 text-amber-800 border border-amber-200';
                            } else if (s === 'confirmed' || isPaid) {
                              badgeLabel = 'PROCESSING & PACKING';
                              badgeClass = 'bg-[#f7f2ea] text-[#735c00] border border-[#e5dccb]';
                            } else if (s) {
                              badgeLabel = s.toUpperCase();
                              badgeClass = 'bg-[#f5f3f3] text-[#444748] border border-[#e4e2e2]';
                            }

                            return (
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block ${badgeClass}`}>
                                {badgeLabel}
                              </span>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Right Action Buttons: Tax Invoice Icon + Accordion Toggle */}
                      <div className="flex items-center gap-2">
                        {/* Tax Invoice Document Button */}
                        <button
                          type="button"
                          title="Download Tax Invoice"
                          onClick={() => handleOpenInvoice(order)}
                          className="w-9 h-9 rounded-lg border border-[#e4e2e2] bg-[#fbfaf8] hover:bg-white hover:border-[#1c1b1b] flex items-center justify-center text-[#747878] hover:text-[#1c1b1b] transition-all cursor-pointer shadow-2xs group"
                        >
                          <span className="material-symbols-outlined text-base group-hover:scale-110 transition-transform">
                            description
                          </span>
                        </button>

                        {/* Accordion Chevron Toggle */}
                        <button
                          type="button"
                          title={isExpanded ? 'Collapse Order Details' : 'Expand Order Details'}
                          onClick={() => toggleOrderExpand(order.id)}
                          className="w-9 h-9 rounded-lg border border-transparent hover:border-[#e4e2e2] hover:bg-[#fbfaf8] flex items-center justify-center text-[#747878] hover:text-[#1c1b1b] transition-all cursor-pointer"
                        >
                          <span
                            className={`material-symbols-outlined text-xl transition-transform duration-200 ${
                              isExpanded ? 'rotate-180 text-[#1c1b1b]' : ''
                            }`}
                          >
                            expand_more
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Order Details Body (Exact Match to User Reference Image) */}
                    {isExpanded && (() => {
                      const getStepIndex = (st?: string, _pst?: string) => {
                        const s = (st || '').toLowerCase();
                        if (s === 'delivered') return 5;
                        if (s === 'out_for_delivery') return 4;
                        if (s === 'dispatched' || s === 'shipped' || s === 'in_transit') return 3;
                        if (s === 'packed') return 2;
                        return 1;
                      };

                      const currentStepIndex = getStepIndex(order.status, order.payment_status);

                      // Comprehensive Address Parser (handles {street, address}, JSON strings, and fallbacks)
                      let rawAddr: any = order.shipping_address;
                      if (typeof rawAddr === 'string') {
                        const trimmed = rawAddr.trim();
                        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                          try {
                            rawAddr = JSON.parse(trimmed);
                          } catch (e) {
                            rawAddr = trimmed;
                          }
                        }
                      }

                      let recipientName = customer.full_name || 'Valued Collector';
                      let recipientPhone = customer.phone || '';
                      let recipientEmail = customer.email || '';
                      let streetLine = '';
                      let cityLine = customer.city || '';
                      let stateLine = customer.state || '';
                      let pinLine = customer.postal_code || '';
                      let countryLine = 'India';

                      if (typeof rawAddr === 'object' && rawAddr !== null) {
                        recipientName = rawAddr.customerName || rawAddr.fullName || customer.full_name || 'Valued Collector';
                        recipientPhone = rawAddr.phone || customer.phone || '';
                        recipientEmail = rawAddr.email || rawAddr.customerEmail || customer.email || '';
                        streetLine = rawAddr.street || rawAddr.address || rawAddr.streetAddress || rawAddr.line1 || customer.address || '';
                        cityLine = rawAddr.city || customer.city || '';
                        stateLine = rawAddr.state || customer.state || '';
                        pinLine = rawAddr.postalCode || rawAddr.postal_code || rawAddr.pincode || customer.postal_code || '';
                        countryLine = rawAddr.country || 'India';
                      } else if (typeof rawAddr === 'string') {
                        let cleanText = rawAddr.replace(/^[,\s]+/, '').trim();
                        if (cleanText.startsWith(',')) cleanText = cleanText.replace(/^[,\s]+/, '');
                        
                        if (!streetLine && customer.address && !cleanText.toLowerCase().includes(customer.address.toLowerCase())) {
                          streetLine = customer.address;
                        } else {
                          streetLine = cleanText;
                        }
                      }

                      streetLine = (streetLine || customer.address || '').replace(/^[,\s]+/, '').trim();

                      const locParts = [];
                      if (cityLine) locParts.push(cityLine.trim());
                      if (stateLine && pinLine) locParts.push(`${stateLine.trim()} - ${pinLine.trim()}`);
                      else if (stateLine) locParts.push(stateLine.trim());
                      else if (pinLine) locParts.push(pinLine.trim());
                      if (countryLine && countryLine !== 'India') locParts.push(countryLine.trim());

                      const cityStatePinStr = locParts.filter(Boolean).join(', ');

                      return (
                        <div className="border-t border-[#ece9e6] bg-[#fcfbfa] p-4 sm:p-6 md:p-8 space-y-6 animate-fadeIn">
                          {/* 1. SHIPMENT PROGRESS CARD */}
                          <div className="bg-white border border-[#e4e2e2] rounded-xl p-5 sm:p-6 space-y-5 shadow-2xs">
                            <div className="border-b border-[#f0efee] pb-3 flex items-center justify-between">
                              <span className="text-xs font-bold font-label-caps uppercase tracking-wider text-[#747878]">
                                SHIPMENT PROGRESS
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTrackingQuery(order.order_number || order.tracking_number || order.id);
                                  setTrackModalOpen(true);
                                }}
                                className="text-xs text-[#735c00] hover:text-[#1c1b1b] font-bold font-label-caps uppercase flex items-center gap-1 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-sm">local_shipping</span>
                                Live Tracking →
                              </button>
                            </div>

                            {/* 5-Step Stepper Progress Bar */}
                            <div className="py-2 px-2 sm:px-6">
                              <div className="relative flex items-center justify-between">
                                {/* Background Gray Line */}
                                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-[#ece9e6] z-0"></div>

                                {/* Active Highlight Line */}
                                <div
                                  className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-[#1c1b1b] z-0 transition-all duration-500"
                                  style={{
                                    width: `${((Math.min(currentStepIndex, 5) - 1) / 4) * 100}%`,
                                  }}
                                ></div>

                                {/* 5 Stepper Milestones */}
                                {[
                                  { step: 1, label: 'Confirmed', icon: 'inventory_2' },
                                  { step: 2, label: 'Packed', icon: 'all_inbox' },
                                  { step: 3, label: 'Dispatched', icon: 'local_shipping' },
                                  { step: 4, label: 'Out for Delivery', icon: 'fmd_good' },
                                  { step: 5, label: 'Delivered', icon: 'check_circle' },
                                ].map(({ step, label, icon }) => {
                                  const isPassedOrCurrent = currentStepIndex >= step;

                                  return (
                                    <div key={step} className="relative z-10 flex flex-col items-center group">
                                      <div
                                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${
                                          isPassedOrCurrent
                                            ? 'bg-[#1c1b1b] text-[#fed65b] shadow-md ring-4 ring-[#fed65b]/20 border border-[#fed65b]/40'
                                            : 'bg-white border-2 border-[#e4e2e2] text-[#747878]'
                                        }`}
                                      >
                                        <span className="material-symbols-outlined text-base sm:text-lg">
                                          {icon}
                                        </span>
                                      </div>
                                      <span
                                        className={`mt-2 text-[10px] sm:text-xs font-bold whitespace-nowrap text-center ${
                                          isPassedOrCurrent ? 'text-[#1b1c1c] font-extrabold' : 'text-[#747878]'
                                        }`}
                                      >
                                        {label}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Estimated Delivery Footnote */}
                            <div className="pt-3 border-t border-[#f0efee] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <span className="text-[10px] font-bold font-label-caps uppercase text-[#747878] block">
                                  ESTIMATED DELIVERY
                                </span>
                                <span className="text-xs sm:text-sm font-bold text-[#1b1c1c]">
                                  2–3 Business Days
                                </span>
                              </div>
                              <span className="text-[11px] text-[#747878] flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm text-[#2e6930]">verified</span>
                                Insured Cargo via BlueDart / Delhivery Air
                              </span>
                            </div>
                          </div>

                          {/* 2. TWO-COLUMN DETAILS GRID */}
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            {/* Left Card: SHIPMENT ITEMS (col-span-7) */}
                            <div className="md:col-span-7 bg-white border border-[#e4e2e2] rounded-xl p-5 sm:p-6 space-y-4 shadow-2xs flex flex-col justify-between">
                              <div>
                                <div className="border-b border-[#f0efee] pb-3">
                                  <span className="text-xs font-bold font-label-caps uppercase tracking-wider text-[#747878]">
                                    SHIPMENT ITEMS
                                  </span>
                                </div>

                                <div className="divide-y divide-[#f0efee]">
                                  {(order.order_items || []).map((item: any, idx: number) => {
                                    const matchedProd = products.find(
                                      p => p.id === item.product_id || p.name === item.product_name || item.product_name?.includes(p.name)
                                    );
                                    const isFreeGift =
                                      item.unit_price === 0 ||
                                      item.product_name?.toLowerCase().includes('gift') ||
                                      item.product_name?.toLowerCase().includes('free');

                                    return (
                                      <div key={idx} className="py-3 first:pt-3 last:pb-0 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-lg bg-[#faf9f8] border border-[#e4e2e2] flex items-center justify-center text-[#735c00] shrink-0 overflow-hidden shadow-2xs">
                                            {matchedProd?.image ? (
                                              <img src={matchedProd.image} alt={item.product_name} className="w-full h-full object-cover" />
                                            ) : (
                                              <span className="material-symbols-outlined text-base">inventory_2</span>
                                            )}
                                          </div>
                                          <div>
                                            <h4 className="font-bold text-xs sm:text-sm text-[#1b1c1c] leading-tight">
                                              {item.product_name}
                                            </h4>
                                            <span className="text-[11px] text-[#747878] block mt-0.5">
                                              Qty: {item.quantity} {item.selected_timber ? `• Timber: ${item.selected_timber}` : ''}
                                            </span>
                                          </div>
                                        </div>
                                        <span className="font-headline-md text-xs sm:text-sm font-bold text-[#1b1c1c] shrink-0">
                                          {isFreeGift ? '₹0' : formatPrice(item.unit_price * item.quantity, currency)}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Right Card: SHIPPING & PAYMENT (col-span-5) */}
                            <div className="md:col-span-5 bg-white border border-[#e4e2e2] rounded-xl p-5 sm:p-6 space-y-4 shadow-2xs flex flex-col justify-between">
                              <div className="space-y-4">
                                <div className="border-b border-[#f0efee] pb-3">
                                  <span className="text-xs font-bold font-label-caps uppercase tracking-wider text-[#747878]">
                                    SHIPPING & PAYMENT
                                  </span>
                                </div>

                                {/* Shipping Address */}
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold font-label-caps uppercase tracking-wider text-[#747878] block">
                                    SHIPPING ADDRESS
                                  </span>
                                  <p className="font-bold text-xs text-[#1b1c1c]">
                                    {recipientName}
                                  </p>
                                  {streetLine && (
                                    <p className="text-xs text-[#444748] leading-snug">
                                      {streetLine}
                                    </p>
                                  )}
                                  {cityStatePinStr && (
                                    <p className="text-xs text-[#444748] leading-snug">
                                      {cityStatePinStr}
                                    </p>
                                  )}
                                  {recipientPhone && (
                                    <p className="text-[11px] text-[#747878] pt-0.5 flex items-center gap-1">
                                      <span className="material-symbols-outlined text-xs text-[#735c00]">call</span>
                                      <span>{recipientPhone}</span>
                                    </p>
                                  )}
                                  {recipientEmail && (
                                    <p className="text-[11px] text-[#747878] pt-0.5 flex items-center gap-1">
                                      <span className="material-symbols-outlined text-xs text-[#735c00]">mail</span>
                                      <span>{recipientEmail}</span>
                                    </p>
                                  )}
                                </div>

                                {/* Payment Method */}
                                <div className="space-y-1 pt-1">
                                  <span className="text-[10px] font-bold font-label-caps uppercase tracking-wider text-[#747878] block">
                                    PAYMENT METHOD
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                        isCOD
                                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                      }`}
                                    >
                                      {isCOD ? 'CASH ON DELIVERY' : 'PREPAID'}
                                    </span>
                                    <span className="text-[11px] text-[#747878]">
                                      Status: <strong className="text-[#1b1c1c] uppercase">{isPaid ? 'CAPTURED' : isCOD ? 'PENDING' : 'PROCESSING'}</strong>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Grand Total Footer */}
                              <div className="pt-4 border-t border-[#f0efee] flex items-center justify-between">
                                <span className="font-bold text-sm text-[#1b1c1c]">
                                  Grand Total:
                                </span>
                                <span className="font-headline-md text-base sm:text-lg font-bold text-[#1b1c1c]">
                                  {formatPrice(order.total_amount || 0, currency)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SHIPPING & PROFILE DETAILS WITH MULTIPLE SAVED ADDRESSES */}
      {activeSubTab === 'address' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left / Main Column: Saved Addresses Book (Multiple Addresses) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e4e2e2] pb-3">
              <div>
                <h3 className="font-headline-md font-bold text-lg text-[#1b1c1c] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#735c00]">contact_mail</span>
                  Saved Delivery Address Book
                </h3>
                <p className="text-xs text-[#747878] mt-0.5">
                  Save multiple addresses (Home, Office, Studio) for instant 1-click selection during checkout.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddingNewAddress(true);
                  setEditingAddressId(null);
                  setSavedLabel('Home');
                  setSavedAddress('');
                  setSavedCity('');
                  setSavedState('Tamil Nadu');
                  setSavedPin('');
                  setIsDefaultAddr(addressList.length === 0);
                }}
                className="px-3.5 py-2 bg-[#1c1b1b] text-white text-xs font-label-caps uppercase font-bold rounded-xs hover:bg-black transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 self-start shadow-2xs"
              >
                <span className="material-symbols-outlined text-sm text-[#fed65b]">add_location_alt</span>
                + Add New Address
              </button>
            </div>

            {detailsSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xs flex items-center gap-2 animate-fadeIn">
                <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
                <span className="font-medium">{detailsSuccess}</span>
              </div>
            )}

            {/* List of Saved Addresses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addressList.length === 0 ? (
                <div className="col-span-2 p-8 text-center bg-white border border-[#e4e2e2] rounded-xs text-[#747878] text-xs">
                  <span className="material-symbols-outlined text-3xl text-[#c4c7c7] mb-2">home_pin</span>
                  <p>No saved addresses yet. Fill out the form to add your primary delivery address.</p>
                </div>
              ) : (
                addressList.map((addr) => (
                  <div
                    key={addr.id}
                    className={`bg-white p-5 border rounded-xs relative flex flex-col justify-between gap-4 transition-all shadow-2xs ${
                      addr.isDefault
                        ? 'border-[#735c00] ring-1 ring-[#735c00]/30'
                        : 'border-[#e4e2e2] hover:border-[#1c1b1b]/40'
                    }`}
                  >
                    <div>
                      {/* Label & Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-[#f5f3f3] border border-[#e4e2e2] rounded-xs text-[10px] font-bold font-label-caps uppercase tracking-wider text-[#1c1b1b]">
                          {addr.label || 'Home'}
                        </span>
                        {addr.isDefault && (
                          <span className="px-2 py-0.5 bg-[#fef9eb] border border-[#fed65b] rounded-full text-[9px] font-bold uppercase tracking-wider text-[#735c00]">
                            ★ Default
                          </span>
                        )}
                      </div>

                      {/* Recipient Details */}
                      <h4 className="font-bold text-sm text-[#1b1c1c]">{addr.fullName}</h4>
                      <p className="text-xs text-[#444748] mt-1 leading-relaxed">
                        {addr.address}
                        <br />
                        {addr.city}, {addr.state} - <span className="font-mono font-bold">{addr.postalCode}</span>
                        <br />
                        {addr.country}
                      </p>
                      <div className="space-y-0.5 mt-2 pt-2 border-t border-[#f0efee]">
                        <p className="text-[11px] text-[#747878] font-mono flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-xs text-[#735c00]">call</span>
                          <span>+91 {addr.phone}</span>
                        </p>
                        {(addr.email || customer.email) && (
                          <p className="text-[11px] text-[#747878] flex items-center gap-1.5 truncate">
                            <span className="material-symbols-outlined text-xs text-[#735c00]">mail</span>
                            <span>{addr.email || customer.email}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="pt-3 border-t border-[#f0efee] flex items-center justify-between text-xs">
                      {!addr.isDefault ? (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(addr.id)}
                          className="text-[#735c00] hover:underline font-bold text-[11px] cursor-pointer"
                        >
                          Set as Default
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#2e6930] font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">check</span> Active Default
                        </span>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditAddress(addr)}
                          className="text-[#1c1b1b] hover:text-[#735c00] font-bold text-[11px] cursor-pointer"
                        >
                          Edit
                        </button>
                        {addressList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-red-600 hover:underline font-bold text-[11px] cursor-pointer"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Link to Checkout */}
            <div className="p-4 bg-[#faf9f8] border border-[#e4e2e2] rounded-xs flex items-center justify-between text-xs">
              <span className="text-[#444748]">
                All saved addresses will appear automatically in the address picker at Checkout.
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('checkout')}
                className="font-bold text-[#735c00] hover:underline cursor-pointer shrink-0 font-label-caps uppercase"
              >
                Go to Checkout →
              </button>
            </div>
          </div>

          {/* Right Column: Add / Edit Address Form */}
          <div className="bg-white p-6 sm:p-7 border border-[#e4e2e2] rounded-xs space-y-5 h-fit shadow-2xs">
            <div className="border-b border-[#e4e2e2] pb-3">
              <h3 className="font-headline-md font-bold text-base text-[#1b1c1c]">
                {editingAddressId ? 'Edit Address' : isAddingNewAddress ? 'Add New Address' : 'Shipping & Profile Details'}
              </h3>
              <p className="text-xs text-[#747878] mt-0.5">
                Save details to your profile & address book.
              </p>
            </div>

            <form onSubmit={handleSaveProfileAndDelivery} className="space-y-4 text-xs">
              {/* Address Label (Home / Office / Studio) */}
              <div className="space-y-1">
                <label className="block uppercase font-label-caps text-[#444748]">
                  Address Label
                </label>
                <div className="flex gap-2">
                  {['Home', 'Office', 'Studio', 'Other'].map(label => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setSavedLabel(label)}
                      className={`px-3 py-1.5 border rounded-xs text-xs font-bold transition-colors cursor-pointer ${
                        savedLabel === label
                          ? 'bg-[#1c1b1b] text-white border-[#1c1b1b]'
                          : 'bg-white text-[#444748] border-[#c4c7c7] hover:border-[#1c1b1b]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="block uppercase font-label-caps text-[#444748]">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={savedFullName}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^[A-Za-z\s.'-]+$/.test(val)) {
                      setSavedFullName(val);
                      if (formErrors.fullName) setFormErrors(prev => ({ ...prev, fullName: '' }));
                    }
                  }}
                  placeholder="e.g. Nirmal Raj"
                  className={`w-full p-2.5 border ${
                    formErrors.fullName ? 'border-red-500 bg-red-50/10' : 'border-[#c4c7c7] focus:border-[#1c1b1b]'
                  } rounded-xs text-sm text-[#1c1b1b] focus:outline-none transition-colors`}
                />
                {formErrors.fullName && (
                  <p className="text-[10px] text-red-600 font-medium mt-0.5">⚠️ {formErrors.fullName}</p>
                )}
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="block uppercase font-label-caps text-[#444748]">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={savedEmail}
                  onChange={(e) => {
                    setSavedEmail(e.target.value);
                    if (formErrors.email) setFormErrors(prev => ({ ...prev, email: '' }));
                  }}
                  placeholder="name@domain.com"
                  className={`w-full p-2.5 border ${
                    formErrors.email ? 'border-red-500 bg-red-50/10' : 'border-[#c4c7c7] focus:border-[#1c1b1b]'
                  } rounded-xs text-sm text-[#1c1b1b] focus:outline-none transition-colors`}
                />
                {formErrors.email && (
                  <p className="text-[10px] text-red-600 font-medium mt-0.5">⚠️ {formErrors.email}</p>
                )}
              </div>

              {/* Mobile Phone */}
              <div className="space-y-1">
                <label className="block uppercase font-label-caps text-[#444748]">
                  Mobile Phone <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <span className="px-2.5 py-2 bg-[#f5f3f3] border border-[#c4c7c7] rounded-xs text-xs font-mono font-bold text-[#444748] flex items-center">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={savedPhone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setSavedPhone(digits);
                      if (formErrors.phone) setFormErrors(prev => ({ ...prev, phone: '' }));
                    }}
                    placeholder="9876543210"
                    className={`flex-1 p-2 border ${
                      formErrors.phone ? 'border-red-500 bg-red-50/10' : 'border-[#c4c7c7] focus:border-[#1c1b1b]'
                    } rounded-xs text-sm text-[#1c1b1b] focus:outline-none transition-colors font-mono`}
                  />
                </div>
                {formErrors.phone && (
                  <p className="text-[10px] text-red-600 font-medium mt-0.5">⚠️ {formErrors.phone}</p>
                )}
              </div>

              {/* Street Address */}
              <div className="space-y-1">
                <label className="block uppercase font-label-caps text-[#444748]">
                  Street Address / House No. <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={savedAddress}
                  onChange={(e) => {
                    setSavedAddress(e.target.value);
                    if (formErrors.address) setFormErrors(prev => ({ ...prev, address: '' }));
                  }}
                  placeholder="Apartment #, Street, Colony..."
                  className={`w-full p-2 border ${
                    formErrors.address ? 'border-red-500 bg-red-50/10' : 'border-[#c4c7c7] focus:border-[#1c1b1b]'
                  } rounded-xs text-sm text-[#1c1b1b] focus:outline-none transition-colors`}
                />
                {formErrors.address && (
                  <p className="text-[10px] text-red-600 font-medium mt-0.5">⚠️ {formErrors.address}</p>
                )}
              </div>

              {/* City & State */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="block uppercase font-label-caps text-[#444748]">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={savedCity}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^[A-Za-z\s.'-]+$/.test(val)) {
                        setSavedCity(val);
                        if (formErrors.city) setFormErrors(prev => ({ ...prev, city: '' }));
                      }
                    }}
                    placeholder="Chennai"
                    className={`w-full p-2 border ${
                      formErrors.city ? 'border-red-500 bg-red-50/10' : 'border-[#c4c7c7] focus:border-[#1c1b1b]'
                    } rounded-xs text-sm text-[#1c1b1b] focus:outline-none transition-colors`}
                  />
                  {formErrors.city && (
                    <p className="text-[10px] text-red-600 font-medium mt-0.5">⚠️ {formErrors.city}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block uppercase font-label-caps text-[#444748]">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={savedState}
                    onChange={(e) => setSavedState(e.target.value)}
                    placeholder="Tamil Nadu"
                    className="w-full p-2 border border-[#c4c7c7] focus:border-[#1c1b1b] rounded-xs text-sm text-[#1c1b1b] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* PIN Code */}
              <div className="space-y-1">
                <label className="block uppercase font-label-caps text-[#444748]">
                  6-Digit PIN Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={savedPin}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setSavedPin(digits);
                    if (formErrors.postalCode) setFormErrors(prev => ({ ...prev, postalCode: '' }));
                  }}
                  placeholder="600031"
                  className={`w-full p-2 border ${
                    formErrors.postalCode ? 'border-red-500 bg-red-50/10' : 'border-[#c4c7c7] focus:border-[#1c1b1b]'
                  } rounded-xs text-sm text-[#1c1b1b] focus:outline-none transition-colors font-mono`}
                />
                {formErrors.postalCode && (
                  <p className="text-[10px] text-red-600 font-medium mt-0.5">⚠️ {formErrors.postalCode}</p>
                )}
              </div>

              {/* Set as Default Checkbox */}
              <label className="flex items-center gap-2 text-xs text-[#444748] cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isDefaultAddr}
                  onChange={(e) => setIsDefaultAddr(e.target.checked)}
                  className="rounded text-[#1c1b1b] focus:ring-0 cursor-pointer"
                />
                <span>Set as primary default address</span>
              </label>

              {/* Submit / Cancel Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isSavingDetails}
                  className="flex-1 py-3 bg-[#1c1b1b] hover:bg-black text-white font-label-caps text-xs uppercase tracking-widest font-bold rounded-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
                >
                  {isSavingDetails ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm text-[#fed65b]">save</span>
                      {editingAddressId ? 'Update Address' : 'Save Address'}
                    </>
                  )}
                </button>

                {(editingAddressId || isAddingNewAddress) && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNewAddress(false);
                      setEditingAddressId(null);
                    }}
                    className="px-3 py-3 bg-[#f5f3f3] hover:bg-[#ece9e6] text-[#444748] font-bold rounded-xs transition-colors cursor-pointer text-xs uppercase"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

  {/* TAB 3: CUSTOMER SUPPORT & INQUIRIES */}
      {activeSubTab === 'support' && (
        <div className="space-y-6">
          {/* Header & New Ticket Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e4e2e2] pb-4">
            <div>
              <h2 className="font-display-lg text-2xl sm:text-3xl text-[#1b1c1c] italic font-bold flex items-center gap-2">
                Customer Support & Concierge
              </h2>
              <p className="text-xs text-[#747878] mt-1">
                Direct assistance for orders, shipments, bespoke commissions, and product inquiries.
              </p>
            </div>
            <button
              onClick={() => {
                setIsCreatingTicket(!isCreatingTicket);
                setTicketError(null);
              }}
              className="px-5 py-2.5 bg-[#1c1b1b] hover:bg-black text-white text-xs font-label-caps uppercase tracking-wider font-bold rounded-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm text-[#fed65b]">
                {isCreatingTicket ? 'close' : 'add_circle'}
              </span>
              <span>{isCreatingTicket ? 'Close Ticket Form' : '+ Raise New Support Ticket'}</span>
            </button>
          </div>

          {/* Success Banner */}
          {ticketSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xs text-xs flex items-center gap-2 animate-in fade-in">
              <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
              <span className="font-semibold">{ticketSuccess}</span>
            </div>
          )}

          {/* New Ticket Creation Form */}
          {isCreatingTicket && (
            <div className="bg-[#fcfbf9] border border-[#d6cebf] p-6 rounded-xs shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="border-b border-[#e8e4db] pb-3 mb-5">
                <h3 className="font-headline-md font-bold text-lg text-[#1b1c1c] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#735c00]">edit_note</span>
                  Submit a Support Inquiry or Service Ticket
                </h3>
                <p className="text-xs text-[#747878] mt-0.5">
                  Our heritage concierge team responds to all inquiries within 2 to 4 business hours.
                </p>
              </div>

              {ticketError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xs text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-red-500">error</span>
                  <span>{ticketError}</span>
                </div>
              )}

              <form onSubmit={handleCreateSupportTicket} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-[11px] font-label-caps uppercase font-bold text-[#1b1c1c] mb-1">
                      Inquiry Category *
                    </label>
                    <select
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value as TicketCategory)}
                      className="w-full text-xs bg-white border border-[#c4c7c7] rounded-xs px-3 py-2.5 text-[#1b1c1c] focus:outline-none focus:border-[#1c1b1b]"
                    >
                      <option value="Order & Shipment">Order & Shipment</option>
                      <option value="Product & Craftsmanship">Product & Craftsmanship</option>
                      <option value="Bespoke Custom Commission">Bespoke Custom Commission</option>
                      <option value="Returns & Replacement">Returns & Replacement</option>
                      <option value="Payment & Billing">Payment & Billing</option>
                      <option value="General Inquiry">General Inquiry</option>
                    </select>
                  </div>

                  {/* Related Order (Optional) */}
                  <div>
                    <label className="block text-[11px] font-label-caps uppercase font-bold text-[#1b1c1c] mb-1">
                      Related Order (Optional)
                    </label>
                    <select
                      value={ticketOrderNumber}
                      onChange={(e) => setTicketOrderNumber(e.target.value)}
                      className="w-full text-xs bg-white border border-[#c4c7c7] rounded-xs px-3 py-2.5 text-[#1b1c1c] focus:outline-none focus:border-[#1c1b1b]"
                    >
                      <option value="">None (General Inquiry)</option>
                      {orders.map((ord) => (
                        <option key={ord.id} value={ord.order_number || `#${ord.id?.slice(0, 6)?.toUpperCase()}`}>
                          {ord.order_number || `#${ord.id?.slice(0, 6)?.toUpperCase()}`} — {formatPrice(ord.total_amount, currency)} ({ord.status || 'Confirmed'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-[11px] font-label-caps uppercase font-bold text-[#1b1c1c] mb-1">
                      Urgency / Priority Level
                    </label>
                    <select
                      value={ticketPriority}
                      onChange={(e) => setTicketPriority(e.target.value as TicketPriority)}
                      className="w-full text-xs bg-white border border-[#c4c7c7] rounded-xs px-3 py-2.5 text-[#1b1c1c] focus:outline-none focus:border-[#1c1b1b]"
                    >
                      <option value="Low">Low — General question</option>
                      <option value="Medium">Medium — Standard inquiry</option>
                      <option value="High">High — Needs fast response</option>
                      <option value="Urgent">Urgent — Immediate shipment / order issue</option>
                    </select>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-[11px] font-label-caps uppercase font-bold text-[#1b1c1c] mb-1">
                    Subject / Short Summary *
                  </label>
                  <input
                    type="text"
                    required
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="e.g. Request to expedite courier dispatch for Temple Door panel"
                    className="w-full text-xs bg-white border border-[#c4c7c7] rounded-xs px-3 py-2.5 text-[#1b1c1c] focus:outline-none focus:border-[#1c1b1b]"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] font-label-caps uppercase font-bold text-[#1b1c1c] mb-1">
                    Detailed Message & Requirements *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={ticketDescription}
                    onChange={(e) => setTicketDescription(e.target.value)}
                    placeholder="Please describe your query in detail. Include any dimensions, delivery dates, or specific questions..."
                    className="w-full text-xs bg-white border border-[#c4c7c7] rounded-xs p-3 text-[#1b1c1c] focus:outline-none focus:border-[#1c1b1b] resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingTicket(false)}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#1b1c1c] text-xs font-label-caps uppercase font-bold rounded-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingTicket}
                    className="px-6 py-2.5 bg-[#1c1b1b] hover:bg-black text-white text-xs font-label-caps uppercase tracking-wider font-bold rounded-xs transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm text-[#fed65b]">send</span>
                    <span>{isSubmittingTicket ? 'Submitting Ticket...' : 'Submit Support Ticket'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tickets List */}
          {isLoadingTickets ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-8 h-8 border-2 border-[#1c1b1b] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-[#747878]">Loading your support inquiries...</p>
            </div>
          ) : supportTickets.length === 0 && !isCreatingTicket ? (
            <div className="bg-white border border-[#e4e2e2] rounded-xs p-8 text-center space-y-4 shadow-2xs">
              <div className="w-16 h-16 rounded-full bg-[#fed65b]/20 flex items-center justify-center mx-auto text-[#735c00]">
                <span className="material-symbols-outlined text-3xl">support_agent</span>
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="font-headline-md font-bold text-lg text-[#1b1c1c]">No Support Inquiries Yet</h3>
                <p className="text-xs text-[#747878] mt-1">
                  Have a question about your order, tracking status, or custom temple woodwork? Submit a ticket anytime and our concierge will assist you.
                </p>
              </div>
              <button
                onClick={() => setIsCreatingTicket(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1c1b1b] hover:bg-black text-white text-xs font-label-caps uppercase tracking-wider font-bold rounded-xs cursor-pointer shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-sm text-[#fed65b]">add_circle</span>
                <span>Submit Your First Inquiry</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {supportTickets.map((ticket) => {
                const isExpanded = expandedTicketId === (ticket.id || ticket.ticket_number);
                const hasAdminResponse = !!ticket.admin_response;

                return (
                  <div
                    key={ticket.id || ticket.ticket_number}
                    className={`bg-white border rounded-xs transition-all overflow-hidden shadow-2xs ${
                      isExpanded ? 'border-[#1c1b1b] ring-1 ring-[#1c1b1b]/10' : 'border-[#e4e2e2] hover:border-[#c4c7c7]'
                    }`}
                  >
                    {/* Ticket Header Row */}
                    <div 
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer bg-[#faf9f8]"
                      onClick={() => setExpandedTicketId(isExpanded ? null : (ticket.id || ticket.ticket_number))}
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#1c1b1b] bg-white px-2.5 py-0.5 rounded border border-[#d6cebf]">
                            {ticket.ticket_number}
                          </span>

                          {/* Status Badge */}
                          {ticket.status === 'open' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300">
                              ● Open / In Review
                            </span>
                          )}
                          {ticket.status === 'in_progress' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-300">
                              ⚙️ In Progress
                            </span>
                          )}
                          {ticket.status === 'resolved' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300">
                              ✓ Resolved
                            </span>
                          )}
                          {ticket.status === 'closed' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-300">
                              🔒 Closed
                            </span>
                          )}

                          {/* Priority Badge */}
                          {ticket.priority === 'Urgent' && (
                            <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase bg-red-100 text-red-700">
                              Urgent
                            </span>
                          )}

                          <span className="text-[11px] text-[#747878] font-medium">
                            Category: <strong className="text-[#1c1b1b]">{ticket.category}</strong>
                          </span>
                        </div>

                        <h4 className="font-bold text-sm text-[#1b1c1c] pt-1">
                          {ticket.subject}
                        </h4>

                        {ticket.order_number && (
                          <p className="text-xs text-[#747878] flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs text-[#735c00]">shopping_bag</span>
                            Related Order: <strong className="font-mono text-[#1b1c1c]">{ticket.order_number}</strong>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right sm:block hidden">
                          <span className="text-[11px] text-[#747878] block">
                            {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                          </span>
                          {hasAdminResponse ? (
                            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5 justify-end">
                              <span className="material-symbols-outlined text-xs">mark_email_read</span> Official Reply Ready
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-700 font-semibold">
                              Awaiting Concierge Reply
                            </span>
                          )}
                        </div>

                        <button className="p-1 rounded-full text-[#747878] hover:bg-white transition-colors">
                          <span className="material-symbols-outlined text-base">
                            {isExpanded ? 'expand_less' : 'expand_more'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Expanded Ticket View with Thread */}
                    {isExpanded && (
                      <div className="p-5 border-t border-[#e4e2e2] bg-white space-y-5 animate-in fade-in duration-150">
                        {/* Customer Original Inquiry */}
                        <div className="bg-[#fbf9f8] border border-[#e4e2e2] rounded-xs p-4 space-y-2">
                          <div className="flex items-center justify-between text-xs text-[#747878] border-b border-[#ece9e6] pb-2">
                            <span className="font-bold text-[#1b1c1c] flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">person</span>
                              Your Initial Message
                            </span>
                            <span>{ticket.created_at ? new Date(ticket.created_at).toLocaleString() : ''}</span>
                          </div>
                          <p className="text-xs text-[#444748] leading-relaxed whitespace-pre-wrap">
                            {ticket.description}
                          </p>
                        </div>

                        {/* Admin Official Response Card (if present) */}
                        {hasAdminResponse && (
                          <div className="bg-[#f8faf8] border-2 border-emerald-300 rounded-xs p-4 space-y-2 shadow-2xs">
                            <div className="flex items-center justify-between text-xs text-emerald-800 border-b border-emerald-200 pb-2">
                              <span className="font-bold flex items-center gap-1 text-emerald-900">
                                <span className="material-symbols-outlined text-base text-emerald-600">verified</span>
                                Official Concierge Response ({ticket.admin_responder_name || 'Irisjev Concierge'})
                              </span>
                              <span className="text-[11px] text-emerald-700">
                                {ticket.admin_responded_at ? new Date(ticket.admin_responded_at).toLocaleString() : 'Recent'}
                              </span>
                            </div>
                            <p className="text-xs text-[#1c1b1b] font-medium leading-relaxed whitespace-pre-wrap">
                              {ticket.admin_response}
                            </p>
                          </div>
                        )}

                        {/* Threaded Follow-up Messages */}
                        {Array.isArray(ticket.messages) && ticket.messages.length > 0 && (
                          <div className="space-y-3 pt-2">
                            <h5 className="text-[11px] font-label-caps uppercase tracking-wider text-[#747878] font-bold">
                              Conversation History
                            </h5>
                            {ticket.messages.map((msg, mIdx) => (
                              <div
                                key={msg.id || mIdx}
                                className={`p-3.5 rounded-xs border text-xs leading-relaxed space-y-1.5 ${
                                  msg.sender === 'admin'
                                    ? 'bg-[#f4f7f6] border-[#cfdedc] ml-4'
                                    : 'bg-[#fbf9f8] border-[#e4e2e2] mr-4'
                                }`}
                              >
                                <div className="flex items-center justify-between text-[11px] text-[#747878] border-b border-black/5 pb-1">
                                  <span className={`font-bold ${msg.sender === 'admin' ? 'text-emerald-900' : 'text-[#1c1b1b]'}`}>
                                    {msg.sender_name} {msg.sender === 'admin' && '• Concierge Staff'}
                                  </span>
                                  <span>{new Date(msg.created_at).toLocaleString()}</span>
                                </div>
                                <p className="text-[#1c1b1b] whitespace-pre-wrap">{msg.message}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Customer Follow-up Reply Box (if ticket is not closed) */}
                        {ticket.status !== 'closed' && (
                          <div className="pt-3 border-t border-[#e4e2e2] space-y-2">
                            <label className="block text-[11px] font-label-caps uppercase font-bold text-[#1b1c1c]">
                              Send Follow-up Reply to Concierge
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={customerReplyText}
                                onChange={(e) => setCustomerReplyText(e.target.value)}
                                placeholder="Type a follow-up message..."
                                className="flex-1 text-xs bg-white border border-[#c4c7c7] rounded-xs px-3 py-2 text-[#1b1c1c] focus:outline-none focus:border-[#1c1b1b]"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendCustomerReply(ticket);
                                  }
                                }}
                              />
                              <button
                                type="button"
                                disabled={isSendingReply || !customerReplyText.trim()}
                                onClick={() => handleSendCustomerReply(ticket)}
                                className="px-4 py-2 bg-[#1c1b1b] hover:bg-black text-white text-xs font-label-caps uppercase font-bold rounded-xs cursor-pointer disabled:opacity-50 flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-sm text-[#fed65b]">send</span>
                                <span>{isSendingReply ? 'Sending...' : 'Reply'}</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CART & WISHLIST OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active Cart */}
          <div className="bg-white p-6 border border-[#e4e2e2] rounded-xs space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-[#e4e2e2] pb-3">
              <h3 className="font-headline-md font-bold text-base text-[#1b1c1c] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">shopping_bag</span>
                Current Cart Items ({cartItems.length})
              </h3>
              <button
                onClick={() => setActiveTab('checkout')}
                className="text-xs text-[#735c00] font-bold hover:underline cursor-pointer"
              >
                Proceed to Checkout →
              </button>
            </div>

            {cartItems.length === 0 ? (
              <p className="text-xs text-[#747878] py-4">Your cart is currently empty.</p>
            ) : (
              <div className="divide-y divide-[#f0efee] max-h-72 overflow-y-auto">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <img src={item.product.image} alt={item.product.name} className="w-10 h-10 object-cover rounded-xs" />
                      <div>
                        <span className="font-bold text-[#1b1c1c] block">{item.product.name}</span>
                        <span className="text-[10px] text-[#747878]">Qty: {item.quantity} • {item.selectedTimber}</span>
                      </div>
                    </div>
                    <span className="font-bold text-[#1b1c1c]">
                      {formatPrice(item.product.priceINR * item.quantity, currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Wishlist */}
          <div className="bg-white p-6 border border-[#e4e2e2] rounded-xs space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-[#e4e2e2] pb-3">
              <h3 className="font-headline-md font-bold text-base text-[#1b1c1c] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-red-500">favorite</span>
                Saved Heritage Wishlist ({wishlist.length})
              </h3>
              <button
                onClick={() => setActiveTab('shop')}
                className="text-xs text-[#735c00] font-bold hover:underline cursor-pointer"
              >
                Browse Shop →
              </button>
            </div>

            {wishlist.length === 0 ? (
              <p className="text-xs text-[#747878] py-4">No items saved to your wishlist yet.</p>
            ) : (
              <div className="divide-y divide-[#f0efee] max-h-72 overflow-y-auto">
                {wishlist.map((prod) => (
                  <div key={prod.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <img src={prod.image} alt={prod.name} className="w-10 h-10 object-cover rounded-xs" />
                      <div>
                        <span className="font-bold text-[#1b1c1c] block">{prod.name}</span>
                        <span className="text-[10px] text-[#747878]">{prod.category}</span>
                      </div>
                    </div>
                    <span className="font-bold text-[#1b1c1c]">
                      {formatPrice(prod.priceINR, currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          isOpen={!!selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
          cartItems={selectedInvoiceOrder.items}
          customerName={selectedInvoiceOrder.customerName}
          address={selectedInvoiceOrder.address}
          currency={currency}
          subtotal={selectedInvoiceOrder.subtotal}
          discountAmount={selectedInvoiceOrder.discountAmount}
          shipping={selectedInvoiceOrder.shipping}
          gstAmount={selectedInvoiceOrder.gstAmount}
          gstRate={selectedInvoiceOrder.gstRate}
          total={selectedInvoiceOrder.total}
          invoiceNumber={selectedInvoiceOrder.invoiceNumber}
          razorpayPaymentId={selectedInvoiceOrder.razorpayPaymentId}
          paymentMethod={selectedInvoiceOrder.paymentMethod}
          codHandlingFee={selectedInvoiceOrder.codHandlingFee}
        />
      )}

      {/* Live Order Tracking Modal */}
      <TrackOrderModal
        isOpen={trackModalOpen}
        onClose={() => setTrackModalOpen(false)}
        initialQuery={selectedTrackingQuery}
      />
    </div>
  );
};
