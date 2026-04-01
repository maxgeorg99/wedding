import { schema, table, t } from 'spacetimedb/server';
import { SenderError } from 'spacetimedb/server';

const spacetimedb = schema({
  guest: table(
    {
      name: 'guest',
      public: true,
      indexes: [{ accessor: 'byName', algorithm: 'btree', columns: ['name'] }],
    },
    {
      id: t.u64().primaryKey().autoInc(),
      name: t.string(),
      attending: t.bool(),
      plusOne: t.bool(),
      plusOneName: t.string().optional(),
      dietaryNotes: t.string().optional(),
      createdAt: t.timestamp(),
    }
  ),
});
export default spacetimedb;

const SEED_GUESTS = [
  'Alexandra', 
  'Mathias', 
  'Carola', 
  'Lutz', 
  'Ariane', 
  'Rosalie', 
  'Katja',
  'Gabriel', 
  'Maurice', 
  'Sina', 
  'Nic', 
  'Kim', 
  'Jana', 
  'Arne', 
  'Sarah',
  'Tobi', 
  'Chlotti', 
  'Olli', 
  'Lena', 
  'Ilona', 
  'Achim', 
  'Sastatz Weißtor',
  'Mumi', 
  'Angelika', 
  'Michael', 
  'Paul', 
  'Anelise Gründer', 
  'Ute Georg',
  'Hans-Jürgen Georg', 
  'Rebecca', 
  'Lars', 
  'Elke', 
  'Annika', 
  'Jana Cousine',
  'Jorge', 
  'Katja Mandlmaier', 
  'Simon', 
  'Tim', 
  'Marc', 
  'Chris Koller', 
  'Till',
  'Gwendolin', 
  'Tobias', 
  'Julian', 
  'Enno', 
  'Inke', 
  'Franziska', 
  'Bemm',
  'Julia', 
  'Marc (Julia)', 
  'Sami (Karl-Heinz)', 
  'Christine', 
  'Patrick', 
  'Nina',
  'Michi', 
  'Esther', 
  'Mathi', 
  'Selma', 
  'Tatjana', 
  'Anton',
];

export const init = spacetimedb.init((ctx) => {
  for (const name of SEED_GUESTS) {
    ctx.db.guest.insert({
      id: 0n,
      name,
      attending: false,
      plusOne: false,
      plusOneName: undefined,
      dietaryNotes: undefined,
      createdAt: ctx.timestamp,
    });
  }
});

export const onConnect = spacetimedb.clientConnected((_ctx) => {
  // Called every time a new client connects
});

export const onDisconnect = spacetimedb.clientDisconnected((_ctx) => {
  // Called every time a client disconnects
});

export const rsvp = spacetimedb.reducer(
  {
    name: t.string(),
    attending: t.bool(),
    plusOne: t.bool(),
    plusOneName: t.option(t.string()),
    dietaryNotes: t.option(t.string()),
  },
  (ctx, { name, attending, plusOne, plusOneName, dietaryNotes }) => {
    if (!name.trim()) throw new SenderError('Name is required');

    // Check if guest already submitted
    for (const existing of ctx.db.guest.byName.filter(name.trim())) {
      // Update existing RSVP
      ctx.db.guest.id.update({
        ...existing,
        attending,
        plusOne,
        plusOneName: plusOneName ?? undefined,
        dietaryNotes: dietaryNotes ?? undefined,
      });
      return;
    }

    // New RSVP
    ctx.db.guest.insert({
      id: 0n,
      name: name.trim(),
      attending,
      plusOne,
      plusOneName: plusOneName ?? undefined,
      dietaryNotes: dietaryNotes ?? undefined,
      createdAt: ctx.timestamp,
    });
  }
);

export const remove_guest = spacetimedb.reducer(
  { guestId: t.u64() },
  (ctx, { guestId }) => {
    const guest = ctx.db.guest.id.find(guestId);
    if (!guest) throw new SenderError('Guest not found');
    ctx.db.guest.id.delete(guestId);
  }
);
