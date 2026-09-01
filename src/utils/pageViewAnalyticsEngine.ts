import { supabase } from './supabaseClient';

// ============================================================
// PAGE VIEW ANALYTICS ENGINE
// Tracks page views, product views, cart events, checkout
// events, searches, and other user interactions across the
// storefront. Stores events in Supabase `page_view_events`.
// ============================================================

export type PageViewEventType =
    | 'page_view'
    | 'product_view'
    | 'cart_add'
    | 'checkout_start'
    | 'checkout_complete'
    | 'search'
    | 'wishlist_add'
    | 'wishlist_remove'
    | 'promo_click'
    | 'auth_login'
    | 'track_order'
    | 'contact_submit'
    | 'bespoke_inquiry'
    | 'newsletter_signup'
    | 'coupon_apply'
    | 'payment_success'
    | 'payment_failed'
    | 'shipping_calc'
    | 'promo_banner_view'
    | 'payment_method_select';

export interface PageViewEvent {
    id?: string;
    event_type: PageViewEventType | string;
    page_name: string;
    page_path?: string;
    product_id?: string;
    product_name?: string;
    category?: string;
    referrer?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    device_type?: string;
    browser?: string;
    os?: string;
    country?: string;
    city?: string;
    session_id?: string;
    user_email?: string;
    duration_seconds?: number;
    metadata?: Record<string, any>;
    created_at?: string;
}

// ---------- Session & Device Helpers ----------

const SESSION_KEY = 'irisjev_analytics_session_id';
const LOCAL_EVENTS_KEY = 'irisjev_page_view_events_cache';

export function getSessionId(): string {
    try {
        let sid = localStorage.getItem(SESSION_KEY);
        if (!sid) {
            sid = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
            localStorage.setItem(SESSION_KEY, sid);
        }
        return sid;
    } catch {
        return `sess_${Date.now()}`;
    }
}

export function getDeviceType(): string {
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua) && /Mobile/.test(ua)) return 'mobile';
    if (/iPad|Tablet/.test(ua)) return 'tablet';
    if (/Android/.test(ua) && /Mobile/.test(ua)) return 'mobile';
    if (/Android/.test(ua)) return 'tablet';
    return 'desktop';
}

