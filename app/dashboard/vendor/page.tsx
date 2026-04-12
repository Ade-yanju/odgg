'use client';

import React, { useState, useEffect } from 'react';
import { Store, Wallet, PackageCheck, ListOrdered, CheckCircle2, ArrowUpRight, Clock } from 'lucide-react';
import Link from 'next/link';
import { db } from '../../../lib/firebase';
import { 
  collection, onSnapshot, query, where, doc, 
  runTransaction, getDoc 
} from 'firebase/firestore';

export default function SiliconValleyVendorDashboard() {
  const [orders, setOrders] = useState([]);
  const [vendorProfile, setVendorProfile] = useState({ balance: 0, totalOrders: 0 });
  const [loading, setLoading] = useState(true);
  
  const VENDOR_ID = "vendor-001"; // In production, this comes from Firebase Auth

  useEffect(() => {
    // 1. Real-time Listener for Orders
    const q = query(collection(db, 'orders'), where('vendorId', '==', VENDOR_ID));
    const unsubOrders = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(ordersData.sort((a, b) => b.createdAt - a.createdAt));
      setLoading(false);
    });

    // 2. Real-time Listener for Vendor Profile (Balance/Stats)
    const unsubProfile = onSnapshot(doc(db, 'vendors', VENDOR_ID), (doc) => {
      if (doc.exists()) setVendorProfile(doc.data());
    });

    return () => { unsubOrders(); unsubProfile(); };
  }, []);

  /**
   * SILICON VALLEY STANDARD: Atomic Transaction
   * This ensures the order is marked 'delivered' AND the money is added 
   * at the exact same microsecond.
   */
  const completeOrderAndCreditBalance = async (order) => {
    const orderRef = doc(db, 'orders', order.id);
    const vendorRef = doc(db, 'vendors', VENDOR_ID);

    try {
      await runTransaction(db, async (transaction) => {
        const vDoc = await transaction.get(vendorRef);
        if (!vDoc.exists()) throw "Vendor does not exist!";

        // Update Order Status
        transaction.update(orderRef, { status: 'delivered', completedAt: Date.now() });

        // Credit Balance & Increment Total Orders
        const newBalance = (vDoc.data().balance || 0) + order.price;
        const newTotal = (vDoc.data().totalOrders || 0) + 1;
        
        transaction.update(vendorRef, { 
          balance: newBalance,
          totalOrders: newTotal 
        });
      });
      console.log("Transaction successful: Money credited.");
    } catch (e) {
      console.error("Transaction failed: ", e);
    }
  };

  const updateStatus = async (id, status) => {
    await runTransaction(db, async (t) => {
      t.update(doc(db, 'orders', id), { status });
    });
  };

  // Logic for UI Tabs/Stats
  const remainingOrders = orders.filter(o => o.status !== 'delivered');
  const completedOrdersCount = orders.filter(o => o.status === 'delivered').length;

  return (
    <div style={{ minHeight: '100vh', background: '#F4F7FE', color: '#1B2559', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Top Nav */}
      <nav style={{ background: 'white', padding: '15px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E0E5F2' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#E60000', padding: '8px', borderRadius: '12px' }}><Store color="white" size={20}/></div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>ODG Business</h2>
        </div>
        <button style={{ background: '#F4F7FE', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Settings</button>
      </nav>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 5%' }}>
        
        {/* Header Section */}
        <header style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px' }}>Dashboard Overview</h1>
          <p style={{ color: '#A3AED0', fontWeight: 500 }}>Real-time metrics for {vendorProfile.storeName || 'Your Store'}</p>
        </header>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          
          {/* Wallet Card */}
          <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', padding: '25px', borderRadius: '24px', color: 'white', position: 'relative', overflow: 'hidden' }}>
            <Wallet style={{ opacity: 0.2, position: 'absolute', right: '-10', bottom: '-10' }} size={100} />
            <p style={{ margin: 0, opacity: 0.7, fontWeight: 600, fontSize: '14px' }}>Available Balance</p>
            <h3 style={{ fontSize: '36px', fontWeight: 800, margin: '10px 0' }}>₦{vendorProfile.balance?.toLocaleString()}</h3>
            <button style={{ background: 'white', color: '#0F172A', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}>Withdraw Funds</button>
          </div>

          <StatCard label="Orders Remaining" value={remainingOrders.length} icon={<ListOrdered color="#E60000"/>} subtitle="Requires Action" />
          <StatCard label="Total Completed" value={vendorProfile.totalOrders} icon={<PackageCheck color="#05CD99"/>} subtitle="Lifetime Sales" />
        </div>

        {/* Order Management Pipeline */}
        <div style={{ background: 'white', borderRadius: '24px', padding: '25px', boxShadow: '0px 10px 30px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Active Pipeline</h3>
            <span style={{ fontSize: '13px', background: '#E6000015', color: '#E60000', padding: '5px 12px', borderRadius: '8px', fontWeight: 800 }}>{remainingOrders.length} LIVE</span>
          </div>

          {remainingOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#A3AED0' }}>All caught up! No pending orders.</div>
          ) : (
            remainingOrders.map(order => (
              <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', border: '1px solid #F4F7FE', borderRadius: '18px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <div style={{ background: '#F4F7FE', height: '50px', width: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={22} color="#422AFB"/>
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontWeight: 800 }}>{order.mealName}</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#A3AED0', fontWeight: 600 }}>Order #{order.id.slice(-5).toUpperCase()} • ₦{order.price}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  {order.status === 'pending' && (
                    <button onClick={() => updateStatus(order.id, 'accepted')} style={actionBtn('#E60000')}>Accept</button>
                  )}
                  {order.status === 'accepted' && (
                    <button onClick={() => updateStatus(order.id, 'out_for_delivery')} style={actionBtn('#0F172A')}>Dispatch</button>
                  )}
                  {order.status === 'out_for_delivery' && (
                    <button onClick={() => completeOrderAndCreditBalance(order)} style={actionBtn('#05CD99')}>Mark Delivered</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

// Sub-components for cleaner code
function StatCard({ label, value, icon, subtitle }) {
  return (
    <div style={{ background: 'white', padding: '25px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid #E0E5F2' }}>
      <div style={{ background: '#F4F7FE', padding: '15px', borderRadius: '16px' }}>{icon}</div>
      <div>
        <p style={{ margin: 0, color: '#A3AED0', fontSize: '14px', fontWeight: 600 }}>{label}</p>
        <h3 style={{ margin: '5px 0', fontSize: '24px', fontWeight: 800 }}>{value}</h3>
        <p style={{ margin: 0, color: '#05CD99', fontSize: '12px', fontWeight: 700 }}>{subtitle}</p>
      </div>
    </div>
  );
}

const actionBtn = (bg) => ({
  background: bg,
  color: 'white',
  border: 'none',
  padding: '12px 24px',
  borderRadius: '12px',
  fontWeight: 800,
  cursor: 'pointer',
  transition: 'transform 0.2s',
  fontSize: '14px'
});