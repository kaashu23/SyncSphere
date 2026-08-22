import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', date: '' });

  const fetchEvents = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';
      const { data } = await axios.get(`${baseUrl}/api/admin/events`);
      setEvents(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const baseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';
      const { data } = await axios.post(`${baseUrl}/api/admin/events`, formData);
      setEvents([...events, data]);
      setShowModal(false);
      setFormData({ title: '', description: '', date: '' });
      toast.success('Event created and broadcasted!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to create event');
    }
  };

  const handleDelete = async (id) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';
      await axios.delete(`${baseUrl}/api/admin/events/${id}`);
      setEvents(events.filter(e => e._id !== id));
      toast.success('Event deleted');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete event');
    }
  };

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto w-full flex flex-col gap-lg h-full">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-xs">
          <h2 className="font-display-lg text-display-lg text-on-surface">Platform Events</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Schedule announcements and maintenance windows.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-primary text-on-primary rounded-full font-label-caps hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm shadow-primary/20">
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Event
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-ambient p-4">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl border border-outline-variant/20 bg-surface-container-high animate-pulse h-32"></div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-on-surface-variant gap-4">
            <span className="material-symbols-outlined text-6xl opacity-50">calendar_month</span>
            <p className="font-title-md">No upcoming events</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map(event => (
              <div key={event._id} className="p-4 rounded-xl border border-outline-variant/30 bg-surface flex flex-col gap-2 hover:border-primary/50 transition-colors group relative">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-1 bg-primary-container text-on-primary-container rounded font-label-caps text-[10px]">{new Date(event.date).toLocaleDateString()}</span>
                  <button onClick={() => handleDelete(event._id)} className="text-error opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-error-container/20 rounded-full">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
                <h3 className="font-title-md text-on-surface mt-2">{event.title}</h3>
                <p className="font-body-sm text-on-surface-variant">{event.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-md p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-sm text-on-surface">Create Event</h2>
              <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container-high">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-on-surface">Title</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:border-primary outline-none" placeholder="e.g. Scheduled Maintenance" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-on-surface">Description</label>
                <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:border-primary outline-none min-h-[100px]" placeholder="Details about the event..." />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-on-surface">Date</label>
                <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:border-primary outline-none" />
              </div>
              
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-on-surface hover:bg-surface-container-high rounded-full font-label-caps">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-on-primary rounded-full font-label-caps hover:bg-primary/90 shadow-md">Create Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
