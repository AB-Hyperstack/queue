'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import type { AdminOrgListItem, AdminOrgListResponse } from '@/lib/types/database';
import TopBar from '@/components/layout/TopBar';
import StatBlock from '@/components/queue/StatBlock';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { format } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  trialing: 'bg-amber-50 text-amber-700',
  active: 'bg-green-50 text-green-700',
  past_due: 'bg-orange-50 text-orange-700',
  canceled: 'bg-gray-100 text-gray-600',
  expired: 'bg-red-50 text-red-700',
  none: 'bg-gray-100 text-gray-500',
};

export default function AdminOrganizationsPage() {
  const t = useTranslations('AdminOrgs');
  const tc = useTranslations('Common');
  const [data, setData] = useState<AdminOrgListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Edit modal
  const [editOrg, setEditOrg] = useState<AdminOrgListItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete modal
  const [deleteOrg, setDeleteOrg] = useState<AdminOrgListItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      const { data: result } = await supabase.rpc('admin_get_org_list', {
        p_limit: 200,
        p_offset: 0,
      });
      if (!cancelled) {
        if (result) setData(result as unknown as AdminOrgListResponse);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const filteredOrgs = data?.orgs?.filter((org) =>
    org.name.toLowerCase().includes(search.toLowerCase()) ||
    org.slug.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const trialingCount = data?.orgs?.filter((o) => o.subscription_status === 'trialing').length ?? 0;
  const payingCount = data?.orgs?.filter((o) => o.subscription_status === 'active').length ?? 0;

  // Edit handlers
  function openEdit(org: AdminOrgListItem) {
    setEditOrg(org);
    setEditName(org.name);
    setEditSlug(org.slug);
    setEditError('');
  }

  async function handleSaveEdit() {
    if (!editOrg || !editName.trim() || !editSlug.trim()) return;
    setEditLoading(true);
    setEditError('');

    const supabase = createClient();
    const { error } = await supabase.rpc('admin_update_organization', {
      p_org_id: editOrg.id,
      p_name: editName.trim(),
      p_slug: editSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''),
    });

    if (error) {
      setEditError(error.message.includes('Slug') ? t('slugTaken') : t('updateFailed'));
      setEditLoading(false);
      return;
    }

    setEditOrg(null);
    setEditLoading(false);
    setRefreshKey((k) => k + 1);
  }

  // Delete handlers
  async function handleDelete() {
    if (!deleteOrg) return;
    setDeleteLoading(true);

    const supabase = createClient();
    await supabase.rpc('admin_delete_organization', { p_org_id: deleteOrg.id });

    setDeleteOrg(null);
    setDeleteLoading(false);
    setRefreshKey((k) => k + 1);
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar title={t('title')} subtitle={t('registered', { count: data?.total ?? 0 })} />

      <div className="flex-1 overflow-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatBlock
            label={t('total')}
            value={data?.total ?? 0}
            color="blue"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5M3.75 3v18m4.5-18v18m4.5-18v18m4.5-18v18m4.5-18v18" />
              </svg>
            }
          />
          <StatBlock
            label={t('trialing')}
            value={trialingCount}
            color="amber"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatBlock
            label={t('paying')}
            value={payingCount}
            color="green"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Search */}
        <div className="mb-4">
          <Input
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">{t('organization')}</th>
                  <th className="px-4 py-3 font-medium text-gray-500">{t('status')}</th>
                  <th className="px-4 py-3 font-medium text-gray-500">{t('plan')}</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-right">{t('queues')}</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-right">{t('tickets')}</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-right">{t('staff')}</th>
                  <th className="px-4 py-3 font-medium text-gray-500">{t('created')}</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrgs.map((org) => (
                  <tr key={org.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-medium text-gray-900">{org.name}</span>
                        <span className="block text-xs text-gray-400">/{org.slug}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_COLORS[org.subscription_status] || STATUS_COLORS.none
                      }`}>
                        {org.subscription_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {org.plan || '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{org.queue_count}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{org.ticket_count}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{org.staff_count}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {format(new Date(org.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(org)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                          title="Edit"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteOrg(org)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredOrgs.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                      {search ? t('noMatch') : t('noOrgs')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Edit Modal */}
      <Modal open={!!editOrg} onClose={() => setEditOrg(null)} title={t('editOrg')}>
        <div className="space-y-4">
          <Input
            label={t('orgName')}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <Input
            label={t('urlSlug')}
            value={editSlug}
            onChange={(e) => setEditSlug(e.target.value)}
            error={editError || undefined}
          />
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={() => setEditOrg(null)}>
              {tc('cancel')}
            </Button>
            <Button
              onClick={handleSaveEdit}
              loading={editLoading}
              disabled={!editName.trim() || !editSlug.trim()}
            >
              {t('saveChanges')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteOrg} onClose={() => setDeleteOrg(null)} title={t('deleteOrg')}>
        <div className="space-y-4">
          <div className="rounded-lg bg-red-50 border border-red-100 p-4">
            <p className="text-sm text-red-800">
              {t.rich('deleteWarning', {
                name: deleteOrg?.name ?? '',
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>
            <ul className="mt-2 text-sm text-red-700 space-y-1">
              <li>- {t('staffMembers', { count: deleteOrg?.staff_count ?? 0 })}</li>
              <li>- {t('queueCount', { count: deleteOrg?.queue_count ?? 0 })}</li>
              <li>- {t('ticketCount', { count: deleteOrg?.ticket_count ?? 0 })}</li>
              <li>- {t('allAnalytics')}</li>
              <li>- {t('subscriptionRecord')}</li>
            </ul>
          </div>
          <p className="text-sm text-gray-600">
            {t('cannotUndo')}
          </p>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={() => setDeleteOrg(null)}>
              {tc('cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleteLoading}
            >
              {t('deletePermanently')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
