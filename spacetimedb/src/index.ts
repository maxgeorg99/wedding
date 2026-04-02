import { schema, table, t } from 'spacetimedb/server';
import { SenderError } from 'spacetimedb/server';

const spacetimedb = schema({
  guest: table(
    {
      name: 'guest',
      public: true,
      indexes: [
        { accessor: 'byName', algorithm: 'btree', columns: ['name'] },
        { accessor: 'byIdentity', algorithm: 'btree', columns: ['claimedBy'] },
      ],
    },
    {
      id: t.u64().primaryKey().autoInc(),
      name: t.string(),
      attending: t.bool(),
      plusOne: t.bool(),
      plusOneName: t.string().optional(),
      dietaryNotes: t.string().optional(),
      claimedBy: t.identity().optional(),
      createdAt: t.timestamp(),
    }
  ),
  heartScore: table(
    {
      name: 'heart_score',
      public: true,
      indexes: [{ accessor: 'byPlayerName', algorithm: 'btree', columns: ['playerName'] }],
    },
    {
      id: t.u64().primaryKey().autoInc(),
      playerName: t.string(),
      score: t.u64(),
      updatedAt: t.timestamp(),
    }
  ),
});
export default spacetimedb;

const SEED_GUESTS = [
  'Alexandra Hahn',
  'Mathias Hahn',
  'Carola Hahn',
  'Lutz Hahn',
  'Ariane Hahn',
  'Katja Niederröst',
  'Gabriel Deufel',
  'Maurice Deufel',
  'Sina Geiger',
  'Nic Burmeister',
  'Kim Geiger',
  'Jana Gnann',
  'Arne Selting',
  'Sarah Arnold',
  'Tobias Kraus',
  'Charlotte Fietz',
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
      claimedBy: undefined,
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
      // Update existing RSVP and bind identity
      ctx.db.guest.id.update({
        ...existing,
        attending,
        plusOne,
        plusOneName: plusOneName ?? undefined,
        dietaryNotes: dietaryNotes ?? undefined,
        claimedBy: ctx.sender,
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
      claimedBy: ctx.sender,
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


export const submit_score = spacetimedb.reducer(
  { score: t.u64() },
  (ctx, { score }) => {
    // Resolve guest name from identity — only RSVP'd guests can play
    let guestName: string | undefined;
    for (const guest of ctx.db.guest.byIdentity.filter(ctx.sender)) {
      guestName = guest.name;
      break;
    }
    if (!guestName) throw new SenderError('Du musst dich zuerst anmelden (RSVP)');

    // Check if player already has a score — keep the best one
    for (const existing of ctx.db.heartScore.byPlayerName.filter(guestName)) {
      if (score > existing.score) {
        ctx.db.heartScore.id.update({ ...existing, score, updatedAt: ctx.timestamp });
      }
      return;
    }

    ctx.db.heartScore.insert({
      id: 0n,
      playerName: guestName,
      score,
      updatedAt: ctx.timestamp,
    });
  }
);
