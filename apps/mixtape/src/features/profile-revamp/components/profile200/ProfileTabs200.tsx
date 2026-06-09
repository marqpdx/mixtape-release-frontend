'use client';

const TABS = [
  { id: 'storyline', label: 'Storyline', active: false },
  { id: 'profile',   label: 'Profile',   active: true  },
  { id: 'writing',   label: 'Writing',   active: false },
];

export function ProfileTabs200() {
  return (
    <div
      className="p200-tabs-root"
      role="tablist"
      style={{
        display: 'flex',
        gap: 30,
        boxShadow: 'inset 0 -1px 0 var(--line)',
        paddingBottom: 0,
      }}
    >
      {TABS.map(tab => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={tab.active}
          disabled={!tab.active}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: tab.active ? '2.5px solid var(--accent)' : '2.5px solid transparent',
            borderRadius: tab.active ? '2px 2px 0 0' : 0,
            padding: '10px 0',
            fontSize: 16,
            fontWeight: tab.active ? 700 : 500,
            color: tab.active ? 'var(--ink)' : 'var(--ink-3)',
            cursor: tab.active ? 'default' : 'not-allowed',
            marginBottom: -1,
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
