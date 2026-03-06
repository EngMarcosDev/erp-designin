INSERT INTO "User" ("name","email","password","role","isActive","emailVerified","createdAt","updatedAt")
VALUES ('Administrador','adm.abacaxita@gmail.com','$2b$10$yKIz8yEYjhLZ.zuTeGGlvO264N1mows7ordb3JzY8Vsge05Eg65CG','ADMIN',true,true,NOW(),NOW())
ON CONFLICT ("email") DO UPDATE SET
  "password" = EXCLUDED."password",
  "isActive" = true,
  "emailVerified" = true,
  "name" = EXCLUDED."name",
  "updatedAt" = NOW();
