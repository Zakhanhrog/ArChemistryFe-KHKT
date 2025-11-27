import UserManagement from '@/components/admin/UserManagement';

export default function UsersPage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Quản lý Users</h1>
      <UserManagement />
    </div>
  );
}

