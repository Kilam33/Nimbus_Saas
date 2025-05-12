import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'sonner';
import { Users, UserPlus, Mail, Key, Shield, Edit, Trash2, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/button';
import Input from '../../components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';

interface StaffMember {
  id: string;
  user_id: string;
  role: string;
  pin_code: string | null;
  user: {
    email: string;
  };
}

interface StaffModalProps {
  member?: StaffMember;
  onClose: () => void;
}

const StaffModal: React.FC<StaffModalProps> = ({ member, onClose }) => {
  const { currentStore } = useStore();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState(member?.user.email || '');
  const [role, setRole] = useState(member?.role || 'cashier');
  const [pinCode, setPinCode] = useState(member?.pin_code || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStore) return;

    setIsSubmitting(true);
    try {
      if (member) {
        // Update existing member
        const { error } = await supabase
          .from('store_members')
          .update({
            role,
            pin_code: pinCode || null,
          })
          .eq('id', member.id);

        if (error) throw error;
        toast.success('Staff member updated successfully');
      } else {
        // Check if user exists
        const { data: userData, error: userError } = await supabase
          .from('auth.users')
          .select('id')
          .eq('email', email)
          .single();

        if (userError) {
          toast.error('User not found', {
            description: 'Please ensure the email address is correct'
          });
          return;
        }

        // Add new member
        const { error } = await supabase
          .from('store_members')
          .insert({
            store_id: currentStore.id,
            user_id: userData.id,
            role,
            pin_code: pinCode || null,
          });

        if (error) throw error;
        toast.success('Staff member added successfully');
      }

      queryClient.invalidateQueries(['staff', currentStore.id]);
      onClose();
    } catch (error: any) {
      toast.error(
        member ? 'Failed to update staff member' : 'Failed to add staff member',
        { description: error.message }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {member ? 'Edit Staff Member' : 'Add Staff Member'}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!!member}
            required
            leftIcon={<Mail className="h-5 w-5 text-gray-400" />}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Shield className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="admin">Admin</option>
                <option value="cashier">Cashier</option>
              </select>
            </div>
          </div>

          <Input
            label="PIN Code"
            type="password"
            value={pinCode}
            onChange={(e) => setPinCode(e.target.value)}
            maxLength={4}
            pattern="[0-9]*"
            inputMode="numeric"
            helperText="4-digit PIN for POS access (optional)"
            leftIcon={<Key className="h-5 w-5 text-gray-400" />}
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              type="button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
            >
              {member ? 'Update Staff Member' : 'Add Staff Member'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UserManagement: React.FC = () => {
  const { currentStore } = useStore();
  const queryClient = useQueryClient();
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<StaffMember | undefined>();

  // Fetch staff members
  const { data: staffMembers, isLoading } = useQuery(
    ['staff', currentStore?.id],
    async () => {
      const { data, error } = await supabase
        .from('store_members')
        .select(`
          *,
          user:user_id (
            email
          )
        `)
        .eq('store_id', currentStore?.id);

      if (error) throw error;
      return data;
    },
    {
      enabled: !!currentStore?.id,
    }
  );

  // Delete staff member mutation
  const deleteMutation = useMutation(
    async (memberId: string) => {
      const { error } = await supabase
        .from('store_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['staff', currentStore?.id]);
        toast.success('Staff member removed successfully');
      },
      onError: (error: any) => {
        toast.error('Failed to remove staff member', {
          description: error.message
        });
      },
    }
  );

  const handleDeleteMember = async (member: StaffMember) => {
    if (window.confirm('Are you sure you want to remove this staff member?')) {
      await deleteMutation.mutateAsync(member.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage your store's staff members</p>
        </div>
        <Button
          onClick={() => {
            setSelectedMember(undefined);
            setShowStaffModal(true);
          }}
          leftIcon={<UserPlus className="h-5 w-5" />}
        >
          Add Staff Member
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Members</CardTitle>
          <CardDescription>
            View and manage your store's staff
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PIN Set
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {staffMembers?.map((member) => (
                  <tr key={member.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <Users className="h-4 w-4 text-gray-500" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {member.user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.role === 'admin'
                          ? 'bg-primary-100 text-primary-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {member.pin_code ? (
                        <span className="text-success-500">Yes</span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedMember(member);
                            setShowStaffModal(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteMember(member)}
                        >
                          <Trash2 className="h-4 w-4 text-error-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {(!staffMembers || staffMembers.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                No staff members found. Add staff members to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {showStaffModal && (
        <StaffModal
          member={selectedMember}
          onClose={() => {
            setShowStaffModal(false);
            setSelectedMember(undefined);
          }}
        />
      )}
    </div>
  );
};

export default UserManagement;