ALTER TABLE "book" ADD COLUMN "description_it" text;--> statement-breakpoint
ALTER TABLE "book" ADD COLUMN "description_en" text;--> statement-breakpoint
ALTER TABLE "book" ADD COLUMN "description_ru" text;--> statement-breakpoint
ALTER TABLE "book" DROP COLUMN "description";