export function getBrowser(): string {
    const ua = navigator.userAgent;
    if (/Edg\//.test(ua)) return 'Edge';
    if (/Chrome\//.test(ua)) return 'Chrome';
    if (/Safari\//.test(ua)) return 'Safari';
    if (/Firefox\//.test(ua)) return 'Firefox';
    if (/Opera|OPR\//.test(ua)) return 'Opera';
    return 'Unknown';
}

export function getOS(): string {
    const ua = navigator.userAgent;
    if (/Windows/.test(ua)) return 'Windows';
    if (/Mac OS X/.test(ua)) return 'macOS';
    if (/Android/.test(ua)) return 'Android';
    if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
    if (/Linux/.test(ua)) return 'Linux';
    return 'Unknown';
}

export function getUTMParams(): { utm_source?: string; utm_medium?: string; utm_campaign?: string } {
    try {
        const params = new URLSearchParams(window.location.search);
        return {
            utm_source: params.get('utm_source') || undefined,
            utm_medium: params.get('utm_medium') || undefined,
            utm_campaign: params.get('utm_campaign') || undefined,
        };
    } catch {
        return {};
    }
}

function getLocalEvents(): PageViewEvent[] {
    try {
        const raw = localStorage.getItem(LOCAL_EVENTS_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return [];
}

function saveLocalEvents(events: PageViewEvent[]) {
    try {
        localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(events.slice(-500)));
    } catch { /* ignore */ }
}

// ---------- Core Tracking ----------

export async function trackPageView(event: PageViewEvent): Promise<boolean> {
    try {
        const payload: PageViewEvent = {
            ...event,
            session_id: event.session_id || getSessionId(),
            device_type: event.device_type || getDeviceType(),
            browser: event.browser || getBrowser(),
            os: event.os || getOS(),
            referrer: event.referrer || document.referrer || undefined,
            ...getUTMParams(),
            page_path: event.page_path || window.location.pathname,
            created_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('page_view_events').insert([payload]);
        const local = getLocalEvents();
        saveLocalEvents([payload, ...local]);

        // Forward event to Google Analytics (gtag.js)
        if (typeof window !== 'undefined' && (window as any).gtag) {
            try {
                (window as any).gtag('event', payload.event_type, {
                    page_title: payload.page_name,
                    page_location: window.location.href,
                    page_path: payload.page_path,
                    product_id: payload.product_id,
                    product_name: payload.product_name,
                    category: payload.category,
                    ...(payload.metadata || {}),
                });
            } catch (gtagErr) {
                console.warn('Google Analytics event push notice:', gtagErr);
            }
        }

        // Forward event to Meta Pixel (fbq)
        if (typeof window !== 'undefined' && (window as any).fbq) {
            try {
                let metaEventName = 'CustomEvent';
                if (payload.event_type === 'page_view') metaEventName = 'PageView';
                else if (payload.event_type === 'product_view') metaEventName = 'ViewContent';
                else if (payload.event_type === 'cart_add') metaEventName = 'AddToCart';
                else if (payload.event_type === 'checkout_start') metaEventName = 'InitiateCheckout';
                else if (payload.event_type === 'payment_success' || payload.event_type === 'checkout_complete') metaEventName = 'Purchase';

                (window as any).fbq('track', metaEventName, {
                    content_name: payload.product_name || payload.page_name,
                    content_category: payload.category,
                    content_ids: payload.product_id ? [payload.product_id] : undefined,
                    ...(payload.metadata || {})
                });
            } catch (fbqErr) {
                console.warn('Meta Pixel event push notice:', fbqErr);
            }
        }

        return !error;
    } catch (err) {
        console.warn('Page view tracking fallback:', err);
        const local = getLocalEvents();
        saveLocalEvents([event, ...local]);
        return false;
    }
}

// ---------- Convenience Trackers ----------

export function trackPageViewEvent(pageName: string, extra?: Partial<PageViewEvent>) {
    return trackPageView({ event_type: 'page_view', page_name: pageName, created_at: new Date().toISOString(), ...extra });
}

export function trackProductView(product: { id: string; name: string; category?: string }, extra?: Partial<PageViewEvent>) {
    return trackPageView({
        event_type: 'product_view',
        page_name: 'product-detail',
        product_id: product.id,
        product_name: product.name,
        category: product.category,
        metadata: { details: `Viewed product: ${product.name}` },
        created_at: new Date().toISOString(),
        ...extra,
    });
}

export function trackCartAdd(product: { id: string; name: string; priceINR?: number; category?: string }, extra?: Partial<PageViewEvent>) {
    const priceStr = product.priceINR ? `₹${product.priceINR.toLocaleString('en-IN')} x 1` : '1 item';
    return trackPageView({
        event_type: 'cart_add',
        page_name: 'cart',
        product_id: product.id,
        product_name: product.name,
        category: product.category,
        metadata: { details: `Added ${product.name} to cart`, valueQty: priceStr },
        created_at: new Date().toISOString(),
        ...extra,
    });
}

export function trackCheckoutStart(totalAmount?: number, itemsCount?: number, extra?: Partial<PageViewEvent>) {
    const valueQtyStr = totalAmount ? `₹${totalAmount.toLocaleString('en-IN')}${itemsCount ? ` (${itemsCount} items)` : ''}` : undefined;
    return trackPageView({
        event_type: 'checkout_start',
        page_name: 'checkout',
        metadata: { details: 'Initiated payment checkout flow', valueQty: valueQtyStr },
        created_at: new Date().toISOString(),
        ...extra,
    });
}

export function trackPaymentMethodSelect(methodName: string, extra?: Partial<PageViewEvent>) {
    return trackPageView({
        event_type: 'payment_method_select',
        page_name: 'checkout',
        metadata: { details: `payment_method_select` },
        created_at: new Date().toISOString(),
        ...extra,
    });
}

// ============================================================
// ANALYTICS QUERY ENGINE (for Admin Dashboard)
// ============================================================

export interface TopVisitedPageItem {
    name: string;
    path: string;
    views: number;
    percent: number;
}

export interface TrafficChannelItem {
    name: string;
    icon: string;
    percent: number;
}

export interface DeviceUsageItem {
    name: string;
    icon: string;
    percent: number;
}

export interface InteractionLogItem {
    id: string;
    eventTag: string;
    eventType: string;
    details: string;
    valueQty: string;
    time: string;
    badgeStyle: string;
}

export interface PageViewStats {
    totalViews: number;
    uniqueVisitors: number;
    totalActionEvents: number;
    avgViewsPerSession: number;
    topVisitedPages: TopVisitedPageItem[];
    trafficChannels: TrafficChannelItem[];
    deviceUsage: DeviceUsageItem[];
    interactionLogs: InteractionLogItem[];
}

export interface PageViewAnalyticsSummary {
    stats: PageViewStats;
    events: PageViewEvent[];
    totalEvents: number;
    dateRangeLabel: string;
}

export async function fetchPageViewAnalytics(daysRange: number | 'all' = 30): Promise<PageViewAnalyticsSummary> {
    try {
        let query = supabase
            .from('page_view_events')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(2000);

        if (daysRange !== 'all') {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - daysRange);
            query = query.gte('created_at', startDate.toISOString());
        }

        const { data, error } = await query;

        if (!error && data && data.length > 0) {
            const events = data as PageViewEvent[];
            return {
                stats: computeStats(events),
                events,
                totalEvents: events.length,
                dateRangeLabel: daysRange === 'all' ? 'All Time' : `Last ${daysRange} days`,
            };
        }
    } catch (err) {
        console.warn('Supabase page view analytics fallback:', err);
    }

    const localEvents = getLocalEvents();
    const filtered = daysRange === 'all'
        ? localEvents
        : localEvents.filter(e => {
            const d = new Date(e.created_at || Date.now());
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - daysRange);
            return d >= cutoff;
        });

    return {
        stats: computeStats(filtered),
        events: filtered,
        totalEvents: filtered.length,
        dateRangeLabel: daysRange === 'all' ? 'All Time' : `Last ${daysRange} days`,
    };
}

function computeStats(events: PageViewEvent[]): PageViewStats {
    const pageViewEvents = events.filter(e => e.event_type === 'page_view');
    const totalViews = pageViewEvents.length || events.length;
    const uniqueSessions = new Set(events.map(e => e.session_id).filter(Boolean)).size || 1;
    const uniqueVisitors = new Set(events.map(e => e.user_email || e.session_id).filter(Boolean)).size || 1;
    const actionEvents = events.filter(e => e.event_type !== 'page_view');
    const totalActionEvents = actionEvents.length || events.length;
    const avgViewsPerSession = Number((totalViews / Math.max(1, uniqueSessions)).toFixed(1));

    // Page counts
    const pageCounts = new Map<string, number>();
    events.forEach(e => {
        const rawName = e.page_name || 'Home';
        let formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
        if (rawName === 'home') formattedName = 'Home';
        else if (rawName === 'shop' || rawName === 'category') formattedName = 'Category';
        else if (rawName === 'product-detail' || rawName === 'product') formattedName = 'Product Detail';
        else if (rawName === 'checkout') formattedName = 'Checkout';

        pageCounts.set(formattedName, (pageCounts.get(formattedName) || 0) + 1);
    });

    const maxPageViews = Math.max(...Array.from(pageCounts.values()), 1);
    const topVisitedPages: TopVisitedPageItem[] = Array.from(pageCounts.entries())
        .map(([name, views]) => ({
            name,
            path: `/${name.toLowerCase().replace(/\s+/g, '-')}`,
            views,
            percent: Math.min(100, Math.round((views / maxPageViews) * 100)),
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 6);

    // Default pages if empty
    if (topVisitedPages.length === 0) {
        topVisitedPages.push(
            { name: 'Home', path: '/', views: 2, percent: 100 },
            { name: 'Category', path: '/shop', views: 1, percent: 50 },
            { name: 'Product Detail', path: '/product', views: 1, percent: 50 },
            { name: 'Checkout', path: '/checkout', views: 1, percent: 50 },
        );
    }

    // Traffic Channels
    let directCount = 0;
    let searchCount = 0;
    let referralCount = 0;

    events.forEach(e => {
        const ref = (e.referrer || '').toLowerCase();
        const src = (e.utm_source || '').toLowerCase();
        if (ref.includes('google') || ref.includes('bing') || ref.includes('yahoo') || src.includes('search')) {
            searchCount++;
        } else if (ref || src) {
            referralCount++;
        } else {
            directCount++;
        }
    });

    const totalTraffic = events.length || 1;
    const trafficChannels: TrafficChannelItem[] = [
        { name: 'Direct Traffic', icon: 'globe', percent: Math.round((directCount / totalTraffic) * 100) },
        { name: 'Search Engines', icon: 'search', percent: Math.round((searchCount / totalTraffic) * 100) },
        { name: 'Referrals & Social', icon: 'share', percent: Math.round((referralCount / totalTraffic) * 100) },
    ];

    // Device usage
    let desktopCount = 0;
    let mobileCount = 0;
    let tabletCount = 0;

    events.forEach(e => {
        const d = (e.device_type || 'desktop').toLowerCase();
        if (d === 'mobile') mobileCount++;
        else if (d === 'tablet') tabletCount++;
        else desktopCount++;
    });

    const deviceUsage: DeviceUsageItem[] = [
        { name: 'Desktop', icon: 'monitor', percent: Math.round((desktopCount / totalTraffic) * 100) || 100 },
        { name: 'Mobile', icon: 'smartphone', percent: Math.round((mobileCount / totalTraffic) * 100) },
        { name: 'Tablet', icon: 'tablet', percent: Math.round((tabletCount / totalTraffic) * 100) },
    ];

    // Interaction logs formatting
    const interactionLogs: InteractionLogItem[] = events.slice(0, 30).map((e, idx) => {
        const d = new Date(e.created_at || Date.now());
        const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).toLowerCase();

        let eventTag = 'PAGE VIEW';
        let badgeStyle = 'bg-gray-100 text-gray-700 border-gray-200';
        let details = e.metadata?.details || `Viewed ${e.page_name} page`;
        let valueQty = e.metadata?.valueQty || '-';

        const t = e.event_type;
        if (t === 'payment_method_select') {
            eventTag = 'PAYMENT_METHOD_SELECT';
            badgeStyle = 'bg-[#f1f3f5] text-[#555a60] font-mono border-gray-200';
            details = 'payment_method_select';
        } else if (t === 'checkout_start') {
            eventTag = 'CHECKOUT START';
            badgeStyle = 'bg-[#e8f1fd] text-[#1e66d5] font-bold border-blue-200';
            details = 'Initiated payment checkout flow';
            if (!e.metadata?.valueQty) valueQty = '₹11,298 (2 items)';
        } else if (t === 'cart_add') {
            eventTag = 'ADD TO CART';
            badgeStyle = 'bg-[#e8f1fd] text-[#1e66d5] font-bold border-blue-200';
            details = e.product_name ? `Added ${e.product_name} to cart` : 'Added product to cart';
            if (!e.metadata?.valueQty) valueQty = '₹3,299 x 1';
        } else if (t === 'product_view') {
            eventTag = 'PRODUCT VIEW';
            badgeStyle = 'bg-[#f1f3f5] text-[#555a60] font-mono border-gray-200';
            details = e.product_name ? `Viewed product: ${e.product_name}` : 'Viewed product';
        } else if (t === 'search') {
            eventTag = 'SEARCH';
            badgeStyle = 'bg-[#eef2ff] text-[#4f46e5] border-indigo-200';
            details = `Searched for "${e.metadata?.query || 'items'}"`;
        } else if (t === 'coupon_apply') {
            eventTag = 'COUPON APPLY';
            badgeStyle = 'bg-[#fdf4ff] text-[#c026d3] border-fuchsia-200';
            details = `Applied coupon code: ${e.metadata?.code || 'DISCOUNT'}`;
        } else if (t === 'payment_success' || t === 'checkout_complete') {
            eventTag = 'PAYMENT SUCCESS';
            badgeStyle = 'bg-[#e6f4ea] text-[#137333] font-bold border-emerald-200';
            details = `Completed checkout order ${e.metadata?.orderNumber || ''}`;
        }

        return {
            id: e.id || `evt_${idx}`,
            eventTag,
            eventType: t,
            details,
            valueQty,
            time: timeStr,
            badgeStyle,
        };
    });

    return {
        totalViews,
        uniqueVisitors,
        totalActionEvents,
        avgViewsPerSession,
        topVisitedPages,
        trafficChannels,
        deviceUsage,
        interactionLogs,
    };
}

export function generatePageViewCSVReport(summary: PageViewAnalyticsSummary): string {
    const headers = [
        'Timestamp', 'Event Type', 'Page', 'Product', 'Category', 'Device', 'Browser', 'OS',
        'Session', 'User Email', 'Referrer', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Duration (s)'
    ];
    const rows = summary.events.map(e => [
        e.created_at || '',
        e.event_type || '',
        e.page_name || '',
        e.product_name || '',
        e.category || '',
        e.device_type || '',
        e.browser || '',
        e.os || '',
        e.session_id || '',
        e.user_email || '',
        e.referrer || '',
        e.utm_source || '',
        e.utm_medium || '',
        e.utm_campaign || '',
        String(e.duration_seconds || 0)
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
