'use client';

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Clock, Plus, CheckCircle2, Navigation } from 'lucide-react';
import Link from 'next/link';
import { db } from '../../../lib/firebase';
import { collection, addDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore';

export default function UserDashboard() {
  const [activeOrders, setActiveOrders] = useState([]);
  const [isOrdering, setIsOrdering] = useState(false);
  
  // Hardcoded for demo purposes. In a real app, get this from your Auth context.
  const USER_ID = "student-001"; 

  const availableMeals = [
    { id: 'm1', name: 'Spicy Chicken Burger', vendor: 'KFC Bodija', vendorId: 'vendor-001', price: 4500, time: '15 mins' },
    { id: 'm2', name: 'Classic Beef Shawarma', vendor: 'Shawarma King', vendorId: 'vendor-001', price: 3000, time: '12 mins' },
    { id: 'm3', name: 'Student Jollof Combo', vendor: 'Item 7', vendorId: 'vendor-002', price: 1800, time: '10 mins' },
  ];

  // Listen to User's Orders in Real-Time
  useEffect(() => {
    const q = query(collection(db, 'orders'), where('userId', '==', USER_ID));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort client-side for simplicity, showing newest first
      ordersData.sort((a, b) => b.createdAt - a.createdAt);
      setActiveOrders(ordersData);
    });
    return () => unsubscribe();
  }, []);

  const placeOrder = async (meal) => {
    setIsOrdering(true);
    try {
      await addDoc(collection(db, 'orders'), {
        userId: USER_ID,
        vendorId: meal.vendorId,
        vendorName: meal.vendor,
        mealName: meal.name,
        price: meal.price,
        status: 'pending', // pending -> accepted -> out_for_delivery -> delivered
        createdAt: Date.now()
      });
    } catch (error) {
      console.error("Error placing order:", error);
    }
    setIsOrdering(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <nav style={{ background: 'white', padding: '20px 5%', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eaeaea', position: 'sticky', top: 0, zIndex: 10 }}>
        <h1 style={{ margin: 0, fontWeight: 900, fontSize: '24px' }}>ODG<span style={{ color: '#e60000' }}>.</span></h1>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>Block C, Room 42</span>
          <Link href="/" style={{ color: '#e60000', textDecoration: 'none', fontWeight: 700 }}>Log Out</Link>
        </div>
      </nav>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 5%' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '10px' }}>Welcome back! 👋</h2>
        <p style={{ color: '#64748b', marginBottom: '30px' }}>What are you eating today?</p>

        {/* Real-time Order Tracker */}
        {activeOrders.filter(o => o.status !== 'delivered').length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '15px' }}>Active Orders</h3>
            {activeOrders.filter(o => o.status !== 'delivered').map(order => (
              <div key={order.id} style={{ background: order.status === 'pending' ? '#0f172a' : '#e60000', color: 'white', padding: '25px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', transition: '0.3s' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    {order.status === 'pending' ? <Clock size={20} /> : <Navigation size={20} />} 
                    <span style={{ fontWeight: 800, fontSize: '18px', textTransform: 'capitalize' }}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p style={{ margin: 0, opacity: 0.9, fontWeight: 500 }}>{order.mealName} • {order.vendorName}</p>
                </div>
                <div style={{ fontWeight: 800, fontSize: '18px' }}>₦{order.price.toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}

        {/* Menu Section */}
        <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>Trending near you</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {availableMeals.map(meal => (
            <div key={meal.id} style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #eaeaea', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 800 }}>{meal.name}</h4>
                <p style={{ margin: '0 0 15px 0', color: '#64748b', fontSize: '14px', fontWeight: 600 }}>{meal.vendor} • {meal.time}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 900, fontSize: '20px' }}>₦{meal.price.toLocaleString()}</span>
                <button 
                  onClick={() => placeOrder(meal)} 
                  disabled={isOrdering}
                  style={{ background: '#f8f9fa', color: '#e60000', border: '1px solid #eaeaea', padding: '10px 15px', borderRadius: '50px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <Plus size={18} /> Add
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}