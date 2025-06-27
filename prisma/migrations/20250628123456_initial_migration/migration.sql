-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" BIGINT,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("sessionToken")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "watchlist" (
    "id" SERIAL NOT NULL,
    "movie_id" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "overview" TEXT,
    "poster" VARCHAR(255),
    "release_date" DATE,
    "media_type" VARCHAR(10),
    "status" VARCHAR(20) DEFAULT 'to_watch',
    "platform" VARCHAR(50),
    "notes" TEXT,
    "watched_date" DATE,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "imdb_id" VARCHAR(50),
    "vote_average" DECIMAL,
    "runtime" INTEGER,
    "seasons" INTEGER,
    "episodes" INTEGER,
    "title_tsv" tsvector,
    "genres" TEXT,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "watchlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platforms" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "logo_url" VARCHAR(255),
    "is_default" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "platforms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMPTZ(6),
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "country" VARCHAR(2) DEFAULT 'AU',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE INDEX "idx_watchlist_movie_id" ON "watchlist"("movie_id");

-- CreateIndex
CREATE INDEX "idx_watchlist_title_trgm" ON "watchlist" USING GIN ("title" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "idx_watchlist_title_tsv" ON "watchlist" USING GIN ("title_tsv");

-- CreateIndex
CREATE INDEX "idx_watchlist_user_id_added_at" ON "watchlist"("user_id", "added_at" DESC);

-- CreateIndex
CREATE INDEX "idx_watchlist_user_id_release_date_desc" ON "watchlist"("user_id", "release_date" DESC);

-- CreateIndex
CREATE INDEX "idx_watchlist_user_id_title_asc" ON "watchlist"("user_id", "title");

-- CreateIndex
CREATE INDEX "idx_watchlist_user_id_vote_average_desc" ON "watchlist"("user_id", "vote_average" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "watchlist" ADD CONSTRAINT "fk_watchlist_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "platforms" ADD CONSTRAINT "fk_platforms_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

