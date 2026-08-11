import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AuthProvider, useAuth } from 'react-oidc-context';
import { SpacetimeDBProvider } from 'spacetimedb/react';
import { useTable, useReducer } from 'spacetimedb/react';
import { DbConnection, tables, reducers, type ErrorContext } from './module_bindings/index.ts';
import { OIDC_CONFIG, isEmailAllowed } from './auth.ts';
import { Identity } from 'spacetimedb';
import FallingLeaves from './FallingLeaves';

const HOST = import.meta.env.VITE_SPACETIMEDB_HOST ?? 'ws://localhost:3000';
const DB_NAME = import.meta.env.VITE_SPACETIMEDB_DB_NAME ?? 'wedding';

function onSigninCallback() {
  window.history.replaceState({}, document.title, window.location.pathname);
}

export default function PlannerPage() {
  return (
    <AuthProvider {...OIDC_CONFIG} onSigninCallback={onSigninCallback}>
      <PlannerGate />
    </AuthProvider>
  );
}

/** Handles OIDC auth state — login, email check, then renders the authenticated planner */
function PlannerGate() {
  const auth = useAuth();

  if (auth.isLoading) {
    return (
      <>
        <FallingLeaves />
        <div className="wedding-page" style={{ paddingTop: '4rem', textAlign: 'center' }}>
          <p style={{ color: '#8b7355' }}>Laden...</p>
        </div>
      </>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <>
        <FallingLeaves />
        <div className="wedding-page" style={{ paddingTop: '2rem', textAlign: 'center' }}>
          <Link to="/" className="back-link">&larr; Zurück</Link>
          <p className="hero-label">Hochzeit</p>
          <h1>Planner</h1>
          <hr className="section-divider" />
          <p style={{ color: '#6b5744', marginBottom: '1.5rem' }}>
            Bitte melde dich an, um den Planner zu nutzen.
          </p>
          <button className="rsvp-submit" onClick={() => auth.signinRedirect()}>
            Anmelden
          </button>
        </div>
      </>
    );
  }

  const userEmail = auth.user?.profile?.email as string | undefined;
  if (!isEmailAllowed(userEmail)) {
    return (
      <>
        <FallingLeaves />
        <div className="wedding-page" style={{ paddingTop: '2rem', textAlign: 'center' }}>
          <Link to="/" className="back-link">&larr; Zurück</Link>
          <p className="hero-label">Hochzeit</p>
          <h1>Planner</h1>
          <hr className="section-divider" />
          <p style={{ color: '#6b5744', marginBottom: '1rem' }}>
            Kein Zugang. Dieser Bereich ist nur für Claudia &amp; Maximilian.
          </p>
          <p style={{ color: '#8b7355', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Angemeldet als: {userEmail}
          </p>
          <button className="rsvp-submit" onClick={() => auth.signoutRedirect()}>
            Abmelden
          </button>
        </div>
      </>
    );
  }

  return <AuthenticatedPlanner idToken={auth.user!.id_token!} email={userEmail!} onSignOut={() => auth.signoutRedirect()} />;
}

/** Creates a SpacetimeDB connection using the OIDC id_token so the server sees JWT claims */
function AuthenticatedPlanner({ idToken, email, onSignOut }: { idToken: string; email: string; onSignOut: () => void }) {
  const connectionBuilder = useMemo(() => {
    const onConnect = (conn: DbConnection, identity: Identity, _token: string) => {
      console.log('Planner connected with identity:', identity.toHexString());
      conn.subscriptionBuilder().subscribe([
        'SELECT * FROM guest',
        'SELECT * FROM wedding_todo',
        'SELECT * FROM budget_item',
        'SELECT * FROM timeline_entry',
        'SELECT * FROM timeline_config',
      ]);
    };
    const onConnectError = (_ctx: ErrorContext, err: Error) => {
      console.error('Planner connection error:', err);
    };

    return DbConnection.builder()
      .withUri(HOST)
      .withDatabaseName(DB_NAME)
      .withToken(idToken)
      .onConnect(onConnect)
      .onConnectError(onConnectError);
  }, [idToken]);

  return (
    <SpacetimeDBProvider connectionBuilder={connectionBuilder}>
      <PlannerContent email={email} onSignOut={onSignOut} />
    </SpacetimeDBProvider>
  );
}

function PlannerContent({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const [guests] = useTable(tables.guest);
  const [todos] = useTable(tables.weddingTodo);
  const [budgetItems] = useTable(tables.budgetItem);
  const [timelineEntries] = useTable(tables.timelineEntry);
  const [timelineConfigs] = useTable(tables.timelineConfig);
  const addTodo = useReducer(reducers.addTodo);
  const toggleTodo = useReducer(reducers.toggleTodo);
  const deleteTodo = useReducer(reducers.deleteTodo);
  const addGuest = useReducer(reducers.addGuest);
  const removeGuest = useReducer(reducers.removeGuest);
  const renameGuest = useReducer(reducers.renameGuest);
  const addBudgetItem = useReducer(reducers.addBudgetItem);
  const updateBudgetItem = useReducer(reducers.updateBudgetItem);
  const deleteBudgetItem = useReducer(reducers.deleteBudgetItem);
  const addTimelineEntry = useReducer(reducers.addTimelineEntry);
  const updateTimelineEntry = useReducer(reducers.updateTimelineEntry);
  const deleteTimelineEntry = useReducer(reducers.deleteTimelineEntry);
  const toggleTimelineReleased = useReducer(reducers.toggleTimelineReleased);

  const [newTodo, setNewTodo] = useState('');
  const [newGuest, setNewGuest] = useState('');
  const [activeTab, setActiveTab] = useState<'guests' | 'todos' | 'budget' | 'timeline'>('guests');
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [editingName, setEditingName] = useState('');
  const [guestFilter, setGuestFilter] = useState<'all' | 'attending' | 'declined' | 'pending'>('all');
  const [dietaryFilter, setDietaryFilter] = useState<string | null>(null);
  const [newBudgetName, setNewBudgetName] = useState('');
  const [newBudgetAmount, setNewBudgetAmount] = useState('');
  const [editingBudgetId, setEditingBudgetId] = useState<bigint | null>(null);
  const [editingBudgetActual, setEditingBudgetActual] = useState('');
  const [newTimelineTime, setNewTimelineTime] = useState('');
  const [newTimelineTitle, setNewTimelineTitle] = useState('');
  const [newTimelineLocation, setNewTimelineLocation] = useState('');
  const [editingTimelineId, setEditingTimelineId] = useState<bigint | null>(null);
  const [editingTimelineTime, setEditingTimelineTime] = useState('');
  const [editingTimelineTitle, setEditingTimelineTitle] = useState('');
  const [editingTimelineLocation, setEditingTimelineLocation] = useState('');

  const sortedTodos = [...todos].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return Number(a.sortOrder - b.sortOrder);
  });

  const attending = guests.filter((g) => g.attending);
  const plusOnes = guests.filter((g) => g.plusOne);

  const dietaryCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const g of guests) {
      if (!g.dietaryNotes) continue;
      const tokens = g.dietaryNotes
        .split(/[,;/]|\bund\b|\n/)
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);
      for (const token of tokens) {
        counts[token] = (counts[token] || 0) + 1;
      }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [guests]);

  const handleAddTodo = () => {
    if (!newTodo.trim() || !addTodo) return;
    addTodo({ title: newTodo.trim() });
    setNewTodo('');
  };

  const handleToggleTodo = (id: bigint) => {
    if (!toggleTodo) return;
    toggleTodo({ todoId: id });
  };

  const handleDeleteTodo = (id: bigint) => {
    if (!deleteTodo) return;
    deleteTodo({ todoId: id });
  };

  const handleAddGuest = () => {
    if (!newGuest.trim() || !addGuest) return;
    addGuest({ name: newGuest.trim() });
    setNewGuest('');
  };

  const handleRemoveGuest = (id: bigint) => {
    if (!removeGuest) return;
    removeGuest({ guestId: id });
  };

  const startEditing = (id: bigint, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const handleRename = () => {
    if (!renameGuest || editingId === null || !editingName.trim()) return;
    renameGuest({ guestId: editingId, newName: editingName.trim() });
    setEditingId(null);
    setEditingName('');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  const TOTAL_BUDGET = 1_000_000n; // 10.000 € in cents
  const totalPlanned = budgetItems.reduce((sum, i) => sum + i.planned, 0n);
  const totalActual = budgetItems.reduce((sum, i) => sum + (i.actual ?? 0n), 0n);
  const remaining = TOTAL_BUDGET - totalPlanned;

  const handleAddBudgetItem = () => {
    if (!newBudgetName.trim() || !newBudgetAmount.trim() || !addBudgetItem) return;
    const amount = BigInt(Math.round(parseFloat(newBudgetAmount) * 100));
    if (amount <= 0n) return;
    addBudgetItem({ name: newBudgetName.trim(), planned: amount });
    setNewBudgetName('');
    setNewBudgetAmount('');
  };

  const handleDeleteBudgetItem = (id: bigint) => {
    if (!deleteBudgetItem) return;
    deleteBudgetItem({ itemId: id });
  };

  const handleTogglePaid = (item: (typeof budgetItems)[number]) => {
    if (!updateBudgetItem) return;
    updateBudgetItem({ itemId: item.id, name: item.name, planned: item.planned, actual: item.actual ?? undefined, paid: !item.paid });
  };

  const startEditingActual = (item: (typeof budgetItems)[number]) => {
    setEditingBudgetId(item.id);
    setEditingBudgetActual(item.actual != null ? (Number(item.actual) / 100).toFixed(2) : '');
  };

  const handleSaveActual = (item: (typeof budgetItems)[number]) => {
    if (!updateBudgetItem) return;
    const actual = editingBudgetActual.trim() ? BigInt(Math.round(parseFloat(editingBudgetActual) * 100)) : undefined;
    updateBudgetItem({ itemId: item.id, name: item.name, planned: item.planned, actual, paid: item.paid });
    setEditingBudgetId(null);
    setEditingBudgetActual('');
  };

  const formatEuro = (cents: bigint) => {
    const num = Number(cents) / 100;
    return num.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
  };

  const isTimelineReleased = timelineConfigs.some((c) => c.released);
  const sortedTimeline = [...timelineEntries].sort((a, b) => a.time.localeCompare(b.time));

  const handleAddTimelineEntry = () => {
    if (!newTimelineTime.trim() || !newTimelineTitle.trim() || !addTimelineEntry) return;
    addTimelineEntry({ time: newTimelineTime.trim(), title: newTimelineTitle.trim(), location: newTimelineLocation.trim() || undefined });
    setNewTimelineTime('');
    setNewTimelineTitle('');
    setNewTimelineLocation('');
  };

  const startEditingTimeline = (entry: (typeof timelineEntries)[number]) => {
    setEditingTimelineId(entry.id);
    setEditingTimelineTime(entry.time);
    setEditingTimelineTitle(entry.title);
    setEditingTimelineLocation(entry.location ?? '');
  };

  const handleSaveTimeline = () => {
    if (!updateTimelineEntry || editingTimelineId === null) return;
    updateTimelineEntry({ entryId: editingTimelineId, time: editingTimelineTime.trim(), title: editingTimelineTitle.trim(), location: editingTimelineLocation.trim() || undefined });
    setEditingTimelineId(null);
  };

  const cancelEditingTimeline = () => {
    setEditingTimelineId(null);
  };

  const handleDeleteTimelineEntry = (id: bigint) => {
    if (!deleteTimelineEntry) return;
    deleteTimelineEntry({ entryId: id });
  };

  const handleToggleRelease = () => {
    if (!toggleTimelineReleased) return;
    const newState = !isTimelineReleased;
    const msg = newState
      ? 'Zeitplan veröffentlichen? Gäste können ihn dann auf der Homepage sehen.'
      : 'Zeitplan zurückziehen? Gäste sehen dann wieder "wird noch bekannt gegeben".';
    if (window.confirm(msg)) {
      toggleTimelineReleased({ released: newState });
    }
  };

  return (
    <>
      <FallingLeaves />
      <div className="wedding-page">
        <div className="rsvp-page-header">
          <Link to="/" className="back-link">&larr; Zurück</Link>
          <p className="hero-label">Hochzeit</p>
          <h1>Planner</h1>
          <p style={{ color: '#8b7355', fontSize: '0.8rem', marginTop: '0.25rem' }}>
            {email} · <button onClick={onSignOut} style={{ background: 'none', border: 'none', color: '#c4956a', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline', padding: 0 }}>Abmelden</button>
          </p>
        </div>

        <hr className="section-divider" />

        {/* Stats */}
        <div className="planner-stats">
          <div className="planner-stat">
            <span className="planner-stat-value">{guests.length}</span>
            <span className="planner-stat-label">Eingeladen</span>
          </div>
          <div className="planner-stat">
            <span className="planner-stat-value">{attending.length}</span>
            <span className="planner-stat-label">Zugesagt</span>
          </div>
          <div className="planner-stat">
            <span className="planner-stat-value">{plusOnes.length}</span>
            <span className="planner-stat-label">+1</span>
          </div>
          <div className="planner-stat">
            <span className="planner-stat-value">{attending.length + plusOnes.length}</span>
            <span className="planner-stat-label">Gesamt</span>
          </div>
        </div>

        {/* Tab bar */}
        <div className="planner-tabs">
          <button
            className={`planner-tab ${activeTab === 'guests' ? 'active' : ''}`}
            onClick={() => setActiveTab('guests')}
          >
            Gästeliste ({guests.length})
          </button>
          <button
            className={`planner-tab ${activeTab === 'todos' ? 'active' : ''}`}
            onClick={() => setActiveTab('todos')}
          >
            Todos ({todos.filter((t) => !t.done).length})
          </button>
          <button
            className={`planner-tab ${activeTab === 'budget' ? 'active' : ''}`}
            onClick={() => setActiveTab('budget')}
          >
            Budget
          </button>
          <button
            className={`planner-tab ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            Zeitplan {isTimelineReleased ? '' : '(Entwurf)'}
          </button>
        </div>

        {/* Guest List Tab */}
        {activeTab === 'guests' && (
          <section className="planner-section">
            <div className="planner-add-row">
              <input
                type="text"
                value={newGuest}
                onChange={(e) => setNewGuest(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddGuest()}
                placeholder="Neuen Gast hinzufügen..."
                className="planner-input"
              />
              <button onClick={handleAddGuest} className="planner-add-btn">+</button>
            </div>
            <div className="planner-filter-row">
              {(['all', 'attending', 'declined', 'pending'] as const).map((f) => (
                <button
                  key={f}
                  className={`planner-filter-btn ${guestFilter === f ? 'active' : ''}`}
                  onClick={() => { setGuestFilter(f); setDietaryFilter(null); }}
                >
                  {{ all: 'Alle', attending: 'Zugesagt', declined: 'Abgesagt', pending: 'Offen' }[f]}
                </button>
              ))}
            </div>
            {dietaryCategories.length > 0 && (
              <div className="planner-filter-row">
                {dietaryCategories.map(([cat, count]) => (
                  <button
                    key={cat}
                    className={`planner-filter-btn ${dietaryFilter === cat ? 'active' : ''}`}
                    onClick={() => {
                      setDietaryFilter(dietaryFilter === cat ? null : cat);
                      setGuestFilter('all');
                    }}
                  >
                    {cat} ({count})
                  </button>
                ))}
              </div>
            )}
            <ul className="planner-guest-list">
              {[...guests]
                .filter((g) => {
                  if (dietaryFilter && (!g.dietaryNotes || !g.dietaryNotes.toLowerCase().includes(dietaryFilter))) return false;
                  if (guestFilter === 'attending') return g.attending;
                  if (guestFilter === 'declined') return !g.attending && !!g.claimedBy;
                  if (guestFilter === 'pending') return !g.attending && !g.claimedBy;
                  return true;
                })
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((guest) => (
                  <li key={guest.id.toString()} className="planner-guest-item">
                    <div className="planner-guest-info">
                      {editingId === guest.id ? (
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename();
                            if (e.key === 'Escape') cancelEditing();
                          }}
                          onBlur={handleRename}
                          autoFocus
                          className="planner-input planner-edit-input"
                        />
                      ) : (
                        <span
                          className="planner-guest-name planner-guest-name-editable"
                          onClick={() => startEditing(guest.id, guest.name)}
                          title="Klicken zum Bearbeiten"
                        >
                          {guest.name}
                        </span>
                      )}
                      <span className={`planner-guest-status ${guest.attending ? 'attending' : guest.claimedBy ? 'declined' : 'pending'}`}>
                        {guest.attending ? 'Zugesagt' : guest.claimedBy ? 'Abgesagt' : 'Offen'}
                      </span>
                    </div>
                    <div className="planner-guest-details">
                      {guest.plusOne && (
                        <span className="planner-guest-tag">+1{guest.plusOneName ? `: ${guest.plusOneName}` : ''}</span>
                      )}
                      {guest.dietaryNotes && (
                        <span className="planner-guest-tag">{guest.dietaryNotes}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveGuest(guest.id)}
                      className="planner-delete-btn"
                      title="Gast entfernen"
                    >
                      &times;
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        )}

        {/* Todo Tab */}
        {activeTab === 'todos' && (
          <section className="planner-section">
            <div className="planner-add-row">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                placeholder="Neues Todo hinzufügen..."
                className="planner-input"
              />
              <button onClick={handleAddTodo} className="planner-add-btn">+</button>
            </div>
            <ul className="planner-todo-list">
              {sortedTodos.map((todo) => (
                <li key={todo.id.toString()} className={`planner-todo-item ${todo.done ? 'done' : ''}`}>
                  <label className="planner-todo-label">
                    <input
                      type="checkbox"
                      checked={todo.done}
                      onChange={() => handleToggleTodo(todo.id)}
                    />
                    <span>{todo.title}</span>
                  </label>
                  <button
                    onClick={() => handleDeleteTodo(todo.id)}
                    className="planner-delete-btn"
                    title="Todo löschen"
                  >
                    &times;
                  </button>
                </li>
              ))}
              {todos.length === 0 && (
                <li className="planner-empty">Noch keine Todos vorhanden.</li>
              )}
            </ul>
          </section>
        )}

        {/* Budget Tab */}
        {activeTab === 'budget' && (
          <section className="planner-section">
            {/* Budget overview */}
            <div className="budget-overview">
              <div className="budget-overview-row">
                <span>Gesamtbudget</span>
                <span className="budget-total">{formatEuro(TOTAL_BUDGET)}</span>
              </div>
              <div className="budget-progress-bar">
                <div
                  className="budget-progress-fill"
                  style={{ width: `${Math.min(Number(totalPlanned * 100n / TOTAL_BUDGET), 100)}%` }}
                />
                {totalActual > 0n && (
                  <div
                    className="budget-progress-actual"
                    style={{ width: `${Math.min(Number(totalActual * 100n / TOTAL_BUDGET), 100)}%` }}
                  />
                )}
              </div>
              <div className="budget-overview-row budget-overview-details">
                <span>Geplant: {formatEuro(totalPlanned)}</span>
                <span>Bezahlt: {formatEuro(totalActual)}</span>
                <span className={remaining < 0n ? 'budget-over' : 'budget-ok'}>
                  {remaining < 0n ? `${formatEuro(-remaining)} über Budget` : `${formatEuro(remaining)} übrig`}
                </span>
              </div>
            </div>

            {/* Add budget item */}
            <div className="planner-add-row">
              <input
                type="text"
                value={newBudgetName}
                onChange={(e) => setNewBudgetName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddBudgetItem()}
                placeholder="z.B. Location, Catering..."
                className="planner-input"
              />
              <input
                type="number"
                value={newBudgetAmount}
                onChange={(e) => setNewBudgetAmount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddBudgetItem()}
                placeholder="Betrag €"
                className="planner-input budget-amount-input"
                min="0"
                step="0.01"
              />
              <button onClick={handleAddBudgetItem} className="planner-add-btn">+</button>
            </div>

            {/* Budget items list */}
            <ul className="budget-list">
              {[...budgetItems]
                .sort((a, b) => Number(b.planned - a.planned))
                .map((item) => (
                  <li key={item.id.toString()} className={`budget-item ${item.paid ? 'paid' : ''}`}>
                    <div className="budget-item-main">
                      <label className="budget-item-check">
                        <input
                          type="checkbox"
                          checked={item.paid}
                          onChange={() => handleTogglePaid(item)}
                          title="Bezahlt"
                        />
                      </label>
                      <div className="budget-item-info">
                        <span className="budget-item-name">{item.name}</span>
                        <span className="budget-item-planned">{formatEuro(item.planned)}</span>
                      </div>
                      <div className="budget-item-actual">
                        {editingBudgetId === item.id ? (
                          <input
                            type="number"
                            value={editingBudgetActual}
                            onChange={(e) => setEditingBudgetActual(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveActual(item);
                              if (e.key === 'Escape') { setEditingBudgetId(null); setEditingBudgetActual(''); }
                            }}
                            onBlur={() => handleSaveActual(item)}
                            placeholder="Bezahlt €"
                            className="planner-input planner-edit-input budget-actual-input"
                            autoFocus
                            min="0"
                            step="0.01"
                          />
                        ) : (
                          <span
                            className="budget-actual-display"
                            onClick={() => startEditingActual(item)}
                            title="Klicken für tatsächlich gezahlten Betrag"
                          >
                            {item.actual != null ? formatEuro(item.actual) : '—'}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteBudgetItem(item.id)}
                        className="planner-delete-btn"
                        title="Posten löschen"
                      >
                        &times;
                      </button>
                    </div>
                    {/* Bar showing proportion of total budget */}
                    <div className="budget-item-bar">
                      <div
                        className="budget-item-bar-fill"
                        style={{ width: `${Math.min(Number(item.planned * 100n / TOTAL_BUDGET), 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
              {budgetItems.length === 0 && (
                <li className="planner-empty">Noch keine Budget-Posten vorhanden.</li>
              )}
            </ul>
          </section>
        )}

        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <section className="planner-section">
            {/* Release toggle */}
            <div className="timeline-release-bar">
              <span className={`timeline-status ${isTimelineReleased ? 'released' : 'draft'}`}>
                {isTimelineReleased ? 'Veröffentlicht' : 'Entwurf'}
              </span>
              <button onClick={handleToggleRelease} className={`timeline-release-btn ${isTimelineReleased ? 'retract' : ''}`}>
                {isTimelineReleased ? 'Zurückziehen' : 'Veröffentlichen'}
              </button>
            </div>

            {/* Add timeline entry */}
            <div className="planner-add-row timeline-add-row">
              <input
                type="text"
                value={newTimelineTime}
                onChange={(e) => setNewTimelineTime(e.target.value)}
                placeholder="Uhrzeit"
                className="planner-input timeline-time-input"
              />
              <input
                type="text"
                value={newTimelineTitle}
                onChange={(e) => setNewTimelineTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTimelineEntry()}
                placeholder="Programmpunkt"
                className="planner-input"
              />
              <input
                type="text"
                value={newTimelineLocation}
                onChange={(e) => setNewTimelineLocation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTimelineEntry()}
                placeholder="Ort (optional)"
                className="planner-input timeline-location-input"
              />
              <button onClick={handleAddTimelineEntry} className="planner-add-btn">+</button>
            </div>

            {/* Timeline entries */}
            <ul className="timeline-editor-list">
              {sortedTimeline.map((entry) => (
                <li key={entry.id.toString()} className="timeline-editor-item">
                  {editingTimelineId === entry.id ? (
                    <div className="timeline-edit-row">
                      <input
                        type="text"
                        value={editingTimelineTime}
                        onChange={(e) => setEditingTimelineTime(e.target.value)}
                        className="planner-input timeline-time-input"
                        autoFocus
                      />
                      <input
                        type="text"
                        value={editingTimelineTitle}
                        onChange={(e) => setEditingTimelineTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveTimeline();
                          if (e.key === 'Escape') cancelEditingTimeline();
                        }}
                        className="planner-input"
                      />
                      <input
                        type="text"
                        value={editingTimelineLocation}
                        onChange={(e) => setEditingTimelineLocation(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveTimeline();
                          if (e.key === 'Escape') cancelEditingTimeline();
                        }}
                        placeholder="Ort (optional)"
                        className="planner-input timeline-location-input"
                      />
                      <button onClick={handleSaveTimeline} className="planner-add-btn timeline-save-btn">Speichern</button>
                      <button onClick={cancelEditingTimeline} className="planner-delete-btn">&times;</button>
                    </div>
                  ) : (
                    <div className="timeline-display-row">
                      <span className="timeline-editor-time">{entry.time}</span>
                      <div className="timeline-editor-info" onClick={() => startEditingTimeline(entry)} title="Klicken zum Bearbeiten">
                        <span className="timeline-editor-title">{entry.title}</span>
                        {entry.location && <span className="timeline-editor-location">{entry.location}</span>}
                      </div>
                      <button onClick={() => handleDeleteTimelineEntry(entry.id)} className="planner-delete-btn" title="Eintrag löschen">&times;</button>
                    </div>
                  )}
                </li>
              ))}
              {timelineEntries.length === 0 && (
                <li className="planner-empty">Noch keine Zeitplan-Einträge vorhanden.</li>
              )}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}