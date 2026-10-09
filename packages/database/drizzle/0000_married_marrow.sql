CREATE TABLE "urls" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "urls_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"short_url" varchar(8) NOT NULL,
	"long_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"used_count" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "urls_short_url_unique" UNIQUE("short_url"),
	CONSTRAINT "urls_long_url_length_check" CHECK (length("urls"."long_url") <= 2048)
);
