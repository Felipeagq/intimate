import { sql } from "drizzle-orm";
import { db } from "../src/server/db/client";

async function main() {
  const r = await db.execute(sql`
    select couple_id, fecha_local, count(*) as n
    from devotionals
    where scope = 'pareja' and couple_id is not null
    group by couple_id, fecha_local
    having count(*) > 1
  `);
  console.log("grupos duplicados:", r.rows.length, r.rows);
  const t = await db.execute(
    sql`select scope, count(*) as n from devotionals group by scope`,
  );
  console.log("devocionales por tipo:", t.rows);
}

main().then(() => process.exit(0));
