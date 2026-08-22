import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/users`);
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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
          <div className="flex items-center justify-center p-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/30 text-on-surface-variant font-label-caps text-label-caps">
                <th className="p-sm pl-lg">User</th>
                <th className="p-sm">Email</th>
                <th className="p-sm">Clerk ID</th>
                <th className="p-sm">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id} className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                  <td className="p-sm pl-lg font-title-sm text-title-sm text-on-surface flex items-center gap-sm">
                    <img src={user.imageUrl || '/avatars/avatar_female_light.jpg'} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                    {user.firstName} {user.lastName}
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
