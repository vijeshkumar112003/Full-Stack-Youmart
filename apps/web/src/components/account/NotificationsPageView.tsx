'use client';

import { useEffect, useState } from 'react';
import { Bell, KeyRound, Mail, MessageCircle, Package, Settings2, Tag } from 'lucide-react';
import type { NotificationSettings } from '@youmart/shared-client';
import { api } from '@/lib/api';
import { useSession } from '@/lib/session';
import { NotificationsView } from './NotificationsView';
import { Banner, PageHeader, Panel, Skeleton, Tabs } from './ui';

type Group = keyof NotificationSettings;
type Channel = 'whatsapp' | 'email';

const GROUPS: { key: Group; title: string; sub: string; Icon: typeof Mail }[] = [
  { key: 'orderUpdates', title: 'Order updates', sub: 'Order confirmed, shipped and delivered, refunds and wallet credits.', Icon: Package },
  { key: 'offers', title: 'Offers & promotions', sub: 'Deals, sales and new arrivals.', Icon: Tag },
];
const CHANNELS: { key: Channel; label: string; Icon: typeof Mail; tint: string }[] = [
  { key: 'whatsapp', label: 'WhatsApp', Icon: MessageCircle, tint: 'bg-[#e9f8ef] text-[#16a34a]' },
  { key: 'email', label: 'Email', Icon: Mail, tint: 'bg-[#eef3fc] text-brand' },
];

