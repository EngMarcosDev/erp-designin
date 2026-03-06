const {Client}=require('pg');
(async()=>{
  const c=new Client({
    connectionString:process.env.DATABASE_URL||'postgresql://abacaxita:change_me@postgres:5432/abacaxita_erp?schema=headshop'
  });
  await c.connect();
  const r=await c.query('select id,name,email,role from "User"');
  console.log(r.rows);
  await c.end();
})();
