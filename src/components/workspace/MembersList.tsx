import React from 'react';
import { UserPlus, Crown, Edit2, Eye } from 'lucide-react';
import { useWorkspace } from './WorkspaceProvider';
import { supabase } from '@/utils/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Database } from '@/utils/supabase/types';
import { PostgrestError } from '@supabase/supabase-js';

type Tables = Database['public']['Tables'];
type WorkspaceMember = Tables['workspace_members']['Row'];
type Profile = Tables['profiles']['Row'];

interface MembersListProps {
  members: WorkspaceMember[];
}

export function MembersList({ members }: MembersListProps) {
  const { workspace } = useWorkspace();
  const { user } = useAuth();
  const [isInviting, setIsInviting] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState<WorkspaceMember['role']>('viewer');
  const [error, setError] = React.useState<string | null>(null);

  const isOwner = members.some(m => 
    m.user_id === user?.id && m.role === 'owner'
  );

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace?.id) return;

    try {
      // First, get the user's ID from their email
      // TODO: Fix typing issues when upgrading to newer version of @supabase/supabase-js
      // Current type errors are related to complex generic types in Supabase client
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email)
        .limit(1);

      if (profileError) throw profileError;
      if (!profiles || profiles.length === 0) {
        setError('User not found');
        return;
      }

      const profile = profiles[0] as Pick<Profile, 'user_id'>;

      // Then add them as a workspace member
      const newMember = {
        workspace_id: workspace.id,
        user_id: profile.user_id,
        role
      } as const;

      // @ts-ignore - Supabase type inference issue
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert(newMember);

      if (memberError) throw memberError;

      setEmail('');
      setRole('viewer');
      setIsInviting(false);
      setError(null);
    } catch (err) {
      const message = err instanceof PostgrestError ? err.message : 'Failed to invite member';
      setError(message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Members</h3>
        {isOwner && (
          <button
            onClick={() => setIsInviting(!isInviting)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        )}
      </div>

      {isInviting && (
        <form onSubmit={handleInvite} className="space-y-4 p-4 border rounded-lg">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as WorkspaceMember['role'])}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsInviting(false)}
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Invite
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.user_id}
            className="flex items-center justify-between p-3 bg-white rounded-lg border"
          >
            <div className="flex items-center gap-3">
              {member.role === 'owner' ? (
                <Crown className="w-5 h-5 text-yellow-500" />
              ) : member.role === 'editor' ? (
                <Edit2 className="w-5 h-5 text-blue-500" />
              ) : (
                <Eye className="w-5 h-5 text-gray-500" />
              )}
              <div>
                <p className="font-medium">{member.user_id}</p>
                <p className="text-sm text-gray-500">
                  Joined {new Date(member.joined_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <span className="text-sm text-gray-500 capitalize">{member.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}