function Switch({ on, onChange, label, disabled }: { on: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative h-[24px] w-[44px] shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-60 ${on ? 'bg-brand' : 'bg-[#cbd5e1]'}`}
    >
      <span className={`absolute top-[3px] size-[18px] rounded-full bg-white shadow transition-[left] ${on ? 'left-[23px]' : 'left-[3px]'}`} />
    </button>
  );
}

/** W9: which channels order updates and offers are sent on. Saves on every toggle. */
function NotificationSettingsPanel() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.auth
      .getNotificationSettings()
      .then(setSettings)
      .catch(() => setError('Could not load your settings. Please refresh the page.'));
  }, []);

  const toggle = async (group: Group, channel: Channel, value: boolean) => {
    if (!settings) return;
    const previous = settings;
    const next: NotificationSettings = { ...settings, [group]: { ...settings[group], [channel]: value } };
    setSettings(next);
    setError(null);
    setSaved(false);
    try {
      setSettings(await api.auth.setNotificationSettings(next));
      setSaved(true);
    } catch {
      setSettings(previous);
      setError('Could not save. Please try again.');
    }
  };

  const desk = (
    <div className="hidden font-ui lg:block">
      {error ? <Banner tone="error">{error}</Banner> : null}
      <div className="mb-[16px] grid grid-cols-2 gap-[16px]">
        {GROUPS.map((g) => (
          <section key={g.key} aria-labelledby={`ns-${g.key}`} className="rounded-[24px] border border-brand-popup-border bg-white p-[22px] shadow-rail-card">
            <div className="mb-[16px] flex items-start gap-[14px]">
              <span className="flex size-[46px] shrink-0 items-center justify-center rounded-[14px] bg-[linear-gradient(140deg,#0142aa,#3b82f6)] text-white">
                <g.Icon aria-hidden="true" className="size-[21px]" />
              </span>
              <div>
                <h2 id={`ns-${g.key}`} className="text-[18px] font-bold text-heading">
                  {g.title}
                </h2>
                <p className="text-[13.5px] leading-[1.5] text-ink-muted">{g.sub}</p>
              </div>
            </div>
            <ul className="flex flex-col gap-[10px]">
              {CHANNELS.map((c) => (
                <li key={c.key} className="flex items-center gap-[12px] rounded-[16px] bg-[#f8faff] px-[14px] py-[12px]">
                  <span className={`flex size-[38px] items-center justify-center rounded-full ${c.tint}`}>
                    <c.Icon aria-hidden="true" className="size-[18px]" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-[15px] font-bold text-heading">{c.label}</span>
                    <span className="block text-[12.5px] text-ink-muted">
                      {settings ? (settings[g.key][c.key] ? 'On - we’ll send these here' : 'Off') : 'Loading…'}
                    </span>
                  </span>
                  {settings ? (
                    <Switch on={settings[g.key][c.key]} onChange={(v) => void toggle(g.key, c.key, v)} label={`${g.title} on ${c.label}`} />
                  ) : (
                    <Skeleton className="h-[24px] w-[44px] rounded-full" />
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="flex items-center gap-[14px] rounded-[20px] border border-brand-popup-border bg-white px-[18px] py-[14px] shadow-rail-card">
        <span className="flex size-[40px] shrink-0 items-center justify-center rounded-[12px] bg-brand-popup-bg text-brand">
          <KeyRound aria-hidden="true" className="size-[19px]" />
        </span>
        <p className="flex-1 text-[13.5px] text-ink-body">
          <strong className="text-heading">Always on:</strong> your Alerts inbox here gets every update, and security codes (OTP) are always sent.
        </p>
        {saved ? <span className="rounded-full bg-[#e8f8ee] px-[12px] py-[4px] text-[13px] font-bold text-[#15803d]">Saved</span> : null}
      </div>
    </div>
  );

  return (
    <>
    {desk}
    <div className="lg:hidden">
    <Panel title="How we contact you" aside={saved ? <span className="font-ui text-[13px] font-semibold text-[#15803d]">Saved</span> : null} padded={false}>
      {error ? (
        <div className="px-[20px] pt-[16px]">
          <Banner tone="error">{error}</Banner>
        </div>
      ) : null}
      <table className="w-full font-ui">
        <thead>
          <tr className="border-b border-catalog-rule bg-[#fafbfc] text-[12.5px] font-semibold uppercase tracking-[0.04em] text-ink-muted">
            <th scope="col" className="px-[20px] py-[10px] text-left">
              Messages
            </th>
            {CHANNELS.map(({ key, label, Icon }) => (
              <th key={key} scope="col" className="w-[120px] px-[12px] py-[10px]">
                <span className="inline-flex items-center gap-[6px]">
                  <Icon aria-hidden="true" className="size-[14px]" /> {label}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {GROUPS.map((g) => (
            <tr key={g.key} className="border-b border-catalog-rule last:border-0">
              <th scope="row" className="px-[20px] py-[16px] text-left font-normal">
                <span className="block text-[15px] font-semibold text-heading">{g.title}</span>
                <span className="block text-[13px] text-ink-muted">{g.sub}</span>
              </th>
              {CHANNELS.map((c) => (
                <td key={c.key} className="px-[12px] py-[16px] text-center">
                  {settings ? (
                    <span className="inline-flex">
                      <Switch on={settings[g.key][c.key]} onChange={(v) => void toggle(g.key, c.key, v)} label={`${g.title} on ${c.label}`} />
                    </span>
                  ) : (
                    <Skeleton className="mx-auto h-[24px] w-[44px] rounded-full" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-catalog-rule px-[20px] py-[12px] font-ui text-[13px] text-ink-muted">
        Your inbox here always gets every update. Security codes (OTP) are always sent.
      </p>
    </Panel>
    </div>
    </>
  );
}

/** Notifications: the inbox, and (signed in) which channels messages go to. */
export function NotificationsPageView() {
  const session = useSession();
  const [tab, setTab] = useState<'inbox' | 'settings'>('inbox');
  // ?tab=settings (the Account screen's "Notification settings") opens that tab.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('tab') === 'settings') setTab('settings');
  }, []);
  const signedIn = session.status === 'authenticated';
  return (
    <>
      <PageHeader
        title={tab === 'settings' ? 'Notification settings' : 'Alerts'}
        icon={tab === 'settings' ? Settings2 : Bell}
        subtitle={
          tab === 'settings'
            ? 'Choose where we send order updates and offers - WhatsApp, email or both.'
            : 'Order updates, refunds, returns and support replies.'
        }
        actions={
          signedIn ? (
            <Tabs
              label="Notifications"
              value={tab}
              onChange={setTab}
              tabs={[
                { key: 'inbox', label: 'Inbox', icon: Bell },
                { key: 'settings', label: 'Settings', icon: Settings2 },
              ]}
            />
          ) : null
        }
      />
      {tab === 'settings' && signedIn ? <NotificationSettingsPanel /> : <NotificationsView />}
    </>
  );
}
