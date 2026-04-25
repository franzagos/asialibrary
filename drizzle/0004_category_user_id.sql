ALTER TABLE "category" ADD COLUMN "user_id" text REFERENCES "user"("id") ON DELETE CASCADE;
