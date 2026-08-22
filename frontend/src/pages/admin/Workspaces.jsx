import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchUsers = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
      const { data } = await axios.get(`${baseUrl}/api/admin/users`);
      
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    let valA = a[sortField] || '';
    let valB = b[sortField] || '';
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto w-full flex flex-col gap-lg h-full">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-xs">
          <h2 className="font-display-lg text-display-lg text-on-surface">Registered Users</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">View all existing users on the platform.</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-ambient">
        {loading ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/30 text-on-surface-variant font-label-caps text-label-caps">
                <th className="p-sm pl-lg">User</th><th className="p-sm">Email</th><th className="p-sm">Clerk ID</th><th className="p-sm">Joined</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-outline-variant/10 animate-pulse">
                  <td className="p-sm pl-lg flex items-center gap-sm">
                    <div className="w-8 h-8 rounded-full bg-surface-container-high"></div>
                    <div className="h-4 bg-surface-container-high rounded w-32"></div>
                  </td>
                  <td className="p-sm"><div className="h-4 bg-surface-container-high rounded w-40"></div></td>
                  <td className="p-sm"><div className="h-4 bg-surface-container-high rounded w-24"></div></td>
                  <td className="p-sm"><div className="h-4 bg-surface-container-high rounded w-20"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/30 text-on-surface-variant font-label-caps text-label-caps cursor-pointer">
                <th className="p-sm pl-lg hover:text-on-surface transition-colors" onClick={() => handleSort('displayName')}>
                  User {sortField === 'displayName' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-sm hover:text-on-surface transition-colors" onClick={() => handleSort('email')}>
                  Email {sortField === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-sm hover:text-on-surface transition-colors" onClick={() => handleSort('clerkId')}>
                  Clerk ID {sortField === 'clerkId' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-sm hover:text-on-surface transition-colors" onClick={() => handleSort('createdAt')}>
                  Joined {sortField === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map(user => (
                <tr key={user._id} className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                  <td className="p-sm pl-lg font-title-sm text-title-sm text-on-surface flex items-center gap-sm">
                    <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}`} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                    {user.displayName || 'Unknown User'}
                  </td>
                  <td className="p-sm font-body-sm text-on-surface-variant">{user.email}</td>
                  <td className="p-sm font-body-sm text-on-surface-variant font-mono text-[11px]">{user.clerkId}</td>
                  <td className="p-sm font-body-sm text-on-surface-variant">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
